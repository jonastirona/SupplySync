using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Moq;
using System.Security.Claims;
using SupplySync.Api.Services;
using Xunit;
using System.IdentityModel.Tokens.Jwt;

namespace SupplySync.Tests;

public class JwtServiceTests
{
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly JwtService _jwtService;

    public JwtServiceTests()
    {
        _mockConfiguration = new Mock<IConfiguration>();

        // Setup configuration mock
        _mockConfiguration.Setup(x => x["JwtSettings:SecretKey"]).Returns("your_super_secret_key_with_at_least_32_characters");
        _mockConfiguration.Setup(x => x["JwtSettings:Issuer"]).Returns("SupplySync");
        _mockConfiguration.Setup(x => x["JwtSettings:Audience"]).Returns("SupplySyncApi");
        _mockConfiguration.Setup(x => x["JwtSettings:ExpirationInMinutes"]).Returns("60");

        _jwtService = new JwtService(_mockConfiguration.Object);
    }

    [Fact]
    public void GenerateToken_ShouldCreateValidToken()
    {
        // Arrange
        var userId = "1";
        var email = "test@example.com";
        var role = "Admin";

        // Act
        var token = _jwtService.GenerateToken(userId, email, role);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);

        // Verify token can be validated
        var principal = _jwtService.ValidateToken(token);
        Assert.NotNull(principal);

        // Verify claims
        var claims = principal.Claims;
        Assert.Contains(claims, c => c.Type == ClaimTypes.NameIdentifier && c.Value == userId);
        Assert.Contains(claims, c => c.Type == ClaimTypes.Email && c.Value == email);
        Assert.Contains(claims, c => c.Type == ClaimTypes.Role && c.Value == role);
    }

    [Fact]
    public void ValidateToken_WithValidToken_ShouldReturnClaimsPrincipal()
    {
        // Arrange
        var userId = "1";
        var email = "test@example.com";
        var role = "Admin";
        var token = _jwtService.GenerateToken(userId, email, role);

        // Act
        var principal = _jwtService.ValidateToken(token);

        // Assert
        Assert.NotNull(principal);
        Assert.Equal(userId, principal.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        Assert.Equal(email, principal.FindFirst(ClaimTypes.Email)?.Value);
        Assert.Equal(role, principal.FindFirst(ClaimTypes.Role)?.Value);
    }

    [Fact]
    public void ValidateToken_WithInvalidToken_ShouldThrowException()
    {
        // Arrange
        var invalidToken = "invalid_token";

        // Act & Assert
        Assert.Throws<SecurityTokenMalformedException>(() => _jwtService.ValidateToken(invalidToken));
    }

    [Fact]
    public void GenerateToken_ShouldCreateTokenWithCorrectExpiration()
    {
        // Arrange
        var userId = "1";
        var email = "test@example.com";
        var role = "Admin";

        // Act
        var token = _jwtService.GenerateToken(userId, email, role);
        var principal = _jwtService.ValidateToken(token);

        // Assert
        var expClaim = principal.FindFirst("exp")?.Value;
        Assert.NotNull(expClaim);

        var expiration = DateTimeOffset.FromUnixTimeSeconds(long.Parse(expClaim));
        var expectedExpiration = DateTime.UtcNow.AddMinutes(60);

        // Allow for 1 minute difference due to test execution time
        Assert.True(Math.Abs((expectedExpiration - expiration).TotalMinutes) <= 1);
    }
} 