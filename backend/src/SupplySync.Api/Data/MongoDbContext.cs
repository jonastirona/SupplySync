using MongoDB.Driver;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;

namespace SupplySync.Api.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;
    private readonly string _productsCollectionName;

    public MongoDbContext(IConfiguration configuration)
    {
        var mongoSection = configuration.GetSection("MongoDb");
        var connectionString = mongoSection["ConnectionString"] ?? throw new ArgumentNullException("ConnectionString", "MongoDB connection string is not configured");
        var databaseName = mongoSection["DatabaseName"] ?? throw new ArgumentNullException("DatabaseName", "MongoDB database name is not configured");
        _productsCollectionName = mongoSection["ProductsCollectionName"] ?? throw new ArgumentNullException("ProductsCollectionName", "MongoDB products collection name is not configured");

        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(databaseName);
        
        // Ensure collection exists with correct schema
        if (!CollectionExists(_productsCollectionName))
        {
            _database.CreateCollection(_productsCollectionName);
        }
    }

    private bool CollectionExists(string collectionName)
    {
        var filter = new BsonDocument("name", collectionName);
        var collections = _database.ListCollections(new ListCollectionsOptions { Filter = filter });
        return collections.Any();
    }

    public IMongoCollection<T> GetCollection<T>(string name)
    {
        return _database.GetCollection<T>(name);
    }

    public IMongoCollection<T> Products<T>()
    {
        return GetCollection<T>(_productsCollectionName);
    }

    public IMongoDatabase GetDatabase()
    {
        return _database;
    }
} 