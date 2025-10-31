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
public class WordSetsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;

    public WordSetsController(ApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<WordSetDto>>> GetAll()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var sets = await _db.WordSets.Where(ws => ws.UserId == userId).ToListAsync();
        return Ok(_mapper.Map<IEnumerable<WordSetDto>>(sets));
    }

    // Accept complex PagedRequest in the body via POST for rich filtering/sorting
    [HttpPost("query")]
    [Authorize]
    public async Task<ActionResult<PagedResponse<WordSetDto>>> Query([FromBody] PagedRequest request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        request.Filters ??= new List<FilterRule>();
        request.Filters.Add(new FilterRule { Field = "UserId", Operator = FilterOperator.Equal, Value = userId });

        // Use the generic handler pattern directly here for brevity
        var spec = new Application.Common.Specifications.PagedSpecification<WordSet>(request);
        var query = Wordie.Application.Common.Handlers.SpecificationEvaluatorHelper.GetQuery(_db.Set<WordSet>().AsQueryable(), spec);
        var total = await query.CountAsync();
        var items = await query.ToListAsync();
        var mapped = _mapper.Map<IReadOnlyList<WordSetDto>>(items);
        return Ok(new PagedResponse<WordSetDto>(mapped, total, request.Page, request.PageSize));
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<WordSetDto>> Get(Guid id)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var s = await _db.WordSets.FirstOrDefaultAsync(ws => ws.Id == id && ws.UserId == userId);
        if (s == null) return NotFound();
        return _mapper.Map<WordSetDto>(s);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<WordSetDto>> Create(CreateWordSetRequest req)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var set = new WordSet { Title = req.Title, Description = req.Description, UserId = userId };
        _db.WordSets.Add(set);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = set.Id }, _mapper.Map<WordSetDto>(set));
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, UpdateWordSetRequest req)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var set = await _db.WordSets.FirstOrDefaultAsync(ws => ws.Id == id && ws.UserId == userId);
        if (set == null) return NotFound();
        set.Title = req.Title;
        set.Description = req.Description;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var set = await _db.WordSets.FirstOrDefaultAsync(ws => ws.Id == id && ws.UserId == userId);
        if (set == null) return NotFound();
        _db.WordSets.Remove(set);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Get words in a wordset with paging (POST body for complex queries)
    [HttpPost("{id}/words/query")]
    [Authorize]
    public async Task<ActionResult<PagedResponse<WordDto>>> GetWords(Guid id, [FromBody] PagedRequest request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        request.Filters ??= new List<FilterRule>();
        request.Filters.Add(new FilterRule { Field = "WordSetId", Operator = FilterOperator.Equal, Value = id });
        request.Filters.Add(new FilterRule { Field = "UserId", Operator = FilterOperator.Equal, Value = userId });

        var spec = new Application.Common.Specifications.PagedSpecification<Word>(request);
        var query = Wordie.Application.Common.Handlers.SpecificationEvaluatorHelper.GetQuery(_db.Set<Word>().AsQueryable(), spec);
        var total = await query.CountAsync();
        var items = await query.ToListAsync();
        var mapped = _mapper.Map<IReadOnlyList<WordDto>>(items);
        return Ok(new PagedResponse<WordDto>(mapped, total, request.Page, request.PageSize));
    }
}
