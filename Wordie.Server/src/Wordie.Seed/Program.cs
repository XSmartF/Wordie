using Bogus;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Wordie.Infrastructure.Persistence;
using Wordie.Domain.Entities;

var host = Host.CreateDefaultBuilder(args)
    .ConfigureAppConfiguration((ctx, config) =>
    {
        config.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);
    })
    .ConfigureServices((ctx, services) =>
    {
        var cfg = ctx.Configuration;
        services.AddDbContext<ApplicationDbContext>(opts =>
            opts.UseSqlServer(cfg.GetConnectionString("DefaultConnection") ?? "Server=(localdb)\\mssqllocaldb;Database=WordieDb;Trusted_Connection=True;"));

        // Register minimal Identity services so we can use UserManager/RoleManager in the seeder
        services.AddIdentityCore<Wordie.Domain.Entities.ApplicationUser>(opts =>
        {
            opts.User.RequireUniqueEmail = true;
            opts.Password.RequiredLength = 6;
        })
    .AddRoles<Microsoft.AspNetCore.Identity.IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();
    })
    .Build();

using var scope = host.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
Console.WriteLine("Applying migrations (if any)...");
try
{
    db.Database.Migrate();
}
catch (Exception ex)
{
    Console.WriteLine($"Migrations failed: {ex.Message}");
}

// Seed Roles and Admin user
var roleManager = scope.ServiceProvider.GetService<RoleManager<IdentityRole>>();
var userManager = scope.ServiceProvider.GetService<UserManager<Wordie.Domain.Entities.ApplicationUser>>();
if (roleManager != null && userManager != null)
{
    string[] roles = new[] { "Admin", "User" };
    foreach (var r in roles)
    {
        if (!await roleManager.RoleExistsAsync(r))
        {
            await roleManager.CreateAsync(new IdentityRole(r));
            Console.WriteLine($"Created role: {r}");
        }
    }

    var adminEmail = "admin@wordie.local";
    var admin = await userManager.FindByEmailAsync(adminEmail);
    if (admin == null)
    {
        admin = new Wordie.Domain.Entities.ApplicationUser { UserName = adminEmail, Email = adminEmail, DisplayName = "Administrator" };
        var create = await userManager.CreateAsync(admin, "P@ssw0rd!");
        if (create.Succeeded)
        {
            await userManager.AddToRoleAsync(admin, "Admin");
            Console.WriteLine("Created admin user and assigned Admin role.");
        }
        else
        {
            Console.WriteLine($"Failed to create admin user: {string.Join(',', create.Errors.Select(e => e.Description))}");
        }
    }
}

// Use Bogus to generate realistic seed data
var rand = new Random();
Console.WriteLine("Seeding fake users, WordSets and Words using Bogus...");

// Clear existing data
db.Words.RemoveRange(db.Words);
db.WordSets.RemoveRange(db.WordSets);
await db.SaveChangesAsync();
Console.WriteLine("Cleared existing WordSets and Words.");

// Create 3 regular users
var userFaker = new Faker<ApplicationUser>()
    .RuleFor(u => u.Id, f => Guid.NewGuid().ToString())
    .RuleFor(u => u.UserName, f => f.Internet.Email())
    .RuleFor(u => u.Email, f => f.Internet.Email())
    .RuleFor(u => u.DisplayName, f => f.Name.FullName());

var users = userFaker.Generate(3);
foreach (var user in users)
{
    var create = await userManager.CreateAsync(user, "P@ssw0rd!");
    if (create.Succeeded)
    {
        await userManager.AddToRoleAsync(user, "User");
        Console.WriteLine($"Created user: {user.Email}");
    }
    else
    {
        Console.WriteLine($"Failed to create user {user.Email}: {string.Join(',', create.Errors.Select(e => e.Description))}");
    }
}

// For each user, generate WordSets and Words
foreach (var user in users)
{
    // Faker for WordSet
    var setFaker = new Faker<WordSet>()
        .RuleFor(s => s.Id, f => Guid.NewGuid())
        .RuleFor(s => s.Title, f => f.Lorem.Sentence(3))
        .RuleFor(s => s.Description, f => f.Lorem.Paragraph())
        .RuleFor(s => s.CreatedAt, f => f.Date.PastOffset(2).UtcDateTime)
        .RuleFor(s => s.UserId, () => user.Id);

    // Generate 5-10 sets per user
    var numSets = rand.Next(5, 11);
    var sets = setFaker.Generate(numSets);
    await db.WordSets.AddRangeAsync(sets);

    // Flatten list of set ids to pick from
    var setIds = sets.Select(s => s.Id).ToArray();

    // Faker for Word
    var wordFaker = new Faker<Word>()
        .RuleFor(w => w.Id, f => Guid.NewGuid())
        .RuleFor(w => w.Term, f => f.Lorem.Word())
        .RuleFor(w => w.Definition, f => f.Lorem.Sentence())
        .RuleFor(w => w.Level, f => f.Random.Int(1, 5))
        .RuleFor(w => w.WordSetId, f => f.PickRandom(setIds))
        .RuleFor(w => w.UserId, () => user.Id)
        .RuleFor(w => w.CreatedAt, f => f.Date.RecentOffset(365).UtcDateTime);

    // Generate 50-100 words per set
    var totalWords = 0;
    foreach (var set in sets)
    {
        var numWords = rand.Next(50, 101);
        var words = wordFaker.Generate(numWords);
        await db.Words.AddRangeAsync(words);
        totalWords += numWords;
    }

    await db.SaveChangesAsync();
    Console.WriteLine($"Seeded {sets.Count} WordSets and {totalWords} Words for user {user.Email}.");
}

Console.WriteLine("Done.");
