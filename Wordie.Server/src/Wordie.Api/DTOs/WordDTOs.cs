using System.Collections.Generic;

namespace Wordie.Api.DTOs;

public record WordDto(Guid Id, string Term, string Definition, int Level, Guid? WordSetId, DateTime CreatedAt);
public record CreateWordRequest(string Term, string Definition, int Level, Guid? WordSetId);
public record UpdateWordRequest(string Term, string Definition, int Level, Guid? WordSetId);

public record BulkCreateWordItem(string Term, string Definition, int Level);
public record BulkCreateWordsRequest(IReadOnlyList<BulkCreateWordItem> Words);
public record GenerateWordsWithGeminiRequest(string Prompt, int? DefaultLevel = null, int? MaxWords = null);