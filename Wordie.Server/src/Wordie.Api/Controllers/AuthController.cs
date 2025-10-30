using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Wordie.Domain.Entities;
using Wordie.Api.DTOs;

namespace Wordie.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;

    public AuthController(UserManager<ApplicationUser> userManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var user = new ApplicationUser { UserName = req.Email, Email = req.Email, DisplayName = req.DisplayName };
        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded) return BadRequest(result.Errors.Select(e => e.Description));
        return Ok();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null) return Unauthorized();
        if (!await _userManager.CheckPasswordAsync(user, req.Password)) return Unauthorized();

        var token = await GenerateTokenAsync(user);
        return Ok(new { token });
    }

    private async Task<string> GenerateTokenAsync(ApplicationUser user)
    {
        var key = _configuration["Jwt:Key"] ?? "please-change-this-secret-in-appsettings";
        var issuer = _configuration["Jwt:Issuer"] ?? "wordie";

        // base claims
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim("displayName", user.DisplayName ?? string.Empty)
        };

        // include roles in the token
        var roles = await _userManager.GetRolesAsync(user);
        foreach (var role in roles)
        {
            // use ClaimTypes.Role so ASP.NET Core maps them correctly
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var symKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(symKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(issuer: issuer, claims: claims, expires: DateTime.UtcNow.AddDays(7), signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
