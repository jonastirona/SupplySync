using System.ComponentModel.DataAnnotations;

namespace SupplySync.Api.Models.Requests;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    public required string Password { get; set; }
} 