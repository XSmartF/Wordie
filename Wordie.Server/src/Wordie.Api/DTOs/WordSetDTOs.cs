namespace Wordie.Api.DTOs;

public record WordSetDto(Guid Id, string Title, string? Description, DateTime CreatedAt, bool IsFavorite);
public record CreateWordSetRequest(string Title, string? Description, bool IsFavorite = false);
public record UpdateWordSetRequest(string Title, string? Description, bool IsFavorite);
public record UpdateWordSetFavoriteRequest(bool IsFavorite);