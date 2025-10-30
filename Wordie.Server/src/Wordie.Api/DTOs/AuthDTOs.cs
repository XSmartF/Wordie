namespace Wordie.Api.DTOs;

public record RegisterRequest(string Email, string Password, string? DisplayName);
public record LoginRequest(string Email, string Password);
public record UserDto(string Id, string UserName, string Email, string? DisplayName, DateTimeOffset? LockoutEnd, bool EmailConfirmed);