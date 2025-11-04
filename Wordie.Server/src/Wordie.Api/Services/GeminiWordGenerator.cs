using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Linq;

namespace Wordie.Api.Services;

public class GeminiWordGenerator : IGeminiWordGenerator
{
    private const string DefaultModel = "gemini-1.5-flash-latest";
    private static readonly Regex LineSplitRegex = new("[\r\n]+", RegexOptions.Compiled);
    private static readonly Regex DefinitionSeparatorRegex = new("\\s*(?:-|\\||\u2013|\u2014)\\s*", RegexOptions.Compiled);

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiWordGenerator> _logger;

    public GeminiWordGenerator(HttpClient httpClient, IConfiguration configuration, ILogger<GeminiWordGenerator> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<IReadOnlyList<GeneratedWord>> GenerateWordsAsync(string prompt, int? defaultLevel = null, int? maxWords = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(prompt))
        {
            return Array.Empty<GeneratedWord>();
        }

        var apiKey = _configuration["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("Gemini API key missing. Falling back to heuristic parsing.");
            return HeuristicParse(prompt, defaultLevel, maxWords);
        }

        try
        {
            using var request = BuildHttpRequest(prompt, apiKey, defaultLevel, maxWords);
            using var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Gemini API call failed with {Status}: {Body}", response.StatusCode, body);
                return HeuristicParse(prompt, defaultLevel, maxWords);
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var content = ExtractTextFromResponse(document);
            if (string.IsNullOrWhiteSpace(content))
            {
                _logger.LogWarning("Gemini API returned no content.");
                return HeuristicParse(prompt, defaultLevel, maxWords);
            }

            var parsed = TryParseJsonArray(content, defaultLevel) ?? HeuristicParse(content, defaultLevel, maxWords);
            if (maxWords.HasValue)
            {
                return parsed.Take(maxWords.Value).ToList();
            }

            return parsed.ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while calling Gemini API.");
            return HeuristicParse(prompt, defaultLevel, maxWords);
        }
    }

    private static HttpRequestMessage BuildHttpRequest(string prompt, string apiKey, int? defaultLevel, int? maxWords)
    {
        var instructions = new StringBuilder();
        instructions.AppendLine("You are an assistant that returns vocabulary items as JSON.");
        instructions.AppendLine("Return a JSON array where each item has the shape: { \"term\": string, \"definition\": string, \"level\": number }.");
        instructions.AppendLine("Only respond with valid JSON. No extra commentary.");
        if (defaultLevel.HasValue)
        {
            instructions.AppendLine($"If a level is not obvious, default to {defaultLevel.Value}.");
        }
        if (maxWords.HasValue)
        {
            instructions.AppendLine($"Do not exceed {maxWords.Value} items.");
        }
        instructions.AppendLine("User prompt:");
        instructions.Append(prompt.Trim());

        var requestPayload = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = instructions.ToString() }
                    }
                }
            },
            safetySettings = new[]
            {
                new { category = "HARM_CATEGORY_DANGEROUS_CONTENT", threshold = "BLOCK_NONE" },
                new { category = "HARM_CATEGORY_HARASSMENT", threshold = "BLOCK_NONE" },
                new { category = "HARM_CATEGORY_HATE_SPEECH", threshold = "BLOCK_NONE" },
                new { category = "HARM_CATEGORY_SEXUAL", threshold = "BLOCK_NONE" },
                new { category = "HARM_CATEGORY_SELF_HARM", threshold = "BLOCK_NONE" }
            },
            generationConfig = new
            {
                temperature = 0.2,
                topK = 32,
                topP = 0.95,
                maxOutputTokens = 2048
            }
        };

        var request = new HttpRequestMessage
        {
            Method = HttpMethod.Post,
            RequestUri = new Uri($"v1beta/models/{DefaultModel}:generateContent?key={apiKey}", UriKind.Relative),
            Content = new StringContent(JsonSerializer.Serialize(requestPayload), Encoding.UTF8, "application/json")
        };

        return request;
    }

    private static string? ExtractTextFromResponse(JsonDocument document)
    {
        if (!document.RootElement.TryGetProperty("candidates", out var candidates))
        {
            return null;
        }

        foreach (var candidate in candidates.EnumerateArray())
        {
            if (!candidate.TryGetProperty("content", out var content))
            {
                continue;
            }

            if (!content.TryGetProperty("parts", out var parts))
            {
                continue;
            }

            foreach (var part in parts.EnumerateArray())
            {
                if (part.TryGetProperty("text", out var textElement))
                {
                    var text = textElement.GetString();
                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        return text;
                    }
                }
            }
        }

        return null;
    }

    private static IReadOnlyList<GeneratedWord>? TryParseJsonArray(string content, int? defaultLevel)
    {
        try
        {
            var options = new JsonDocumentOptions
            {
                AllowTrailingCommas = true,
            };
            using var document = JsonDocument.Parse(content, options);
            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            var results = new List<GeneratedWord>();
            foreach (var element in document.RootElement.EnumerateArray())
            {
                if (element.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                var term = element.TryGetProperty("term", out var termElement) ? termElement.GetString() : null;
                var definition = element.TryGetProperty("definition", out var defElement) ? defElement.GetString() : null;
                var level = element.TryGetProperty("level", out var levelElement) && levelElement.TryGetInt32(out var parsedLevel)
                    ? parsedLevel
                    : defaultLevel ?? 1;

                if (string.IsNullOrWhiteSpace(term) || string.IsNullOrWhiteSpace(definition))
                {
                    continue;
                }

                results.Add(new GeneratedWord(term.Trim(), definition.Trim(), NormalizeLevel(level, defaultLevel)));
            }

            return results;
        }
        catch
        {
            return null;
        }
    }

    private static IReadOnlyList<GeneratedWord> HeuristicParse(string content, int? defaultLevel, int? maxWords)
    {
        var results = new List<GeneratedWord>();
        var lines = LineSplitRegex.Split(content)
            .Select(line => line.Trim())
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .ToArray();

        foreach (var line in lines)
        {
            var parts = DefinitionSeparatorRegex.Split(line, 2);
            if (parts.Length < 2)
            {
                continue;
            }

            var term = parts[0].Trim();
            var remainder = parts[1].Trim();
            if (string.IsNullOrWhiteSpace(term) || string.IsNullOrWhiteSpace(remainder))
            {
                continue;
            }

            var level = defaultLevel ?? 1;
            var levelMatch = Regex.Match(remainder, @"\((?:level|lvl|level:)\s*(\d+)\)$", RegexOptions.IgnoreCase);
            if (levelMatch.Success && int.TryParse(levelMatch.Groups[1].Value, out var parsedLevel))
            {
                level = NormalizeLevel(parsedLevel, defaultLevel);
                remainder = remainder[..levelMatch.Index].Trim();
            }

            results.Add(new GeneratedWord(term, remainder, NormalizeLevel(level, defaultLevel)));
            if (maxWords.HasValue && results.Count >= maxWords.Value)
            {
                break;
            }
        }

        return results;
    }

    private static int NormalizeLevel(int level, int? fallback)
    {
        var resolved = level <= 0 ? fallback ?? 1 : level;
        return Math.Clamp(resolved, 1, 10);
    }
}
