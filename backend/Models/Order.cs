using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SupplySync.Api.Models;

public class Order
{
    public int Id { get; set; }

    [Required]
    public string OrderNumber { get; set; } = string.Empty;

    [Required]
    public Customer Customer { get; set; } = new();

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

    [Required]
    public string Status { get; set; } = "pending"; // pending, processing, completed, cancelled

    [Column(TypeName = "decimal(18,2)")]
    public decimal Total { get; set; }

    [Required]
    public string PaymentStatus { get; set; } = "pending"; // pending, paid, failed

    [Required]
    public Address ShippingAddress { get; set; } = new();

    public string Notes { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }
}

public class Customer
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Phone]
    public string Phone { get; set; } = string.Empty;
} 