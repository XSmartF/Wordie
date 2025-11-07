using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Wordie.Domain.Enums;

namespace Wordie.Domain.Entities;

public class StudyCardProgress
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid StudySessionId { get; set; }

    public StudySession? StudySession { get; set; }

    [Required]
    public Guid WordId { get; set; }

    public Word? Word { get; set; }

    public int OrderIndex { get; set; }

    public StudyCardDirection Direction { get; set; }

    [Required]
    public string Prompt { get; set; } = string.Empty;

    [Required]
    public string ExpectedAnswer { get; set; } = string.Empty;

    public string? OptionsSnapshot { get; set; }

    public string? SelectedOptionsSnapshot { get; set; }

    public string? LastAnswer { get; set; }

    public StudyCardStatus Status { get; set; } = StudyCardStatus.New;

    public StudyRating? LastRating { get; set; }

    public int Attempts { get; set; }

    public int CorrectAttempts { get; set; }

    public bool IsCorrect { get; set; }

    public int StepIndex { get; set; }

    public DateTime? LastReviewedAt { get; set; }

    [Column(TypeName = "decimal(6,2)")]
    public decimal Accuracy { get; set; }

    public int ConsecutiveCorrect { get; set; }

    public int TimeSpentSeconds { get; set; }
}
