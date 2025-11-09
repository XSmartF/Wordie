using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
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
    private readonly ILogger<WordSetsController> _logger;
    public WordSetsController(ApplicationDbContext db, IMapper mapper, ILogger<WordSetsController> logger)
    {
        _db = db;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<WordSetDto>>> GetAll()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var sets = await _db.WordSets
            .Where(ws => ws.UserId == userId)
            .OrderByDescending(ws => ws.IsFavorite)
            .ThenBy(ws => ws.Title)
            .ToListAsync();
        return Ok(_mapper.Map<IEnumerable<WordSetDto>>(sets));
    }

    [HttpGet("favorites")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<WordSetDto>>> GetFavorites()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var favorites = await _db.WordSets
            .Where(ws => ws.UserId == userId && ws.IsFavorite)
            .OrderBy(ws => ws.Title)
            .ToListAsync();

        return Ok(_mapper.Map<IEnumerable<WordSetDto>>(favorites));
    }

    // Accept complex PagedRequest in the body via POST for rich filtering/sorting
    [HttpPost("query")]
    [Authorize]
    public async Task<ActionResult<PagedResponse<WordSetDto>>> Query([FromBody] PagedRequest request)
    {
        _logger.LogInformation("WordSetsController.Query request: {Request}", System.Text.Json.JsonSerializer.Serialize(request));
        try
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            request.Filters ??= new List<FilterRule>();
            request.Filters.Add(new FilterRule { Field = "UserId", Operator = FilterOperator.Equal, Value = userId });

            var specNoPaging = new Application.Common.Specifications.PagedSpecification<WordSet>(request, applyPaging: false);
            var baseQuery = SpecificationEvaluatorHelper.GetQuery(_db.Set<WordSet>().AsQueryable(), specNoPaging);
            var total = await baseQuery.CountAsync();

            var spec = new Application.Common.Specifications.PagedSpecification<WordSet>(request, applyPaging: true);
            var query = SpecificationEvaluatorHelper.GetQuery(_db.Set<WordSet>().AsQueryable(), spec);
            var items = await query.ToListAsync();
            var mapped = _mapper.Map<IReadOnlyList<WordSetDto>>(items);
            return Ok(new PagedResponse<WordSetDto>(mapped, total, request.Page, request.PageSize));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in WordSetsController.Query");
            return BadRequest(new { error = ex.Message });
        }
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

        var set = new WordSet
        {
            Title = req.Title,
            Description = req.Description,
            UserId = userId,
            IsFavorite = req.IsFavorite
        };
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
        set.IsFavorite = req.IsFavorite;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/favorite")]
    [Authorize]
    public async Task<ActionResult<WordSetDto>> UpdateFavorite(Guid id, UpdateWordSetFavoriteRequest req)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var set = await _db.WordSets.FirstOrDefaultAsync(ws => ws.Id == id && ws.UserId == userId);
        if (set == null) return NotFound();

        set.IsFavorite = req.IsFavorite;
        await _db.SaveChangesAsync();

        return Ok(_mapper.Map<WordSetDto>(set));
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

    var specNoPaging = new Application.Common.Specifications.PagedSpecification<Word>(request, applyPaging: false);
    var baseQuery = SpecificationEvaluatorHelper.GetQuery(_db.Set<Word>().AsQueryable(), specNoPaging);
    var total = await baseQuery.CountAsync();

    var spec = new Application.Common.Specifications.PagedSpecification<Word>(request, applyPaging: true);
    var query = SpecificationEvaluatorHelper.GetQuery(_db.Set<Word>().AsQueryable(), spec);
    var items = await query.ToListAsync();
        var mapped = _mapper.Map<IReadOnlyList<WordDto>>(items);
        return Ok(new PagedResponse<WordDto>(mapped, total, request.Page, request.PageSize));
    }

    // Create a new word inside a specific wordset
    [HttpPost("{id}/words")]
    [Authorize]
    public async Task<ActionResult<WordDto>> CreateWord(Guid id, CreateWordRequest req)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        // Ensure the target wordset exists and belongs to the user
        var wordSet = await _db.WordSets.FirstOrDefaultAsync(ws => ws.Id == id && ws.UserId == userId);
        if (wordSet == null) return BadRequest("WordSet not found or not owned by user");

        var word = new Word
        {
            Term = req.Term,
            Definition = req.Definition,
            DefinitionVietnamese = req.DefinitionVietnamese,
            Example = req.Example,
            Note = req.Note,
            TypeOfWord = req.TypeOfWord,
            Level = req.Level,
            WordSetId = id,
            UserId = userId
        };
        _db.Words.Add(word);
        await _db.SaveChangesAsync();

        // Return Created response pointing to WordsController.Get
        return CreatedAtAction(nameof(Wordie.Api.Controllers.WordsController.Get), "Words", new { id = word.Id }, _mapper.Map<WordDto>(word));
    }

    [HttpPost("{id}/words/bulk")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<WordDto>>> CreateWordsBulk(Guid id, BulkCreateWordsRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var wordSet = await _db.WordSets.FirstOrDefaultAsync(ws => ws.Id == id && ws.UserId == userId, cancellationToken);
        if (wordSet == null) return BadRequest("WordSet not found or not owned by user");

        if (request.Words is not { Count: > 0 })
        {
            return BadRequest("No words provided");
        }

        var sanitized = request.Words
            .Select(word => new
            {
                Term = (word.Term ?? string.Empty).Trim(),
                Definition = (word.Definition ?? string.Empty).Trim(),
                DefinitionVietnamese = (word.DefinitionVietnamese ?? string.Empty).Trim(),
                Example = (word.Example ?? string.Empty).Trim(),
                Note = (word.Note ?? string.Empty).Trim(),
                TypeOfWord = word.TypeOfWord,
                Level = word.Level
            })
            .Where(entry => !string.IsNullOrWhiteSpace(entry.Term) && !string.IsNullOrWhiteSpace(entry.Definition))
            .Select(entry => new Word
            {
                Term = entry.Term,
                Definition = entry.Definition,
                DefinitionVietnamese = string.IsNullOrWhiteSpace(entry.DefinitionVietnamese) ? null : entry.DefinitionVietnamese,
                Example = string.IsNullOrWhiteSpace(entry.Example) ? null : entry.Example,
                Note = string.IsNullOrWhiteSpace(entry.Note) ? null : entry.Note,
                TypeOfWord = entry.TypeOfWord,
                Level = Math.Clamp(entry.Level <= 0 ? 1 : entry.Level, 1, 10),
                WordSetId = id,
                UserId = userId
            })
            .ToList();

        if (sanitized.Count == 0)
        {
            return BadRequest("Không có từ hợp lệ để thêm.");
        }

        await _db.Words.AddRangeAsync(sanitized, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        var mapped = _mapper.Map<IEnumerable<WordDto>>(sanitized);
        return Ok(mapped);
    }

}
