using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SupplySync.Api.Models;

public class Product
{
    public int Id { get; set; }
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public string SKU { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }
    
    public int StockQuantity { get; set; }
    
    public int LowStockThreshold { get; set; }
    
    [Required]
    public string Category { get; set; } = string.Empty;
    
    public string Unit { get; set; } = string.Empty;
    
    public int SupplierId { get; set; }
    
    [ForeignKey("SupplierId")]
    public Supplier Supplier { get; set; } = null!;
    
    public DateTime LastRestocked { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<InventoryLog> InventoryLogs { get; set; } = new List<InventoryLog>();
} 