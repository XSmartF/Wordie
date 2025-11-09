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
            opts.UseSqlServer(cfg.GetConnectionString("DefaultConnection") ?? "Server=db31895.public.databaseasp.net; Database=db31895; User Id=db31895; Password=Fa3+7#jARn9%; Encrypt=True; TrustServerCertificate=True; MultipleActiveResultSets=True;"));

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

// Create 3 regular users (only if they don't exist)
string[] userEmails = { "Elena53@gmail.com", "JohnDoe@gmail.com", "JaneSmith@gmail.com" };
var users = new List<ApplicationUser>();

foreach (var email in userEmails)
{
    var existingUser = await userManager.FindByEmailAsync(email);
    if (existingUser == null)
    {
        var user = new ApplicationUser 
        { 
            UserName = email, 
            Email = email, 
            DisplayName = email.Split('@')[0] 
        };
        var create = await userManager.CreateAsync(user, "P@ssw0rd!");
        if (create.Succeeded)
        {
            await userManager.AddToRoleAsync(user, "User");
            users.Add(user);
            Console.WriteLine($"Created user: {user.Email}");
        }
        else
        {
            Console.WriteLine($"Failed to create user {email}: {string.Join(',', create.Errors.Select(e => e.Description))}");
        }
    }
    else
    {
        users.Add(existingUser);
        Console.WriteLine($"User already exists: {email}");
    }
}

var typeOfWordValues = Enum.GetValues<Wordie.Domain.Enums.TypeOfWord>();
string[] vietnameseDefinitionSamples = new[]
{
    "(Danh từ) - Sự kiện xảy ra",
    "(Động từ) - Hành động thực hiện thường xuyên",
    "(Tính từ) - Mô tả đặc điểm nổi bật",
    "(Trạng từ) - Cách thức thực hiện hành động",
    "(Giới từ) - Chỉ mối quan hệ vị trí",
    "(Liên từ) - Nối hai mệnh đề",
    "(Thán từ) - Thể hiện cảm xúc mạnh",
    "(Đại từ) - Thay thế cho danh từ",
    "(Cấu trúc ngữ pháp) - Mẫu câu cần ghi nhớ",
};

string[] noteSamples = new[]
{
    "Ghi nhớ nhanh: sử dụng trong ngữ cảnh trang trọng.",
    "Lưu ý: thường gặp trong bài TOEIC phần nghe.",
    "Tip: kết hợp với giới từ 'for'.",
    "Nhắc nhở: chú ý trọng âm ở âm tiết thứ hai.",
    "Ghi chú: dạng số nhiều thêm 'es'.",
};

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

    // Generate 35 sets per user
    var numSets = 35;
    var sets = setFaker.Generate(numSets);
    await db.WordSets.AddRangeAsync(sets);

    // Flatten list of set ids to pick from
    var setIds = sets.Select(s => s.Id).ToArray();

    // Faker for Word
    var wordFaker = new Faker<Word>()
        .RuleFor(w => w.Id, f => Guid.NewGuid())
        .RuleFor(w => w.Term, f => f.Lorem.Word())
        .RuleFor(w => w.Definition, f => f.Lorem.Sentence(10).TrimEnd('.'))
        .RuleFor(w => w.DefinitionVietnamese, f => f.PickRandom(vietnameseDefinitionSamples))
        .RuleFor(w => w.Example, f => f.Lorem.Sentence(12))
        .RuleFor(w => w.Note, f => f.Random.Bool(0.35f) ? f.PickRandom(noteSamples) : null)
        .RuleFor(w => w.TypeOfWord, f => f.PickRandom(typeOfWordValues))
        .RuleFor(w => w.Level, f => f.Random.Int(1, 5))
        .RuleFor(w => w.WordSetId, f => f.PickRandom(setIds))
        .RuleFor(w => w.UserId, () => user.Id)
        .RuleFor(w => w.CreatedAt, f => f.Date.RecentOffset(365).UtcDateTime);

    // Generate 1000 words per user, distributed randomly among the sets
    var numWords = 1000;
    var words = wordFaker.Generate(numWords);
    await db.Words.AddRangeAsync(words);

    await db.SaveChangesAsync();
    Console.WriteLine($"Seeded {sets.Count} WordSets and {numWords} Words for user {user.Email}.");
}

Console.WriteLine("Done.");
