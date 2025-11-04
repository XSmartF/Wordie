namespace Wordie.Api.Services;

public interface IGeminiWordGenerator
{
    Task<IReadOnlyList<GeneratedWord>> GenerateWordsAsync(string prompt, int? defaultLevel = null, int? maxWords = null, CancellationToken cancellationToken = default);
}

public record GeneratedWord(string Term, string Definition, int Level);
