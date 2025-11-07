using Wordie.Api.DTOs;
using Wordie.Domain.Entities;

namespace Wordie.Api.Services;

public interface IStudySessionService
{
    Task<StudySession> StartSessionAsync(string userId, StartStudySessionRequest request, CancellationToken cancellationToken = default);

    Task<StudySession?> GetSessionAsync(Guid sessionId, string userId, CancellationToken cancellationToken = default);

    Task<(StudySession session, StudyCardProgress card, StudyCardProgress? nextCard)> SubmitAnswerAsync(
        Guid sessionId,
        string userId,
        SubmitStudyAnswerRequest request,
        CancellationToken cancellationToken = default
    );
}
