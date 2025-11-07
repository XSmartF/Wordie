using System.ComponentModel.DataAnnotations;
using Wordie.Domain.Enums;

namespace Wordie.Domain.Entities;

public class StudySession
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid WordSetId { get; set; }

    public WordSet? WordSet { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    public ApplicationUser? User { get; set; }

    public StudyMode Mode { get; set; }

    public StudyCardDirection Direction { get; set; }

    public StudySessionStatus Status { get; set; } = StudySessionStatus.Active;

    public int RequestedLimit { get; set; }

    public bool IncludeDue { get; set; } = true;

    public bool IncludeNew { get; set; } = true;

    public bool Shuffle { get; set; } = true;

    public bool AllowFlip { get; set; } = true;

    public bool AllowTyping { get; set; } = true;

    public int TotalCards { get; set; }

    public int CompletedCards { get; set; }

    public int CorrectAnswers { get; set; }

    public int IncorrectAnswers { get; set; }

    public TimeSpan TotalTime { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    public ICollection<StudyCardProgress> CardProgress { get; set; } = new List<StudyCardProgress>();
}
