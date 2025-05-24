using Microsoft.EntityFrameworkCore;
using SupplySync.Api.Models;

namespace SupplySync.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;

    public AuthService(AppDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<(bool success, string token)> LoginAsync(string email, string password)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        
        if (user == null || !VerifyPassword(password, user.PasswordHash))
        {
            return (false, "Invalid email or password");
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user.Id.ToString(), user.Email, user.Role);
        return (true, token);
    }

    public async Task<(bool success, string message)> RegisterAsync(string email, string password, string role = "Staff")
    {
        if (await _context.Users.AnyAsync(u => u.Email == email))
        {
            return (false, "Email already exists");
        }

        var user = new User
        {
            Email = email,
            PasswordHash = HashPassword(password),
            Role = role
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return (true, "User registered successfully");
    }

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        return BCrypt.Net.BCrypt.Verify(password, passwordHash);
    }
} 