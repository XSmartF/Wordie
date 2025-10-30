using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Wordie.Domain.Entities;

public class Word
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string Term { get; set; } = string.Empty;

    public string Definition { get; set; } = string.Empty;

    public int Level { get; set; }

    // Navigation
    public Guid? WordSetId { get; set; }
    public WordSet? WordSet { get; set; }

    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
