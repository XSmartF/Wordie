using Ardalis.Specification;
using System.Linq.Expressions;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Globalization;
using System.Collections.Generic;
using Wordie.Application.Common.Models;

namespace Wordie.Application.Common.Specifications;

public class PagedSpecification<TEntity> : Specification<TEntity> where TEntity : class
{
    public PagedSpecification(PagedRequest request, bool applyPaging = true)
    {
        if (request == null) return;

        // Apply filtering/sorting/search first, then optionally apply paging
        ApplyFiltering(request);
        ApplySorting(request);
        ApplySearching(request);
        if (applyPaging)
            ApplyPaging(request);
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
    var nonNullableType = Nullable.GetUnderlyingType(propertyType) ?? propertyType;

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

        // If Contains/NotContains requested on a non-string field, try to interpret as equality (useful for IDs)
        if ((filter.Operator == FilterOperator.Contains || filter.Operator == FilterOperator.NotContains) && nonNullableType != typeof(string))
        {
            object converted;
            try
            {
                converted = ConvertValue(filter.Value, propertyType);
            }
            catch
            {
                return null;
            }

            // Make constant match member type (handle Nullable<T>)
            var constLiteral = Expression.Constant(converted, nonNullableType);
            Expression constExpr;
            if (constLiteral.Type == propertyType)
                constExpr = constLiteral;
            else
                constExpr = Expression.Convert(constLiteral, propertyType);
            return filter.Operator == FilterOperator.Contains ? Expression.Equal(member, constExpr) : Expression.NotEqual(member, constExpr);
        }

        object convertedValue;
        try
        {
            convertedValue = ConvertValue(filter.Value, propertyType);
        }
        catch
        {
            // If we can't convert the filter value to the property type, skip this filter
            return null;
        }

        // Support Include/Exclude operators for collections (MultiSelect) - build a Contains expression
        if ((filter.Operator == FilterOperator.Include || filter.Operator == FilterOperator.Exclude))
        {
            // Convert provided values into an array of the member's non-nullable type
            IEnumerable<object>? values = null;
            if (filter.Value is JsonElement j && j.ValueKind == JsonValueKind.Array)
            {
                values = j.EnumerateArray().Select(x => ConvertValue(x, propertyType)).ToList();
            }
            else if (filter.Value is System.Collections.IEnumerable ie)
            {
                var list = new List<object>();
                foreach (var v in ie)
                {
                    list.Add(ConvertValue(v!, propertyType));
                }
                values = list;
            }

            if (values == null) return null;

            var valsList = values.ToList();
            var array = Array.CreateInstance(nonNullableType, valsList.Count);
            for (int i = 0; i < valsList.Count; i++)
            {
                var convertedElement = Convert.ChangeType(valsList[i], nonNullableType, CultureInfo.InvariantCulture);
                array.SetValue(convertedElement, i);
            }

            var constantArray = Expression.Constant(array);
            var containsMethod = typeof(Enumerable).GetMethods(BindingFlags.Static | BindingFlags.Public)
                .First(m => m.Name == "Contains" && m.GetParameters().Length == 2)
                .MakeGenericMethod(nonNullableType);

            Expression memberValue = member;
            if (memberValue.Type != nonNullableType)
                memberValue = Expression.Convert(memberValue, nonNullableType);

            var containsCall = Expression.Call(containsMethod, constantArray, memberValue);

            return filter.Operator == FilterOperator.Include ? (Expression)containsCall : Expression.Not(containsCall);
        }

        var constLiteral2 = Expression.Constant(convertedValue, nonNullableType);
        Expression constant;
        if (constLiteral2.Type == propertyType)
            constant = constLiteral2;
        else
            constant = Expression.Convert(constLiteral2, propertyType);

        return filter.Operator switch
        {
            FilterOperator.Equal => Expression.Equal(member, constant),
            FilterOperator.NotEqual => Expression.NotEqual(member, constant),
            FilterOperator.GreaterThan => Expression.GreaterThan(member, constant),
            FilterOperator.LessThan => Expression.LessThan(member, constant),
            FilterOperator.GreaterThanOrEqual => Expression.GreaterThanOrEqual(member, constant),
            FilterOperator.LessThanOrEqual => Expression.LessThanOrEqual(member, constant),
            FilterOperator.Contains when nonNullableType == typeof(string) => Expression.Call(member, typeof(string).GetMethod(nameof(string.Contains), new[] { typeof(string) })!, constant),
            FilterOperator.NotContains when nonNullableType == typeof(string) => Expression.Not(Expression.Call(member, typeof(string).GetMethod(nameof(string.Contains), new[] { typeof(string) })!, constant)),
            _ => null
        };
    }

    private static object ConvertValue(object value, Type targetType)
    {
        try
        {
            var underlyingType = Nullable.GetUnderlyingType(targetType) ?? targetType;

            if (value is JsonElement json)
            {
                if (json.ValueKind == JsonValueKind.Array)
                    return json.EnumerateArray().Select(x => ConvertValue(x, underlyingType)).ToList();

                if (json.ValueKind == JsonValueKind.String)
                {
                    var s = json.GetString();
                    if (underlyingType == typeof(DateTime))
                    {
                        // Try ISO date first (yyyy-MM-dd), then fallback to general parse
                        if (DateTime.TryParseExact(s!, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var dtExact))
                            return dtExact;
                        return DateTime.Parse(s!);
                    }
                    if (underlyingType == typeof(Guid))
                        return Guid.Parse(s!);
                    if (underlyingType.IsEnum)
                        return Enum.Parse(underlyingType, s!);
                    return Convert.ChangeType(s!, underlyingType, CultureInfo.InvariantCulture);
                }

                if (json.ValueKind == JsonValueKind.Number)
                {
                    // Use raw text and convert to target numeric type
                    var raw = json.GetRawText();
                    return Convert.ChangeType(raw, underlyingType, CultureInfo.InvariantCulture);
                }
            }

            if (value is string str)
            {
                if (underlyingType == typeof(Guid))
                    return Guid.Parse(str);
                if (underlyingType.IsEnum)
                    return Enum.Parse(underlyingType, str);
            }

            if (underlyingType.IsEnum)
                return Enum.Parse(underlyingType, value.ToString()!);

            return Convert.ChangeType(value, underlyingType, CultureInfo.InvariantCulture);
        }
        catch (Exception ex)
        {
            // Log details for debugging filter conversion issues
            try
            {
                Console.WriteLine($"ConvertValue failed. value type: {(value == null ? "null" : value.GetType().ToString())}, value: '{value}', targetType: {targetType}, exception: {ex}");
            }
            catch { }
            throw;
        }
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
