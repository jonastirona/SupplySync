using SupplySync.Api.Models;

namespace SupplySync.Api.Models;

public class InventoryLog
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int QuantityChange { get; set; }
    public string Action { get; set; } = string.Empty; // e.g., "Restock", "Sale", "Adjustment"
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
} 