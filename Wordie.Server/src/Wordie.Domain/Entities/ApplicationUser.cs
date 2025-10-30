using Microsoft.AspNetCore.Identity;

namespace Wordie.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    // Add extra profile fields if needed
    public string? DisplayName { get; set; }
}
