using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Wordie.Api.DTOs;
using Wordie.Domain.Entities;
using Wordie.Domain.Enums;
using Wordie.Infrastructure.Persistence;

namespace Wordie.Api.Services;

public class StudySessionService : IStudySessionService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<StudySessionService> _logger;
    private readonly Random _random = new();

    private const int DefaultLimit = 20;
    private const int MaxLimit = 200;
    private const double MinEaseFactor = 1.3;

    public StudySessionService(ApplicationDbContext dbContext, ILogger<StudySessionService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<StudySession> StartSessionAsync(string userId, StartStudySessionRequest request, CancellationToken cancellationToken = default)
    {
        var wordSet = await _dbContext.WordSets
            .AsNoTracking()
            .FirstOrDefaultAsync(ws => ws.Id == request.WordSetId && ws.UserId == userId, cancellationToken);

        if (wordSet == null)
        {
            throw new InvalidOperationException("Word set not found or not owned by user.");
        }

        var limit = request.Limit.HasValue ? Math.Clamp(request.Limit.Value, 1, MaxLimit) : DefaultLimit;
        var now = DateTime.UtcNow;

        var wordsQuery = _dbContext.Words
            .Where(w => w.UserId == userId && w.WordSetId == request.WordSetId)
            .AsNoTracking();

        var words = await wordsQuery.ToListAsync(cancellationToken);

        if (words.Count == 0)
        {
            throw new InvalidOperationException("The selected word set has no words to study.");
        }

        var dueWords = request.IncludeDue
            ? words.Where(w => w.DueAt == null || w.DueAt <= now).OrderBy(w => w.DueAt ?? DateTime.MinValue).ToList()
            : new List<Word>();

        var newWords = request.IncludeNew
            ? words.Where(w => w.LastReviewedAt == null).OrderBy(_ => _random.Next()).ToList()
            : new List<Word>();

        var reviewPool = new List<Word>();
        reviewPool.AddRange(dueWords);

        foreach (var word in newWords)
        {
            if (reviewPool.Count >= limit)
            {
                break;
            }

            if (!reviewPool.Any(w => w.Id == word.Id))
            {
                reviewPool.Add(word);
            }
        }

        if (reviewPool.Count < limit)
        {
            foreach (var word in words.OrderBy(w => w.DueAt ?? DateTime.MaxValue))
            {
                if (reviewPool.Count >= limit)
                {
                    break;
                }

                if (!reviewPool.Any(w => w.Id == word.Id))
                {
                    reviewPool.Add(word);
                }
            }
        }

        if (reviewPool.Count == 0)
        {
            throw new InvalidOperationException("No cards available for the selected filters.");
        }

        if (request.Shuffle)
        {
            reviewPool = reviewPool.OrderBy(_ => _random.Next()).ToList();
        }

        if (reviewPool.Count > limit)
        {
            reviewPool = reviewPool.Take(limit).ToList();
        }

        var session = new StudySession
        {
            WordSetId = request.WordSetId,
            UserId = userId,
            Mode = request.Mode,
            Direction = request.Direction,
            RequestedLimit = limit,
            IncludeDue = request.IncludeDue,
            IncludeNew = request.IncludeNew,
            Shuffle = request.Shuffle,
            AllowFlip = request.AllowFlip,
            AllowTyping = request.AllowTyping,
            TotalCards = reviewPool.Count,
            StartedAt = now,
            Status = StudySessionStatus.Active
        };

        var orderIndex = 0;
        var highestOrder = 0;

        foreach (var word in reviewPool)
        {
            var direction = ResolveDirection(request.Direction);
            var prompt = direction == StudyCardDirection.TermToDefinition ? word.Term : word.Definition;
            var expected = direction == StudyCardDirection.TermToDefinition ? word.Definition : word.Term;

            if (string.IsNullOrWhiteSpace(prompt) || string.IsNullOrWhiteSpace(expected))
            {
                continue;
            }

            var options = BuildOptions(words, word, request.Mode, direction);
            var progress = new StudyCardProgress
            {
                StudySession = session,
                WordId = word.Id,
                Direction = direction,
                OrderIndex = orderIndex++,
                Prompt = prompt,
                ExpectedAnswer = expected,
                OptionsSnapshot = options != null ? JsonSerializer.Serialize(options) : null,
                Status = StudyCardStatus.New,
                LastReviewedAt = word.LastReviewedAt,
                Accuracy = CalculateAccuracy(word),
                ConsecutiveCorrect = word.ConsecutiveCorrect,
                TimeSpentSeconds = 0
            };

            session.CardProgress.Add(progress);
            highestOrder = progress.OrderIndex;
        }

        if (session.CardProgress.Count == 0)
        {
            throw new InvalidOperationException("No cards with valid data were found for the session.");
        }

        await _dbContext.StudySessions.AddAsync(session, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Started study session {SessionId} for user {UserId} with {CardCount} cards.", session.Id, userId, session.CardProgress.Count);

        return session;
    }

    public async Task<StudySession?> GetSessionAsync(Guid sessionId, string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.StudySessions
            .Include(ss => ss.CardProgress.OrderBy(cp => cp.OrderIndex))
            .ThenInclude(cp => cp.Word)
            .FirstOrDefaultAsync(ss => ss.Id == sessionId && ss.UserId == userId, cancellationToken);
    }

    public async Task<(StudySession session, StudyCardProgress card, StudyCardProgress? nextCard)> SubmitAnswerAsync(
        Guid sessionId,
        string userId,
        SubmitStudyAnswerRequest request,
        CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.StudySessions
            .Include(ss => ss.CardProgress)
            .ThenInclude(cp => cp.Word)
            .FirstOrDefaultAsync(ss => ss.Id == sessionId && ss.UserId == userId, cancellationToken);

        if (session == null)
        {
            throw new InvalidOperationException("Study session not found.");
        }

        var card = session.CardProgress.FirstOrDefault(cp => cp.Id == request.ProgressId);
        if (card == null)
        {
            throw new InvalidOperationException("Card progress not found in this session.");
        }

        var word = card.Word ?? await _dbContext.Words.FirstAsync(w => w.Id == card.WordId, cancellationToken);

        var now = DateTime.UtcNow;

        card.Attempts += 1;
        card.TimeSpentSeconds += Math.Max(0, request.TimeSpentSeconds);
        card.LastRating = request.Rating;
        card.LastReviewedAt = now;
        card.LastAnswer = request.UserAnswer;
        card.SelectedOptionsSnapshot = request.SelectedOptions != null ? JsonSerializer.Serialize(request.SelectedOptions) : null;

        var previousStatus = card.Status;
        var isCorrect = request.Rating != StudyRating.Again;
        card.IsCorrect = isCorrect;
        if (isCorrect)
        {
            card.CorrectAttempts += 1;
            card.ConsecutiveCorrect += 1;
        }
        else
        {
            card.ConsecutiveCorrect = 0;
        }

        card.Status = request.Rating switch
        {
            StudyRating.Again => StudyCardStatus.Relearning,
            StudyRating.Hard => StudyCardStatus.Learning,
            _ => StudyCardStatus.Review
        };

        card.Accuracy = card.Attempts > 0 ? (decimal)card.CorrectAttempts / card.Attempts : 0;

        if (previousStatus != StudyCardStatus.Review && card.Status == StudyCardStatus.Review)
        {
            session.CompletedCards += 1;
        }
        else if (previousStatus == StudyCardStatus.Review && card.Status != StudyCardStatus.Review)
        {
            session.CompletedCards = Math.Max(0, session.CompletedCards - 1);
        }

        if (isCorrect)
        {
            session.CorrectAnswers += 1;
        }
        else
        {
            session.IncorrectAnswers += 1;
        }

        session.TotalTime += TimeSpan.FromSeconds(Math.Max(0, request.TimeSpentSeconds));

        ApplySpacedRepetition(word, request.Rating, now);

        _dbContext.Words.Update(word);

        // Requeue logic for Again/Hard to emulate in-session repetitions
        if (request.Rating == StudyRating.Again || request.Rating == StudyRating.Hard)
        {
            var maxOrder = session.CardProgress.Max(cp => cp.OrderIndex);
            var offset = request.Rating == StudyRating.Again ? 3 : 1;
            card.OrderIndex = maxOrder + offset;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var nextCard = ResolveNextCard(session);

        if (nextCard == null)
        {
            session.Status = StudySessionStatus.Completed;
            session.CompletedAt = now;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return (session, card, nextCard);
    }

    private StudyCardProgress? ResolveNextCard(StudySession session)
    {
        return session.CardProgress
            .Where(cp => cp.Status != StudyCardStatus.Review)
            .OrderBy(cp => cp.OrderIndex)
            .FirstOrDefault();
    }

    private StudyCardDirection ResolveDirection(StudyCardDirection requested)
    {
        if (requested == StudyCardDirection.Mixed)
        {
            return _random.Next(0, 2) == 0
                ? StudyCardDirection.TermToDefinition
                : StudyCardDirection.DefinitionToTerm;
        }

        return requested;
    }

    private IReadOnlyList<string>? BuildOptions(IEnumerable<Word> allWords, Word target, StudyMode mode, StudyCardDirection direction)
    {
        if (mode != StudyMode.MultipleChoice)
        {
            return null;
        }

        var correct = direction == StudyCardDirection.TermToDefinition ? target.Definition : target.Term;
        if (string.IsNullOrWhiteSpace(correct))
        {
            return null;
        }

        var pool = allWords
            .Where(w => w.Id != target.Id)
            .Select(w => direction == StudyCardDirection.TermToDefinition ? w.Definition : w.Term)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct()
            .OrderBy(_ => _random.Next())
            .Take(10)
            .ToList();

        var options = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            correct
        };

        foreach (var option in pool)
        {
            options.Add(option);
            if (options.Count >= 4)
            {
                break;
            }
        }

        while (options.Count < 4)
        {
            options.Add(correct + " " + _random.Next(10, 99));
        }

        return options.OrderBy(_ => _random.Next()).ToList();
    }

    private static decimal CalculateAccuracy(Word word)
    {
        var total = word.CorrectCount + word.IncorrectCount;
        if (total == 0)
        {
            return 0;
        }

        return (decimal)word.CorrectCount / total;
    }

    private void ApplySpacedRepetition(Word word, StudyRating rating, DateTime now)
    {
        word.LastReviewedAt = now;
        word.LastSessionAt = now;
        word.LastRating = rating;

        switch (rating)
        {
            case StudyRating.Again:
                word.EaseFactor = Math.Max(MinEaseFactor, word.EaseFactor - 0.2);
                word.Interval = 1;
                word.Repetition = 0;
                word.DueAt = now.AddMinutes(10);
                word.IncorrectCount += 1;
                word.ConsecutiveCorrect = 0;
                word.Lapses += 1;
                break;
            case StudyRating.Hard:
                word.EaseFactor = Math.Max(MinEaseFactor, word.EaseFactor - 0.15);
                word.Repetition = Math.Max(1, word.Repetition);
                word.Interval = Math.Max(1, word.Interval == 0 ? 1 : (int)Math.Round(word.Interval * 0.5));
                word.DueAt = now.AddDays(word.Interval);
                word.CorrectCount += 1;
                word.ConsecutiveCorrect = Math.Max(1, word.ConsecutiveCorrect + 1);
                break;
            case StudyRating.Good:
                word.EaseFactor = Math.Max(MinEaseFactor, word.EaseFactor + 0.0);
                word.Repetition += 1;
                if (word.Repetition == 1)
                {
                    word.Interval = 1;
                }
                else if (word.Repetition == 2)
                {
                    word.Interval = 6;
                }
                else
                {
                    word.Interval = word.Interval == 0 ? 6 : (int)Math.Round(word.Interval * word.EaseFactor);
                }
                word.DueAt = now.AddDays(Math.Max(1, word.Interval));
                word.CorrectCount += 1;
                word.ConsecutiveCorrect += 1;
                break;
            case StudyRating.Easy:
                word.EaseFactor = Math.Max(MinEaseFactor, word.EaseFactor + 0.15);
                word.Repetition += 1;
                if (word.Repetition == 1)
                {
                    word.Interval = 1;
                }
                else if (word.Repetition == 2)
                {
                    word.Interval = 6;
                }
                else
                {
                    word.Interval = word.Interval == 0 ? 6 : (int)Math.Round(word.Interval * (word.EaseFactor + 0.3));
                }
                word.Interval = Math.Max(1, word.Interval);
                word.DueAt = now.AddDays(word.Interval);
                word.CorrectCount += 1;
                word.ConsecutiveCorrect += 1;
                break;
        }
    }
}
