using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wordie.Api.DTOs;
using Wordie.Infrastructure.Persistence;

namespace Wordie.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(ApplicationDbContext db, ILogger<DashboardController> logger)
    {
        _db = db;
        _logger = logger;
    }

    private string? GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary()
    {
        try
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var now = DateTime.UtcNow;
            var currentPeriodStart = now.Date.AddDays(-30);
            var previousPeriodStart = currentPeriodStart.AddDays(-30);

            var wordsQuery = _db.Words.AsNoTracking().Where(w => w.UserId == userId);
            var wordSetsQuery = _db.WordSets.AsNoTracking().Where(ws => ws.UserId == userId);

            var totalWords = await wordsQuery.CountAsync();
            var totalWordSets = await wordSetsQuery.CountAsync();

            var wordsCurrent = await wordsQuery
                .Where(w => w.CreatedAt >= currentPeriodStart)
                .CountAsync();

            var wordsPrevious = await wordsQuery
                .Where(w => w.CreatedAt >= previousPeriodStart && w.CreatedAt < currentPeriodStart)
                .CountAsync();

            var wordSetsCurrent = await wordSetsQuery
                .Where(ws => ws.CreatedAt >= currentPeriodStart)
                .CountAsync();

            var wordSetsPrevious = await wordSetsQuery
                .Where(ws => ws.CreatedAt >= previousPeriodStart && ws.CreatedAt < currentPeriodStart)
                .CountAsync();

            var activeWordSetsCurrent = await wordsQuery
                .Where(w => w.CreatedAt >= currentPeriodStart && w.WordSetId != null)
                .Select(w => w.WordSetId!)
                .Distinct()
                .CountAsync();

            var activeWordSetsPrevious = await wordsQuery
                .Where(w => w.CreatedAt >= previousPeriodStart && w.CreatedAt < currentPeriodStart && w.WordSetId != null)
                .Select(w => w.WordSetId!)
                .Distinct()
                .CountAsync();

            double averageWordsPerSet = totalWordSets == 0 ? 0 : Math.Round((double)totalWords / totalWordSets, 1);

            double wordsChangePercent = CalculateChangePercent(wordsCurrent, wordsPrevious);
            double wordSetsChangePercent = CalculateChangePercent(wordSetsCurrent, wordSetsPrevious);
            double activeWordSetsChangePercent = CalculateChangePercent(activeWordSetsCurrent, activeWordSetsPrevious);

            var summary = new DashboardSummaryDto(
                TotalWords: totalWords,
                WordsAddedLast30Days: wordsCurrent,
                WordsMonthlyChangePercent: wordsChangePercent,
                TotalWordSets: totalWordSets,
                WordSetsCreatedLast30Days: wordSetsCurrent,
                WordSetsMonthlyChangePercent: wordSetsChangePercent,
                ActiveWordSetsLast30Days: activeWordSetsCurrent,
                ActiveWordSetsChangePercent: activeWordSetsChangePercent,
                AverageWordsPerSet: averageWordsPerSet
            );

            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while building dashboard summary");
            return StatusCode(500, new { error = "Failed to load dashboard summary." });
        }
    }

    [HttpGet("trends")]
    public async Task<ActionResult<IReadOnlyList<DashboardTrendPointDto>>> GetTrends([FromQuery] int days = 90)
    {
        try
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            days = Math.Clamp(days, 7, 365);
            var startDate = DateTime.UtcNow.Date.AddDays(-(days - 1));

            var wordCounts = await _db.Words
                .AsNoTracking()
                .Where(w => w.UserId == userId && w.CreatedAt >= startDate)
                .GroupBy(w => w.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var wordSetCounts = await _db.WordSets
                .AsNoTracking()
                .Where(ws => ws.UserId == userId && ws.CreatedAt >= startDate)
                .GroupBy(ws => ws.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var wordCountByDate = wordCounts.ToDictionary(x => x.Date, x => x.Count);
            var wordSetCountByDate = wordSetCounts.ToDictionary(x => x.Date, x => x.Count);

            var points = new List<DashboardTrendPointDto>(capacity: days);
            for (var offset = 0; offset < days; offset++)
            {
                var date = startDate.AddDays(offset);
                wordCountByDate.TryGetValue(date, out var words);
                wordSetCountByDate.TryGetValue(date, out var wordSets);
                points.Add(new DashboardTrendPointDto(date, words, wordSets));
            }

            return Ok(points);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while building dashboard trends");
            return StatusCode(500, new { error = "Failed to load dashboard trends." });
        }
    }

    [HttpGet("top-wordsets")]
    public async Task<ActionResult<IReadOnlyList<DashboardWordSetSummaryDto>>> GetTopWordSets([FromQuery] int take = 10)
    {
        try
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            take = Math.Clamp(take, 1, 50);

            var wordStatsQuery = _db.Words
                .AsNoTracking()
                .Where(w => w.UserId == userId && w.WordSetId != null)
                .GroupBy(w => w.WordSetId!.Value)
                .Select(g => new
                {
                    WordSetId = g.Key,
                    WordCount = g.Count(),
                    LastWordAddedAt = g.Max(w => (DateTime?)w.CreatedAt)
                });

            var wordSets = await _db.WordSets
                .AsNoTracking()
                .Where(ws => ws.UserId == userId)
                .Select(ws => new
                {
                    ws.Id,
                    ws.Title,
                    ws.Description,
                    ws.CreatedAt,
                    WordCount = wordStatsQuery
                        .Where(stats => stats.WordSetId == ws.Id)
                        .Select(stats => (int?)stats.WordCount)
                        .FirstOrDefault() ?? 0,
                    LastWordAddedAt = wordStatsQuery
                        .Where(stats => stats.WordSetId == ws.Id)
                        .Select(stats => stats.LastWordAddedAt)
                        .FirstOrDefault()
                })
                .OrderByDescending(x => x.WordCount)
                .ThenByDescending(x => x.LastWordAddedAt)
                .ThenBy(x => x.Title)
                .Take(take)
                .Select(x => new DashboardWordSetSummaryDto(
                    x.Id,
                    x.Title,
                    x.Description,
                    x.CreatedAt,
                    x.WordCount,
                    x.LastWordAddedAt
                ))
                .ToListAsync();

            return Ok(wordSets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while loading top word sets");
            return StatusCode(500, new { error = "Failed to load word sets." });
        }
    }

    private static double CalculateChangePercent(int current, int previous)
    {
        if (previous <= 0)
        {
            return current > 0 ? 100 : 0;
        }

        var delta = current - previous;
        return Math.Round((double)delta / previous * 100, 1);
    }
}
