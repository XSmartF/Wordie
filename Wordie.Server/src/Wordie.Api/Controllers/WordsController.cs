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
public class WordsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly ILogger<WordsController> _logger;

    public WordsController(ApplicationDbContext db, IMapper mapper, ILogger<WordsController> logger)
    {
        _db = db;
        _mapper = mapper;
        _logger = logger;
    }

    // Accept complex PagedRequest in the body via POST for rich filtering/sorting
    [HttpPost("query")]
    [Authorize]
    public async Task<ActionResult<PagedResponse<WordDto>>> Query([FromBody] PagedRequest request)
    {
        _logger.LogInformation("WordsController.Query request: {Request}", System.Text.Json.JsonSerializer.Serialize(request));
        try
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            request.Filters ??= new List<FilterRule>();
            request.Filters.Add(new FilterRule { Field = "UserId", Operator = FilterOperator.Equal, Value = userId });

            var specNoPaging = new Application.Common.Specifications.PagedSpecification<Word>(request, applyPaging: false);
            var baseQuery = SpecificationEvaluatorHelper.GetQuery(_db.Set<Word>().AsQueryable(), specNoPaging);
            var total = await baseQuery.CountAsync();

            var spec = new Application.Common.Specifications.PagedSpecification<Word>(request, applyPaging: true);
            var query = SpecificationEvaluatorHelper.GetQuery(_db.Set<Word>().AsQueryable(), spec);
            var items = await query.ToListAsync();
            var mapped = _mapper.Map<IReadOnlyList<WordDto>>(items);
            return Ok(new PagedResponse<WordDto>(mapped, total, request.Page, request.PageSize));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in WordsController.Query");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<WordDto>> Get(Guid id)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var w = await _db.Words.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
        if (w == null) return NotFound();
        return _mapper.Map<WordDto>(w);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<WordDto>> Create(CreateWordRequest req)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        if (req.WordSetId.HasValue)
        {
            var wordSet = await _db.WordSets.FirstOrDefaultAsync(ws => ws.Id == req.WordSetId && ws.UserId == userId);
            if (wordSet == null) return BadRequest("WordSet not found or not owned by user");
        }

        var word = new Word { Term = req.Term, Definition = req.Definition, Level = req.Level, WordSetId = req.WordSetId, UserId = userId };
        _db.Words.Add(word);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = word.Id }, _mapper.Map<WordDto>(word));
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, UpdateWordRequest req)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var word = await _db.Words.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
        if (word == null) return NotFound();

        if (req.WordSetId.HasValue)
        {
            var wordSet = await _db.WordSets.FirstOrDefaultAsync(ws => ws.Id == req.WordSetId && ws.UserId == userId);
            if (wordSet == null) return BadRequest("WordSet not found or not owned by user");
        }

        word.Term = req.Term;
        word.Definition = req.Definition;
        word.Level = req.Level;
        word.WordSetId = req.WordSetId;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var word = await _db.Words.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
        if (word == null) return NotFound();
        _db.Words.Remove(word);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
