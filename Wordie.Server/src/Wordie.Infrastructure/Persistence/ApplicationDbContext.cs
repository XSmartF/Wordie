using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Wordie.Domain.Entities;

namespace Wordie.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Word> Words { get; set; } = default!;
    public DbSet<WordSet> WordSets { get; set; } = default!;
    public DbSet<StudySession> StudySessions { get; set; } = default!;
    public DbSet<StudyCardProgress> StudyCardProgress { get; set; } = default!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Word>()
            .HasOne(w => w.WordSet)
            .WithMany(s => s.Words)
            .HasForeignKey(w => w.WordSetId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<WordSet>()
            .HasOne(ws => ws.User)
            .WithMany()
            .HasForeignKey(ws => ws.UserId);

        builder.Entity<Word>()
            .HasOne(w => w.User)
            .WithMany()
            .HasForeignKey(w => w.UserId);

        builder.Entity<StudySession>()
            .HasOne(ss => ss.WordSet)
            .WithMany()
            .HasForeignKey(ss => ss.WordSetId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StudySession>()
            .HasOne(ss => ss.User)
            .WithMany()
            .HasForeignKey(ss => ss.UserId);

        builder.Entity<StudyCardProgress>()
            .HasOne(cp => cp.StudySession)
            .WithMany(ss => ss.CardProgress)
            .HasForeignKey(cp => cp.StudySessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StudyCardProgress>()
            .HasOne(cp => cp.Word)
            .WithMany()
            .HasForeignKey(cp => cp.WordId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
