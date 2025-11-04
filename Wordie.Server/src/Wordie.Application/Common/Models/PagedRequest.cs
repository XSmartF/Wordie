using System.Text.Json;

namespace Wordie.Application.Common.Models;

public enum FilterType
{
    Text,
    Number,
    Date,
    Enum,
    MultiSelect,
    Range,
    DateRange
}

public enum FilterOperator
{
    Equal,
    NotEqual,
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
    Contains,
    NotContains,
    Include,
    Exclude,
    Between
}

public enum SortDirection
{
    Asc,
    Desc
}

public class FilterRule
{
    public string Field { get; set; } = default!;
    public FilterType Type { get; set; }
    public FilterOperator Operator { get; set; }
    public object? Value { get; set; }
}

public class SortRule
{
    public string Field { get; set; } = default!;
    public SortDirection Direction { get; set; }
}

public class SearchRule
{
    public List<string> Columns { get; set; } = new();
    public string Keyword { get; set; } = string.Empty;
}

public class PagedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public SearchRule? Search { get; set; }
    public List<FilterRule>? Filters { get; set; }
    public List<SortRule>? Sorts { get; set; }
}

public class PagedResponse<T>
{
    public IReadOnlyList<T> Items { get; set; }
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNext => Page < TotalPages;
    public bool HasPrevious => Page > 1;

    public PagedResponse(IReadOnlyList<T> items, int totalCount, int page, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        Page = page;
        PageSize = pageSize;
    }
}
