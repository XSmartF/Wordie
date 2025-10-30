using System.Text;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Wordie.Application.Common.Handlers;
using Microsoft.AspNetCore.Identity;
using Wordie.Application.Common.Models;
using Wordie.Domain.Entities;
using Wordie.Infrastructure.Persistence;
using Wordie.Api.Mapping;
using Wordie.Api.Extensions;
using System.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

// Configuration
var configuration = builder.Configuration;

// Add DB
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(configuration.GetConnectionString("DefaultConnection") ?? "Server=(localdb)\\mssqllocaldb;Database=WordieDb;Trusted_Connection=True;"));

// Identity + JWT: configured in extension method for cleanliness
builder.Services.AddIdentityServices(configuration);

// Authorization policies centralized
builder.Services.AddAuthorizationPolicies();
builder.Services.AddMediatR(typeof(GetPagedQueryHandler<Word, object>).Assembly);
builder.Services.AddAutoMapper(typeof(AutoMapperProfile));
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    // Add JWT bearer auth to Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer <token>' to authenticate."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Serve Swagger UI at root so opening the app shows Swagger automatically
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.RoutePrefix = string.Empty; // serve at '/'
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Wordie API V1");
});

// Open browser automatically when the app has started (development friendly)
app.Lifetime.ApplicationStarted.Register(() =>
{
    try
    {
        // prefer first configured URL, fallback to common localhost ports
        var url = app.Urls.FirstOrDefault() ?? builder.Configuration["ASPNETCORE_URLS"] ?? "https://localhost:5001";
        Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true });
    }
    catch
    {
        // ignore any errors when trying to launch browser
    }
});

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
