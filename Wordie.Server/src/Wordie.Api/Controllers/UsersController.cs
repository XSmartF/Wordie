using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wordie.Application.Common.Models;
using Wordie.Application.Common.Handlers;
using Wordie.Domain.Entities;
using Wordie.Infrastructure.Persistence;
using Wordie.Api.DTOs;

namespace Wordie.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;

    public UsersController(ApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    // Accept complex PagedRequest in the body via POST for rich filtering/sorting
    [HttpPost("query")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult<PagedResponse<UserDto>>> Query([FromBody] PagedRequest request)
    {
        // Use the generic handler pattern directly here for brevity
    var specNoPaging = new Application.Common.Specifications.PagedSpecification<ApplicationUser>(request, applyPaging: false);
    var baseQuery = SpecificationEvaluatorHelper.GetQuery(_db.Set<ApplicationUser>().AsQueryable(), specNoPaging);
    var total = await baseQuery.CountAsync();

    var spec = new Application.Common.Specifications.PagedSpecification<ApplicationUser>(request, applyPaging: true);
    var query = SpecificationEvaluatorHelper.GetQuery(_db.Set<ApplicationUser>().AsQueryable(), spec);
    var items = await query.ToListAsync();
    var mapped = _mapper.Map<IReadOnlyList<UserDto>>(items);
    return Ok(new PagedResponse<UserDto>(mapped, total, request.Page, request.PageSize));
    }
}