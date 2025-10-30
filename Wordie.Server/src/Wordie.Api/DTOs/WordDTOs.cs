namespace Wordie.Api.DTOs;

public record WordDto(Guid Id, string Term, string Definition, int Level, Guid? WordSetId, DateTime CreatedAt);
public record CreateWordRequest(string Term, string Definition, int Level, Guid? WordSetId);
public record UpdateWordRequest(string Term, string Definition, int Level, Guid? WordSetId);