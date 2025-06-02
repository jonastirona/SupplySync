using System.ComponentModel.DataAnnotations;

namespace SupplySync.Api.Models;

public class LLMQueryRequest
{
    [Required]
    public string Question { get; set; } = string.Empty;
} 