namespace SupplySync.Api.DTOs;

public class ProductDTO
{
    public required string Name { get; set; }
    public required string SKU { get; set; }
    public required string Category { get; set; }
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
}
