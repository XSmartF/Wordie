namespace Wordie.Api.DTOs;

public record DashboardSummaryDto(
    int TotalWords,
    int WordsAddedLast30Days,
    double WordsMonthlyChangePercent,
    int TotalWordSets,
    int WordSetsCreatedLast30Days,
    double WordSetsMonthlyChangePercent,
    int ActiveWordSetsLast30Days,
    double ActiveWordSetsChangePercent,
    double AverageWordsPerSet
);

public record DashboardTrendPointDto(DateTime Date, int Words, int WordSets);

public record DashboardWordSetSummaryDto(
    Guid Id,
    string Title,
    string? Description,
    DateTime CreatedAt,
    int WordCount,
    DateTime? LastWordAddedAt
);
