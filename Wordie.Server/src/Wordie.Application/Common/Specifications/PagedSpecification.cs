using Ardalis.Specification;
using System.Linq.Expressions;
using System.Reflection;
using System.Text.Json;
using System.Collections.Generic;
using Wordie.Application.Common.Models;

namespace Wordie.Application.Common.Specifications;

public class PagedSpecification<TEntity> : Specification<TEntity> where TEntity : class
{
    public PagedSpecification(PagedRequest request)
    {
        if (request == null) return;

        ApplyPaging(request);
        ApplySorting(request);
        ApplyFiltering(request);
        ApplySearching(request);
    }

    private void ApplyPaging(PagedRequest request)
    {
        int skip = (request.Page - 1) * request.PageSize;
        Query.Skip(skip).Take(request.PageSize);
    }

    private void ApplySorting(PagedRequest request)
    {
        if (request.Sorts == null || !request.Sorts.Any())
        {
            // Default sort by Id ascending if no sorts provided
            var idProp = typeof(TEntity).GetProperty("Id", BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
            if (idProp != null)
            {
                var param = Expression.Parameter(typeof(TEntity), "x");
                var body = Expression.Property(param, idProp);
                var keySelector = Expression.Lambda<Func<TEntity, object?>>(Expression.Convert(body, typeof(object)), param);
                Query.OrderBy(keySelector);
            }
            return;
        }

        IOrderedSpecificationBuilder<TEntity>? ordered = null;
        foreach (var sort in request.Sorts)
        {
            var prop = typeof(TEntity).GetProperty(sort.Field, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
            if (prop == null) continue;

            var param = Expression.Parameter(typeof(TEntity), "x");
            var body = Expression.Property(param, prop);
            // convert to nullable object to match Specification extension signatures: Expression<Func<TEntity, object?>>
            var keySelector = Expression.Lambda<Func<TEntity, object?>>(Expression.Convert(body, typeof(object)), param);

            if (ordered == null)
            {
                ordered = sort.Direction == SortDirection.Asc
                    ? Query.OrderBy(keySelector)
                    : Query.OrderByDescending(keySelector);
            }
            else
            {
                if (sort.Direction == SortDirection.Asc)
                    ordered = ordered.ThenBy(keySelector);
                else
                    ordered = ordered.ThenByDescending(keySelector);
            }
        }
    }

    private void ApplyFiltering(PagedRequest request)
    {
        if (request.Filters == null || !request.Filters.Any()) return;

        foreach (var filter in request.Filters)
        {
            var prop = typeof(TEntity).GetProperty(filter.Field, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
            if (prop == null) continue;

            var parameter = Expression.Parameter(typeof(TEntity), "x");
            var member = Expression.Property(parameter, prop);

            Expression? predicate = BuildFilterExpression(member, parameter, filter);
            if (predicate != null)
            {
                var lambda = Expression.Lambda<Func<TEntity, bool>>(predicate, parameter);
                Query.Where(lambda);
            }
        }
    }

    private Expression? BuildFilterExpression(MemberExpression member, ParameterExpression param, FilterRule filter)
    {
        if (filter.Value == null) return null;

        var propertyType = ((PropertyInfo)member.Member).PropertyType;

        // Handle Between operator specially for range values
        if (filter.Operator == FilterOperator.Between)
        {
            Dictionary<string, object>? range = null;

            if (filter.Value is JsonElement json && json.ValueKind == JsonValueKind.Object)
            {
                range = json.Deserialize<Dictionary<string, object>>();
            }
            else if (filter.Value is Dictionary<string, object> dict)
            {
                range = dict;
            }

            if (range == null || (!range.ContainsKey("min") && !range.ContainsKey("max")))
                return null;

            Expression? combined = null;

            if (range.TryGetValue("min", out var minValue) && minValue != null)
            {
                var minConstant = Expression.Constant(ConvertValue(minValue, propertyType));
                var greaterThanOrEqual = Expression.GreaterThanOrEqual(member, minConstant);
                combined = greaterThanOrEqual;
            }

            if (range.TryGetValue("max", out var maxValue) && maxValue != null)
            {
                var maxConstant = Expression.Constant(ConvertValue(maxValue, propertyType));
                var lessThanOrEqual = Expression.LessThanOrEqual(member, maxConstant);
                if (combined == null)
                    combined = lessThanOrEqual;
                else
                    combined = Expression.AndAlso(combined, lessThanOrEqual);
            }

            return combined;
        }

        var constant = Expression.Constant(ConvertValue(filter.Value, propertyType));

        return filter.Operator switch
        {
            FilterOperator.Equal => Expression.Equal(member, constant),
            FilterOperator.NotEqual => Expression.NotEqual(member, constant),
            FilterOperator.GreaterThan => Expression.GreaterThan(member, constant),
            FilterOperator.LessThan => Expression.LessThan(member, constant),
            FilterOperator.GreaterThanOrEqual => Expression.GreaterThanOrEqual(member, constant),
            FilterOperator.LessThanOrEqual => Expression.LessThanOrEqual(member, constant),
            FilterOperator.Contains => Expression.Call(member, typeof(string).GetMethod(nameof(string.Contains), new[] { typeof(string) })!, constant),
            FilterOperator.NotContains => Expression.Not(Expression.Call(member, typeof(string).GetMethod(nameof(string.Contains), new[] { typeof(string) })!, constant)),
            _ => null
        };
    }

    private static object ConvertValue(object value, Type targetType)
    {
        if (value is JsonElement json)
        {
            if (json.ValueKind == JsonValueKind.Array)
                return json.EnumerateArray().Select(x => ConvertValue(x, targetType)).ToList();
            if (json.ValueKind == JsonValueKind.String && targetType == typeof(DateTime))
                return DateTime.Parse(json.GetString()!);
            if (json.ValueKind == JsonValueKind.Number && targetType == typeof(int))
                return json.GetInt32();
            if (json.ValueKind == JsonValueKind.String && targetType == typeof(Guid))
                return Guid.Parse(json.GetString()!);
            if (json.ValueKind == JsonValueKind.String && Nullable.GetUnderlyingType(targetType) == typeof(Guid))
                return Guid.Parse(json.GetString()!);
        }

        if (targetType == typeof(Guid) && value is string str)
            return Guid.Parse(str);
        if (Nullable.GetUnderlyingType(targetType) == typeof(Guid) && value is string str2)
            return Guid.Parse(str2);

        if (targetType.IsEnum)
            return Enum.Parse(targetType, value.ToString()!);

        return Convert.ChangeType(value, targetType);
    }

    private void ApplySearching(PagedRequest request)
    {
        if (request.Search == null || string.IsNullOrWhiteSpace(request.Search.Keyword)) return;

        string keyword = request.Search.Keyword.ToLower();
        Expression? combined = null;
        var param = Expression.Parameter(typeof(TEntity), "x");

        foreach (var col in request.Search.Columns)
        {
            var prop = typeof(TEntity).GetProperty(col, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
            if (prop == null || prop.PropertyType != typeof(string)) continue;

            var member = Expression.Property(param, prop);
            var toLower = Expression.Call(member, typeof(string).GetMethod(nameof(string.ToLower), Type.EmptyTypes)!);
            var contains = Expression.Call(toLower, typeof(string).GetMethod(nameof(string.Contains), new[] { typeof(string) })!, Expression.Constant(keyword));
            combined = combined == null ? contains : Expression.OrElse(combined, contains);
        }

        if (combined != null)
        {
            var lambda = Expression.Lambda<Func<TEntity, bool>>(combined, param);
            Query.Where(lambda);
        }
    }
}
