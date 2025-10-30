using Ardalis.Specification.EntityFrameworkCore;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Wordie.Application.Common.Models;
using Wordie.Application.Common.Specifications;

namespace Wordie.Application.Common.Handlers;

public record GetPagedQuery<TEntity, TDto>(PagedRequest Request) : IRequest<PagedResponse<TDto>>;

public class GetPagedQueryHandler<TEntity, TDto> 
    : IRequestHandler<GetPagedQuery<TEntity, TDto>, PagedResponse<TDto>>
    where TEntity : class
{
    private readonly DbContext _context;
    private readonly IMapper _mapper;

    public GetPagedQueryHandler(DbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<PagedResponse<TDto>> Handle(GetPagedQuery<TEntity, TDto> request, CancellationToken cancellationToken)
    {
        var spec = new PagedSpecification<TEntity>(request.Request);
        var query = SpecificationEvaluator.Default.GetQuery(_context.Set<TEntity>().AsQueryable(), spec);

        int total = await query.CountAsync(cancellationToken);
        var items = await query.ToListAsync(cancellationToken);
        var mapped = _mapper.Map<IReadOnlyList<TDto>>(items);

        return new PagedResponse<TDto>(mapped, total, request.Request.Page, request.Request.PageSize);
    }
}
