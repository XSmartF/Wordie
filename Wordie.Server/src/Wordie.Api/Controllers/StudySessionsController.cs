using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Wordie.Api.DTOs;
using Wordie.Api.Mapping;
using Wordie.Api.Services;

namespace Wordie.Api.Controllers;

[ApiController]
[Route("api/study/sessions")]
[Authorize]
public class StudySessionsController : ControllerBase
{
    private readonly IStudySessionService _studySessionService;

    public StudySessionsController(IStudySessionService studySessionService)
    {
        _studySessionService = studySessionService;
    }

    [HttpPost]
    public async Task<ActionResult<StudySessionDto>> Start([FromBody] StartStudySessionRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
        {
            return Unauthorized();
        }

        try
        {
            var session = await _studySessionService.StartSessionAsync(userId, request, cancellationToken);
            var dto = StudySessionMapper.ToDto(session);
            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{sessionId}")]
    public async Task<ActionResult<StudySessionDto>> Get(Guid sessionId, CancellationToken cancellationToken)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
        {
            return Unauthorized();
        }

        var session = await _studySessionService.GetSessionAsync(sessionId, userId, cancellationToken);
        if (session == null)
        {
            return NotFound();
        }

        return Ok(StudySessionMapper.ToDto(session));
    }

    [HttpPost("{sessionId}/answer")]
    public async Task<ActionResult<StudyAnswerResponse>> SubmitAnswer(
        Guid sessionId,
        [FromBody] SubmitStudyAnswerRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
        {
            return Unauthorized();
        }

        try
        {
            var (session, _, nextCard) = await _studySessionService.SubmitAnswerAsync(sessionId, userId, request, cancellationToken);
            var response = StudySessionMapper.ToAnswerResponse(session, nextCard);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
