using Ardalis.Specification;
using Ardalis.Specification.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Wordie.Application.Common.Handlers;

public static class SpecificationEvaluatorHelper
{
    public static IQueryable<T> GetQuery<T>(IQueryable<T> queryable, ISpecification<T> spec) where T : class
    {
        return SpecificationEvaluator.Default.GetQuery(queryable, spec);
    }
}
