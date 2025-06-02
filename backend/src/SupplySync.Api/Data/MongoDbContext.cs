using MongoDB.Driver;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using SupplySync.Api.Models;
using Microsoft.Extensions.Options;

namespace SupplySync.Api.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;
    private readonly MongoDbSettings _settings;

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        _settings = settings.Value;
        var client = new MongoClient(_settings.ConnectionString);
        _database = client.GetDatabase(_settings.DatabaseName);

        // Ensure collections exist
        EnsureCollectionsExist();
        CreateIndexes();
    }

    private void EnsureCollectionsExist()
    {
        var collections = new[] 
        {
            _settings.ProductsCollectionName,
            _settings.SuppliersCollectionName,
            _settings.WarehousesCollectionName,
            _settings.UsersCollectionName
        };

        foreach (var collection in collections)
        {
            if (!CollectionExists(collection))
            {
                _database.CreateCollection(collection);
            }
        }
    }

    private void CreateIndexes()
    {
        // Create unique indexes for Users collection
        var users = Users;
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

    public IMongoDatabase GetDatabase() => _database;

    public IMongoCollection<T> GetCollection<T>(string name) => _database.GetCollection<T>(name);

    public IMongoCollection<T> Products<T>() => _database.GetCollection<T>(_settings.ProductsCollectionName);

    public IMongoCollection<T> Suppliers<T>() => _database.GetCollection<T>(_settings.SuppliersCollectionName);

    public IMongoCollection<T> Warehouses<T>() => _database.GetCollection<T>(_settings.WarehousesCollectionName);

    public IMongoCollection<User> Users => _database.GetCollection<User>(_settings.UsersCollectionName);
} 