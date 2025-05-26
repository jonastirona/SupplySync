using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SupplySync.Api.Models;

public class Supplier
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonRequired]
    public required string Name { get; set; }

    [BsonRequired]
    public required string ContactEmail { get; set; }

    [BsonRequired]
    public required string Phone { get; set; }

    [BsonRequired]
    public required Address Address { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public List<string> ProductsSupplied { get; set; } = new();

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; }
} 