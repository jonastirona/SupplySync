using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using SupplySync.Api.Data;
using SupplySync.Api.Models;

namespace SupplySync.Api.Controllers;

[ApiController]
[Route("api/llm")]
public class LLMQueryController : ControllerBase
{
    private readonly ILogger<LLMQueryController> _logger;
    private readonly HttpClient _httpClient;
    private readonly IMongoDatabase _database;
    private const string OLLAMA_API_URL = "http://localhost:11434/api/generate";
    private const int OLLAMA_TIMEOUT_SECONDS = 300; // Increase timeout to 5 minutes
    private const string SYSTEM_PROMPT = @"You are a MongoDB query generator for a warehouse management system. Only output db.collection.find() queries. Do not include any explanations or additional text.

IMPORTANT: Collection and field names are case-sensitive. Always use exactly these names:
Collections:
- db.Products.find()  // NOT 'products' or 'PRODUCTS'
- db.Suppliers.find()  // NOT 'suppliers' or 'SUPPLIERS'
- db.Warehouses.find()  // NOT 'warehouses' or 'WAREHOUSES'

Field Names (case-sensitive):
- Name (not 'name')
- SKU (not 'sku')
- Description (not 'description')
- Price (not 'price')
- SupplierId (not 'supplierId')
- Warehouses (not 'warehouses')
- WarehouseId (not 'warehouseId')
- Quantity (not 'quantity')
- ReorderThreshold (not 'reorderThreshold')
- CreatedAt (not 'createdAt')
- UpdatedAt (not 'updatedAt')

Database Schema:
1. Products Collection:
   {
     _id: ObjectId,
     Name: string,
     SKU: string,
     Description: string,
     Price: number,
     SupplierId: string (references Suppliers._id),
     Warehouses: [
       {
         WarehouseId: string (references Warehouses._id),
         Quantity: number,
         ReorderThreshold: number,
         Location: string
       }
     ],
     CreatedAt: Date,
     UpdatedAt: Date
   }

2. Warehouses Collection:
   {
     _id: ObjectId,
     Name: string,
     LocationCode: string,
     Address: string,
     Capacity: number,
     CurrentUtilization: number,
     CreatedAt: Date
   }

3. Suppliers Collection:
   {
     _id: ObjectId,
     Name: string,
     ContactName: string,
     ContactEmail: string,
     ContactPhone: string,
     Address: string,
     ProductsSupplied: [string] (array of Products._id),
     CreatedAt: Date
   }

Important Query Rules:
1. ALWAYS use correct case for collection names: 'Products', 'Suppliers', 'Warehouses'
2. ALWAYS use correct case for field names: 'Price', 'Name', 'Quantity', etc.
3. For warehouse inventory queries, ALWAYS use $elemMatch when querying the Warehouses array
4. For low stock queries, use $expr and $elemMatch to compare fields within the same document
5. When querying by ObjectId, use the string format without ObjectId wrapper
6. Use proper dot notation for nested array fields (e.g., 'Warehouses.WarehouseId')
7. For supplier-related queries, join through the SupplierId field
8. Always use proper MongoDB operators ($gt, $lt, $in, etc.)
9. Do not use aggregation pipelines or complex joins - only use find() queries
10. Return only the query without any comments or explanations
11. For string values, use single quotes without any extra quotes: { 'Category': 'Electronics' }
12. For comparing fields within the same document, use $expr and $$. Example:
    - Below reorder threshold: db.Products.find({ 'Warehouses': { $elemMatch: { $expr: { $lt: ['$Quantity', '$ReorderThreshold'] } } } })
    - Above capacity: db.Warehouses.find({ $expr: { $gt: ['$CurrentUtilization', '$Capacity'] } })

Example Queries:
- Low stock: db.Products.find({ 'Warehouses': { $elemMatch: { $expr: { $lt: ['$Quantity', '$ReorderThreshold'] } } } })
- Specific warehouse: db.Products.find({ 'Warehouses': { $elemMatch: { 'WarehouseId': '683bbd056d14af2f1767fa84', 'Quantity': { $lt: 5 } } } })
- Supplier products: db.Products.find({ 'SupplierId': '683bbd056d14af2f1767fa7f' })
- Warehouse capacity: db.Products.find({ 'Category': 'Electronics', 'Price': { $gt: 100 } })
- Multiple conditions: db.Products.find({ 'Price': { $gt: 100 }, 'Warehouses': { $elemMatch: { 'Quantity': { $lt: 10 } } } })

Convert the following question to a MongoDB find query:";

    public LLMQueryController(
        ILogger<LLMQueryController> logger,
        IHttpClientFactory httpClientFactory,
        MongoDbContext dbContext)
    {
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
        _httpClient.Timeout = TimeSpan.FromSeconds(OLLAMA_TIMEOUT_SECONDS);
        _database = dbContext.GetDatabase();
    }

    /// <summary>
    /// Processes a natural language query and executes it against MongoDB
    /// </summary>
    /// <param name="request">The query request containing the question</param>
    /// <returns>The response to the query</returns>
    [HttpPost("query")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status504GatewayTimeout)]
    public async Task<IActionResult> ProcessQuery([FromBody] LLMQueryRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            _logger.LogInformation("Processing LLM query: {Question}", request.Question);
            
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(OLLAMA_TIMEOUT_SECONDS));
            
            var ollamaRequest = new
            {
                model = "mistral",
                prompt = $"{SYSTEM_PROMPT}\n{request.Question}",
                stream = false
            };

            var content = new StringContent(
                JsonSerializer.Serialize(ollamaRequest),
                Encoding.UTF8,
                "application/json"
            );

            _logger.LogInformation("Sending request to Ollama API");
            var response = await _httpClient.PostAsync(OLLAMA_API_URL, content, cts.Token);
            
            var responseBody = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Ollama API Response: {Response}", responseBody);
            
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, $"Ollama API error: {responseBody}");
            }

            var ollamaResponse = JsonSerializer.Deserialize<OllamaResponse>(responseBody);

            // Clean up the response to remove markdown formatting
            var cleanedResponse = ollamaResponse?.Response?.Trim()
                .Replace("```", "")
                .Replace("\\n", "\n")
                .Trim();

            if (string.IsNullOrEmpty(cleanedResponse))
            {
                return BadRequest("No valid query generated");
            }

            // Parse the query to extract collection name and filter
            var queryParts = ParseMongoQuery(cleanedResponse);
            if (queryParts == null)
            {
                return BadRequest("Invalid query format");
            }

            // Execute the query
            var queryResult = await ExecuteMongoQuery(queryParts.Value.collectionName, queryParts.Value.filter);

            var result = new
            {
                Question = request.Question,
                GeneratedQuery = cleanedResponse,
                Data = queryResult,
                ProcessedAt = DateTime.UtcNow
            };

            return Ok(result);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("LLM query timed out after {Timeout} seconds", OLLAMA_TIMEOUT_SECONDS);
            return StatusCode(StatusCodes.Status504GatewayTimeout, 
                $"The query processing timed out after {OLLAMA_TIMEOUT_SECONDS} seconds. Please try again or simplify your query.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing LLM query");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                "An error occurred while processing the query. Please try again later.");
        }
    }

    private (string collectionName, string filter)? ParseMongoQuery(string query)
    {
        try
        {
            // Extract collection name and filter from query like "db.collection.find({filter})"
            var match = System.Text.RegularExpressions.Regex.Match(
                query,
                @"db\.(\w+)\.find\((.*)\)"
            );

            if (!match.Success || match.Groups.Count != 3)
            {
                return null;
            }

            return (match.Groups[1].Value, match.Groups[2].Value);
        }
        catch
        {
            return null;
        }
    }

    private async Task<IEnumerable<object>> ExecuteMongoQuery(string collectionName, string filterJson)
    {
        try
        {
            _logger.LogInformation("Executing MongoDB query. Collection: {Collection}, Filter: {Filter}", collectionName, filterJson);
            
            // Parse the filter JSON into a MongoDB filter definition
            var filter = MongoDB.Bson.Serialization.BsonSerializer.Deserialize<BsonDocument>(filterJson);
            _logger.LogInformation("Parsed filter: {Filter}", filter.ToJson());
            
            // Execute the query based on collection name
            switch (collectionName)
            {
                case "Products":
                    var productCollection = _database.GetCollection<Product>(collectionName);
                    return await productCollection.Find(filter).ToListAsync();
                
                default:
                    var collection = _database.GetCollection<BsonDocument>(collectionName);
                    var results = await collection.Find(filter).ToListAsync();
                    return results.Select(doc =>
                    {
                        var dict = new Dictionary<string, object>();
                        foreach (var element in doc.Elements)
                        {
                            switch (element.Value.BsonType)
                            {
                                case BsonType.Decimal128:
                                    dict[element.Name] = ((BsonDecimal128)element.Value).AsDecimal;
                                    break;
                                case BsonType.ObjectId:
                                    dict[element.Name] = element.Value.AsObjectId.ToString();
                                    break;
                                case BsonType.DateTime:
                                    dict[element.Name] = element.Value.ToUniversalTime();
                                    break;
                                case BsonType.Array:
                                    var array = element.Value.AsBsonArray;
                                    var list = new List<object>();
                                    foreach (var item in array)
                                    {
                                        if (item.IsBsonDocument)
                                        {
                                            var subDict = new Dictionary<string, object>();
                                            foreach (var subElement in item.AsBsonDocument.Elements)
                                            {
                                                switch (subElement.Value.BsonType)
                                                {
                                                    case BsonType.Decimal128:
                                                        subDict[subElement.Name] = ((BsonDecimal128)subElement.Value).AsDecimal;
                                                        break;
                                                    case BsonType.ObjectId:
                                                        subDict[subElement.Name] = subElement.Value.AsObjectId.ToString();
                                                        break;
                                                    case BsonType.DateTime:
                                                        subDict[subElement.Name] = subElement.Value.ToUniversalTime();
                                                        break;
                                                    default:
                                                        subDict[subElement.Name] = BsonTypeMapper.MapToDotNetValue(subElement.Value);
                                                        break;
                                                }
                                            }
                                            list.Add(subDict);
                                        }
                                        else
                                        {
                                            list.Add(BsonTypeMapper.MapToDotNetValue(item));
                                        }
                                    }
                                    dict[element.Name] = list;
                                    break;
                                default:
                                    dict[element.Name] = BsonTypeMapper.MapToDotNetValue(element.Value);
                                    break;
                            }
                        }
                        return dict;
                    });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing MongoDB query. Collection: {Collection}, Filter: {Filter}", collectionName, filterJson);
            throw;
        }
    }
}

public class OllamaResponse
{
    [JsonPropertyName("response")]
    public string Response { get; set; } = string.Empty;

    [JsonPropertyName("model")]
    public string Model { get; set; } = string.Empty;

    [JsonPropertyName("created_at")]
    public string CreatedAt { get; set; } = string.Empty;

    [JsonPropertyName("done")]
    public bool Done { get; set; }

    [JsonPropertyName("done_reason")]
    public string DoneReason { get; set; } = string.Empty;
} 