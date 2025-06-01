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

    [BsonRequired]
    public required string Description { get; set; }

    [BsonRequired]
    public required decimal Price { get; set; }

    [BsonRequired]
    [BsonRepresentation(BsonType.ObjectId)]
    public required string SupplierId { get; set; }

    [BsonRequired]
    public required List<WarehouseInventory> Warehouses { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; }
}

public class WarehouseInventory
{
    [BsonRequired]
    [BsonRepresentation(BsonType.ObjectId)]
    public required string WarehouseId { get; set; }
    
    public int Quantity { get; set; }
    public int ReorderThreshold { get; set; }
} 