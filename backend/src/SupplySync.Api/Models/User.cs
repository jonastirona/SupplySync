using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace SupplySync.Api.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [Required]
    [BsonElement("username")]
    public string Username { get; set; } = null!;

    [Required]
    [EmailAddress]
    [BsonElement("email")]
    public string Email { get; set; } = null!;

    [Required]
    [BsonElement("passwordHash")]
    public string PasswordHash { get; set; } = null!;

    [Required]
    [BsonElement("role")]
    [BsonRepresentation(BsonType.String)]
    public string Role { get; set; } = null!;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; }
} 