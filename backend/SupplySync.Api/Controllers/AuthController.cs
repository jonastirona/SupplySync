using Microsoft.AspNetCore.Mvc;
using SupplySync.Api.Services;

namespace SupplySync.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    public record LoginRequest(string Email, string Password);
    public record RegisterRequest(string Email, string Password, string Role = "Staff");

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (success, token) = await _authService.LoginAsync(request.Email, request.Password);
        
        if (!success)
        {
            return Unauthorized(new { message = token });
        }

        return Ok(new { token });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var (success, message) = await _authService.RegisterAsync(request.Email, request.Password, request.Role);
        
        if (!success)
        {
            return BadRequest(new { message });
        }

        return Ok(new { message });
    }
} 