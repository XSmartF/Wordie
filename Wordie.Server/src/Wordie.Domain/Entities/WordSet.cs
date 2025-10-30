using System.ComponentModel.DataAnnotations;

namespace Wordie.Domain.Entities;

public class WordSet
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public ICollection<Word>? Words { get; set; }
}
