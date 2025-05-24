using System.Security.Claims;

namespace SupplySync.Api.Services;

public interface IJwtService
{
    string GenerateToken(string userId, string email, string role);
    ClaimsPrincipal ValidateToken(string token);
} 