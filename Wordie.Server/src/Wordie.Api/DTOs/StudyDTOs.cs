using System.Collections.Generic;
using Wordie.Domain.Enums;

namespace Wordie.Api.DTOs;

public record StudySettingsDto(
    StudyMode Mode,
    StudyCardDirection Direction,
    int Limit,
    bool IncludeDue,
    bool IncludeNew,
    bool Shuffle,
    bool AllowFlip,
    bool AllowTyping
);

public record StudyCardDto(
    Guid ProgressId,
    Guid WordId,
    string Prompt,
    string ExpectedAnswer,
    IReadOnlyList<string>? Options,
    StudyCardStatus Status,
    StudyRating? LastRating,
    int Attempts,
    bool IsCorrect,
    int ConsecutiveCorrect,
    int TimeSpentSeconds,
    int OrderIndex,
    decimal Accuracy,
    StudyCardDirection Direction
);

public record StudySessionStatsDto(
    int TotalCards,
    int CompletedCards,
    int CorrectAnswers,
    int IncorrectAnswers,
    TimeSpan TotalTime
);

public record StudySessionDto(
    Guid Id,
    Guid WordSetId,
    StudySessionStatus Status,
    DateTime StartedAt,
    DateTime? CompletedAt,
    StudySettingsDto Settings,
    StudySessionStatsDto Stats,
    IReadOnlyList<StudyCardDto> Queue,
    StudyCardDto? CurrentCard
);

public record StartStudySessionRequest(
    Guid WordSetId,
    StudyMode Mode,
    StudyCardDirection Direction,
    int? Limit,
    bool IncludeDue = true,
    bool IncludeNew = true,
    bool Shuffle = true,
    bool AllowFlip = true,
    bool AllowTyping = true
);

public record SubmitStudyAnswerRequest(
    Guid ProgressId,
    StudyRating Rating,
    int TimeSpentSeconds,
    string? UserAnswer,
    IReadOnlyList<string>? SelectedOptions
);

public record StudyAnswerResponse(
    StudySessionDto Session,
    StudyCardDto? NextCard
);
