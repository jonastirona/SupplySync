using Microsoft.EntityFrameworkCore;
using Moq;
using SupplySync.Api.Models;
using SupplySync.Api.Services;
using Xunit;

namespace SupplySync.Tests;

public class AuthServiceTests
{
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly Mock<IJwtService> _mockJwtService;

    public AuthServiceTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb")
            .Options;

        _mockJwtService = new Mock<IJwtService>();
    }

    [Fact]
    public async Task RegisterAsync_WithValidData_ShouldSucceed()
    {
        // Arrange
        using var context = new AppDbContext(_options);
        var authService = new AuthService(context, _mockJwtService.Object);
        var email = "test@example.com";
        var password = "TestPassword123!";
        var role = "Staff";

        // Act
        var result = await authService.RegisterAsync(email, password, role);

        // Assert
        Assert.True(result.success);
        Assert.Equal("User registered successfully", result.message);

        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email);
        Assert.NotNull(user);
        Assert.Equal(role, user.Role);
        Assert.True(BCrypt.Net.BCrypt.Verify(password, user.PasswordHash));
    }

    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ShouldFail()
    {
        // Arrange
        using var context = new AppDbContext(_options);
        var authService = new AuthService(context, _mockJwtService.Object);
        var email = "existing@example.com";
        var password = "TestPassword123!";
        var role = "Staff";

        // Add existing user
        context.Users.Add(new User { Email = email, PasswordHash = "hash", Role = role });
        await context.SaveChangesAsync();

        // Act
        var result = await authService.RegisterAsync(email, password, role);

        // Assert
        Assert.False(result.success);
        Assert.Equal("Email already exists", result.message);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldSucceed()
    {
        // Arrange
        using var context = new AppDbContext(_options);
        var authService = new AuthService(context, _mockJwtService.Object);
        var email = "login@example.com";
        var password = "TestPassword123!";
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);
        var role = "Staff";
        var expectedToken = "test_token";

        var user = new User { Email = email, PasswordHash = passwordHash, Role = role };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        _mockJwtService.Setup(x => x.GenerateToken(user.Id.ToString(), email, role))
            .Returns(expectedToken);

        // Act
        var result = await authService.LoginAsync(email, password);

        // Assert
        Assert.True(result.success);
        Assert.Equal(expectedToken, result.token);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidCredentials_ShouldFail()
    {
        // Arrange
        using var context = new AppDbContext(_options);
        var authService = new AuthService(context, _mockJwtService.Object);
        var email = "invalid@example.com";
        var password = "WrongPassword123!";

        // Act
        var result = await authService.LoginAsync(email, password);

        // Assert
        Assert.False(result.success);
        Assert.Equal("Invalid email or password", result.token);
    }

    [Fact]
    public void HashPassword_ShouldCreateValidHash()
    {
        // Arrange
        using var context = new AppDbContext(_options);
        var authService = new AuthService(context, _mockJwtService.Object);
        var password = "TestPassword123!";

        // Act
        var hash = authService.HashPassword(password);

        // Assert
        Assert.True(BCrypt.Net.BCrypt.Verify(password, hash));
    }

    [Fact]
    public void VerifyPassword_WithValidPassword_ShouldReturnTrue()
    {
        // Arrange
        using var context = new AppDbContext(_options);
        var authService = new AuthService(context, _mockJwtService.Object);
        var password = "TestPassword123!";
        var hash = BCrypt.Net.BCrypt.HashPassword(password);

        // Act
        var result = authService.VerifyPassword(password, hash);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void VerifyPassword_WithInvalidPassword_ShouldReturnFalse()
    {
        // Arrange
        using var context = new AppDbContext(_options);
        var authService = new AuthService(context, _mockJwtService.Object);
        var password = "TestPassword123!";
        var wrongPassword = "WrongPassword123!";
        var hash = BCrypt.Net.BCrypt.HashPassword(password);

        // Act
        var result = authService.VerifyPassword(wrongPassword, hash);

        // Assert
        Assert.False(result);
    }
} 