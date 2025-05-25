using Microsoft.EntityFrameworkCore;
using SupplySync.Api.Models;

namespace SupplySync.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<Supplier> Suppliers { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderItem> OrderItems { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<InventoryLog> InventoryLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User entity
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Configure Product entity
        modelBuilder.Entity<Product>()
            .Property(p => p.Price)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Product>()
            .HasOne(p => p.Supplier)
            .WithMany(s => s.Products)
            .HasForeignKey(p => p.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure Order entity
        modelBuilder.Entity<Order>()
            .Property(o => o.Total)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Order>()
            .OwnsOne(o => o.Customer);

        modelBuilder.Entity<Order>()
            .OwnsOne(o => o.ShippingAddress);

        // Configure OrderItem entity
        modelBuilder.Entity<OrderItem>()
            .Property(oi => oi.Price)
            .HasPrecision(18, 2);

        modelBuilder.Entity<OrderItem>()
            .Property(oi => oi.Subtotal)
            .HasPrecision(18, 2);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Product)
            .WithMany(p => p.OrderItems)
            .HasForeignKey(oi => oi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure Supplier entity
        modelBuilder.Entity<Supplier>()
            .OwnsOne(s => s.Address);

        modelBuilder.Entity<Supplier>()
            .HasIndex(s => s.Email)
            .IsUnique();

        modelBuilder.Entity<Supplier>()
            .HasIndex(s => s.Code)
            .IsUnique();

        modelBuilder.Entity<Supplier>()
            .Property(s => s.Rating)
            .HasPrecision(3, 1);

        // Configure InventoryLog entity
        modelBuilder.Entity<InventoryLog>()
            .HasOne(il => il.Product)
            .WithMany(p => p.InventoryLogs)
            .HasForeignKey(il => il.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InventoryLog>()
            .HasOne(il => il.User)
            .WithMany()
            .HasForeignKey(il => il.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
} 