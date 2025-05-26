using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SupplySync.Api.Models;

public class Product
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    
    [BsonRequired]
    public required string Name { get; set; }
    
    [BsonRequired]
    public required string SKU { get; set; }
    
    [BsonRequired]
    public required string Category { get; set; }
    
    public int Quantity { get; set; }
    
    public string? Description { get; set; }
    
    public int ReorderThreshold { get; set; }
} 