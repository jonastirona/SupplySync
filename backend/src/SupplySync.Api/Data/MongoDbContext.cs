using MongoDB.Driver;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using SupplySync.Api.Models;

namespace SupplySync.Api.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;
    private readonly string _productsCollectionName;
    private const string _usersCollectionName = "Users";

    public MongoDbContext(IConfiguration configuration)
    {
        var mongoSection = configuration.GetSection("MongoDb");
        var connectionString = mongoSection["ConnectionString"] ?? throw new ArgumentNullException("ConnectionString", "MongoDB connection string is not configured");
        var databaseName = mongoSection["DatabaseName"] ?? throw new ArgumentNullException("DatabaseName", "MongoDB database name is not configured");
        _productsCollectionName = mongoSection["ProductsCollectionName"] ?? throw new ArgumentNullException("ProductsCollectionName", "MongoDB products collection name is not configured");

        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(databaseName);
        
        // Ensure collections exist
        if (!CollectionExists(_productsCollectionName))
        {
            _database.CreateCollection(_productsCollectionName);
        }
        
        if (!CollectionExists(_usersCollectionName))
        {
            _database.CreateCollection(_usersCollectionName);
        }

        // Create unique indexes for Users collection
        var users = _database.GetCollection<User>(_usersCollectionName);
        var userIndexes = new[]
        {
            new CreateIndexModel<User>(
                Builders<User>.IndexKeys.Ascending(u => u.Username),
                new CreateIndexOptions { Unique = true }
            ),
            new CreateIndexModel<User>(
                Builders<User>.IndexKeys.Ascending(u => u.Email),
                new CreateIndexOptions { Unique = true }
            )
        };
        users.Indexes.CreateMany(userIndexes);
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

    public IMongoCollection<User> Users => _database.GetCollection<User>(_usersCollectionName);
} 