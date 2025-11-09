using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Wordie.Domain.Enums;

namespace Wordie.Domain.Entities;

public class Word
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string Term { get; set; } = string.Empty;

    public string Definition { get; set; } = string.Empty;

    // Additional fields
    public string? DefinitionVietnamese { get; set; }

    public string? Example { get; set; }

    public string? Note { get; set; }

    public Domain.Enums.TypeOfWord? TypeOfWord { get; set; }

    public int Level { get; set; }

    // Navigation
    public Guid? WordSetId { get; set; }
    public WordSet? WordSet { get; set; }

    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Study tracking
    public double EaseFactor { get; set; } = 2.5;

    public int Interval { get; set; }

    public int Repetition { get; set; }

    public DateTime? LastReviewedAt { get; set; }

    public DateTime? DueAt { get; set; }

    public int CorrectCount { get; set; }

    public int IncorrectCount { get; set; }

    public int Lapses { get; set; }

    public int ConsecutiveCorrect { get; set; }

    public StudyRating? LastRating { get; set; }

    public DateTime? LastSessionAt { get; set; }
}
