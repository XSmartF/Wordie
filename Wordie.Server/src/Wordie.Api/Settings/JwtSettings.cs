namespace Wordie.Api.Settings;

public class JwtSettings
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public int ExpiryDays { get; set; } = 7;
}
