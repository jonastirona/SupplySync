namespace SupplySync.Api.Models;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public string ProductsCollectionName { get; set; } = "products";
    public string SuppliersCollectionName { get; set; } = "suppliers";
    public string WarehousesCollectionName { get; set; } = "warehouses";
    public string UsersCollectionName { get; set; } = "Users";
} 