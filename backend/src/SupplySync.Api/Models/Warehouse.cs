using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SupplySync.Api.Models;

public class Warehouse
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonRequired]
    public required string Name { get; set; }

    [BsonRequired]
    public required string LocationCode { get; set; }

    [BsonRequired]
    public required Address Address { get; set; }

    public int Capacity { get; set; }

    public int CurrentUtilization { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; }
}

public class Address
{
    [BsonRequired]
    public required string Street { get; set; }

    [BsonRequired]
    public required string City { get; set; }

    [BsonRequired]
    public required string State { get; set; }

    [BsonRequired]
    public required string Zip { get; set; }
} 