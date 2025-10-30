using Microsoft.Extensions.DependencyInjection;

namespace Wordie.Api.Extensions;

public static class AuthorizationExtensions
{
    public static IServiceCollection AddAuthorizationPolicies(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            // Simple admin policy - require role Admin
            options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"));
            // Add more policies here as needed
        });

        return services;
    }
}
