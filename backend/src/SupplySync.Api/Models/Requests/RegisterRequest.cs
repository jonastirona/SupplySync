using System.ComponentModel.DataAnnotations;

namespace SupplySync.Api.Models.Requests;

public class RegisterRequest
{
    [Required]
    [MinLength(3)]
    [MaxLength(50)]
    public required string Username { get; set; }

    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    [MinLength(8)]
    public required string Password { get; set; }

    [Required]
    public required string RoleCode { get; set; }
} 