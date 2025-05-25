using SupplySync.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace SupplySync.Api.Data;

public static class DbSeeder
{
    public static async Task SeedData(AppDbContext context)
    {
        if (await context.Suppliers.AnyAsync())
        {
            return; // Database has been seeded
        }

        // Create suppliers
        var suppliers = new List<Supplier>
        {
            new Supplier
            {
                Name = "TechPro Electronics",
                Code = "TPE001",
                ContactPerson = "John Smith",
                Email = "john.smith@techpro.com",
                Phone = "(555) 123-4567",
                Address = new Address
                {
                    Street = "123 Tech Boulevard",
                    City = "San Jose",
                    State = "CA",
                    ZipCode = "95123",
                    Country = "USA"
                },
                Status = "active",
                PaymentTerms = "Net 30",
                TaxId = "12-3456789",
                Rating = 4.5m
            },
            new Supplier
            {
                Name = "Global Office Supplies",
                Code = "GOS002",
                ContactPerson = "Sarah Johnson",
                Email = "sarah.j@globalsupplies.com",
                Phone = "(555) 987-6543",
                Address = new Address
                {
                    Street = "456 Business Park Ave",
                    City = "Chicago",
                    State = "IL",
                    ZipCode = "60601",
                    Country = "USA"
                },
                Status = "active",
                PaymentTerms = "Net 45",
                TaxId = "98-7654321",
                Rating = 4.8m
            },
            new Supplier
            {
                Name = "Industrial Solutions Inc.",
                Code = "ISI003",
                ContactPerson = "Michael Chen",
                Email = "m.chen@indsolutions.com",
                Phone = "(555) 456-7890",
                Address = new Address
                {
                    Street = "789 Industrial Way",
                    City = "Houston",
                    State = "TX",
                    ZipCode = "77001",
                    Country = "USA"
                },
                Status = "active",
                PaymentTerms = "Net 60",
                TaxId = "45-6789123",
                Rating = 4.2m
            }
        };

        context.Suppliers.AddRange(suppliers);
        await context.SaveChangesAsync();

        // Create products
        var products = new List<Product>
        {
            new Product
            {
                Name = "High-Performance Laptop",
                SKU = "TPE-LAP-001",
                Description = "15\" Business Laptop with Intel i7, 16GB RAM, 512GB SSD",
                Price = 1299.99m,
                StockQuantity = 50,
                LowStockThreshold = 10,
                Category = "Electronics",
                Unit = "piece",
                SupplierId = suppliers[0].Id // TechPro Electronics
            },
            new Product
            {
                Name = "4K Monitor",
                SKU = "TPE-MON-002",
                Description = "27\" 4K Ultra HD Monitor with HDR",
                Price = 499.99m,
                StockQuantity = 30,
                LowStockThreshold = 5,
                Category = "Electronics",
                Unit = "piece",
                SupplierId = suppliers[0].Id
            },
            new Product
            {
                Name = "Premium Paper Pack",
                SKU = "GOS-PAP-001",
                Description = "A4 Premium Printer Paper, 5000 sheets",
                Price = 49.99m,
                StockQuantity = 200,
                LowStockThreshold = 50,
                Category = "Office Supplies",
                Unit = "pack",
                SupplierId = suppliers[1].Id // Global Office Supplies
            },
            new Product
            {
                Name = "Ergonomic Office Chair",
                SKU = "GOS-CHR-002",
                Description = "Adjustable Ergonomic Office Chair with Lumbar Support",
                Price = 299.99m,
                StockQuantity = 25,
                LowStockThreshold = 5,
                Category = "Furniture",
                Unit = "piece",
                SupplierId = suppliers[1].Id
            },
            new Product
            {
                Name = "Industrial Safety Gloves",
                SKU = "ISI-GLV-001",
                Description = "Heavy-duty Safety Gloves, Pack of 12 pairs",
                Price = 89.99m,
                StockQuantity = 150,
                LowStockThreshold = 30,
                Category = "Safety Equipment",
                Unit = "pack",
                SupplierId = suppliers[2].Id // Industrial Solutions
            },
            new Product
            {
                Name = "LED Work Light",
                SKU = "ISI-LGT-002",
                Description = "Rechargeable LED Work Light, 10000 lumens",
                Price = 199.99m,
                StockQuantity = 40,
                LowStockThreshold = 8,
                Category = "Equipment",
                Unit = "piece",
                SupplierId = suppliers[2].Id
            }
        };

        context.Products.AddRange(products);
        await context.SaveChangesAsync();

        // Create sample orders
        var orders = new List<Order>
        {
            new Order
            {
                OrderNumber = "ORD-2024-001",
                Customer = new Customer
                {
                    Name = "Acme Corp",
                    Email = "purchasing@acme.com",
                    Phone = "(555) 111-2233"
                },
                Status = "processing",
                PaymentStatus = "paid",
                ShippingAddress = new Address
                {
                    Street = "100 Corporate Drive",
                    City = "New York",
                    State = "NY",
                    ZipCode = "10001",
                    Country = "USA"
                },
                Notes = "Priority delivery requested",
                Items = new List<OrderItem>
                {
                    new OrderItem
                    {
                        ProductId = products[0].Id, // Laptop
                        Quantity = 5,
                        Price = products[0].Price,
                        Subtotal = 5 * products[0].Price
                    },
                    new OrderItem
                    {
                        ProductId = products[1].Id, // Monitor
                        Quantity = 10,
                        Price = products[1].Price,
                        Subtotal = 10 * products[1].Price
                    }
                }
            },
            new Order
            {
                OrderNumber = "ORD-2024-002",
                Customer = new Customer
                {
                    Name = "TechStart Inc",
                    Email = "office@techstart.com",
                    Phone = "(555) 444-5555"
                },
                Status = "pending",
                PaymentStatus = "pending",
                ShippingAddress = new Address
                {
                    Street = "200 Startup Lane",
                    City = "San Francisco",
                    State = "CA",
                    ZipCode = "94105",
                    Country = "USA"
                },
                Notes = "Please contact before delivery",
                Items = new List<OrderItem>
                {
                    new OrderItem
                    {
                        ProductId = products[2].Id, // Paper Pack
                        Quantity = 20,
                        Price = products[2].Price,
                        Subtotal = 20 * products[2].Price
                    },
                    new OrderItem
                    {
                        ProductId = products[3].Id, // Office Chair
                        Quantity = 15,
                        Price = products[3].Price,
                        Subtotal = 15 * products[3].Price
                    }
                }
            }
        };

        // Calculate order totals
        foreach (var order in orders)
        {
            order.Total = order.Items.Sum(item => item.Subtotal);
        }

        context.Orders.AddRange(orders);
        await context.SaveChangesAsync();

        // Create inventory logs for initial stock
        var inventoryLogs = products.Select(p => new InventoryLog
        {
            ProductId = p.Id,
            QuantityChange = p.StockQuantity,
            Action = "Initial Stock",
            Notes = "Initial inventory setup",
            CreatedAt = DateTime.UtcNow
        }).ToList();

        context.InventoryLogs.AddRange(inventoryLogs);
        await context.SaveChangesAsync();
    }
} 