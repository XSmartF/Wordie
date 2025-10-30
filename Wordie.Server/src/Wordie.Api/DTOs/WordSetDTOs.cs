namespace Wordie.Api.DTOs;

public record WordSetDto(Guid Id, string Title, string? Description, DateTime CreatedAt);
public record CreateWordSetRequest(string Title, string? Description);
public record UpdateWordSetRequest(string Title, string? Description);