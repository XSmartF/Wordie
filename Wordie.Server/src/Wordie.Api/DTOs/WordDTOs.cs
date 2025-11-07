using System.Collections.Generic;
using Wordie.Domain.Enums;

namespace Wordie.Api.DTOs;

public record WordDto(
	Guid Id,
	string Term,
	string Definition,
	int Level,
	Guid? WordSetId,
	DateTime CreatedAt,
	double EaseFactor,
	int Interval,
	int Repetition,
	DateTime? LastReviewedAt,
	DateTime? DueAt,
	int CorrectCount,
	int IncorrectCount,
	int Lapses,
	int ConsecutiveCorrect,
	StudyRating? LastRating,
	DateTime? LastSessionAt
);
public record CreateWordRequest(string Term, string Definition, int Level, Guid? WordSetId);
public record UpdateWordRequest(string Term, string Definition, int Level, Guid? WordSetId);

public record BulkCreateWordItem(string Term, string Definition, int Level);
public record BulkCreateWordsRequest(IReadOnlyList<BulkCreateWordItem> Words);
public record GenerateWordsWithGeminiRequest(string Prompt, int? DefaultLevel = null, int? MaxWords = null);