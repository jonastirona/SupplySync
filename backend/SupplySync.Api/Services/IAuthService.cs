using SupplySync.Api.Models;

namespace SupplySync.Api.Services;

public interface IAuthService
{
    Task<(bool success, string token)> LoginAsync(string email, string password);
    Task<(bool success, string message)> RegisterAsync(string email, string password, string role = "Staff");
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
} 