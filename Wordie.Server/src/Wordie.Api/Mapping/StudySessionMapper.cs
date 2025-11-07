using System;
using System.Linq;
using System.Text.Json;
using Wordie.Api.DTOs;
using Wordie.Domain.Entities;
using Wordie.Domain.Enums;

namespace Wordie.Api.Mapping;

public static class StudySessionMapper
{
    public static StudySessionDto ToDto(StudySession session)
    {
        ArgumentNullException.ThrowIfNull(session);

        var orderedCards = session.CardProgress
            .OrderBy(cp => cp.OrderIndex)
            .Select(ToCardDto)
            .ToList();

        var currentCard = orderedCards.FirstOrDefault(card => card.Status != StudyCardStatus.Review);

        var settings = new StudySettingsDto(
            session.Mode,
            session.Direction,
            session.RequestedLimit,
            session.IncludeDue,
            session.IncludeNew,
            session.Shuffle,
            session.AllowFlip,
            session.AllowTyping
        );

        var stats = new StudySessionStatsDto(
            session.TotalCards,
            session.CompletedCards,
            session.CorrectAnswers,
            session.IncorrectAnswers,
            session.TotalTime
        );

        return new StudySessionDto(
            session.Id,
            session.WordSetId,
            session.Status,
            session.StartedAt,
            session.CompletedAt,
            settings,
            stats,
            orderedCards,
            currentCard
        );
    }

    public static StudyCardDto ToCardDto(StudyCardProgress progress)
    {
        ArgumentNullException.ThrowIfNull(progress);

        IReadOnlyList<string>? options = null;
        if (!string.IsNullOrWhiteSpace(progress.OptionsSnapshot))
        {
            options = JsonSerializer.Deserialize<IReadOnlyList<string>>(progress.OptionsSnapshot) ?? Array.Empty<string>();
        }

        return new StudyCardDto(
            progress.Id,
            progress.WordId,
            progress.Prompt,
            progress.ExpectedAnswer,
            options,
            progress.Status,
            progress.LastRating,
            progress.Attempts,
            progress.IsCorrect,
            progress.ConsecutiveCorrect,
            progress.TimeSpentSeconds,
            progress.OrderIndex,
            progress.Accuracy,
            progress.Direction
        );
    }

    public static StudyAnswerResponse ToAnswerResponse(StudySession session, StudyCardProgress? nextCard)
    {
        var sessionDto = ToDto(session);
        var nextCardDto = nextCard is null ? null : ToCardDto(nextCard);
        return new StudyAnswerResponse(sessionDto, nextCardDto);
    }
}
