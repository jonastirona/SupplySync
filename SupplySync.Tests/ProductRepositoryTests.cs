using Microsoft.EntityFrameworkCore;
using SupplySync.Api.Models;
using SupplySync.Api.Repositories;
using Xunit;

namespace SupplySync.Tests;

public class ProductRepositoryTests
{
    private readonly DbContextOptions<AppDbContext> _options;

    public ProductRepositoryTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestProductDb")
            .Options;
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllProducts()
    {
        // Arrange
        using var context = new AppDbContext(_options);
        var repository = new ProductRepository(context);

        var products = new List<Product>
        {
            new Product { Name = "Product 1", Description = "Description 1", Price = 10.99m, StockQuantity = 100 },
            new Product { Name = "Product 2", Description = "Description 2", Price = 20.99m, StockQuantity = 200 }
        };

        context.Products.AddRange(products);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetAllAsync();

        // Assert
        Assert.Equal(2, result.Count());
        Assert.Contains(result, p => p.Name == "Product 1");
        Assert.Contains(result, p => p.Name == "Product 2");
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ShouldReturnProduct()
    {
        // Arrange
        using var context = new AppDbContext(_options);
        var repository = new ProductRepository(context);

        var product = new Product
        {
            Name = "Test Product",
            Description = "Test Description",
            Price = 15.99m,
            StockQuantity = 150
        };

        context.Products.Add(product);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByIdAsync(product.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(product.Name, result.Name);
        Assert.Equal(product.Description, result.Description);
        Assert.Equal(product.Price, result.Price);
        Assert.Equal(product.StockQuantity, result.StockQuantity);
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ShouldReturnNull()
    {
        // Arrange
        using var context = new AppDbContext(_options);
        var repository = new ProductRepository(context);

        // Act
        var result = await repository.GetByIdAsync(999);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task AddAsync_ShouldAddNewProduct()
    {
        // Arrange
        using var context = new AppDbContext(_options);
        var repository = new ProductRepository(context);

        var product = new Product
        {
            Name = "New Product",
            Description = "New Description",
            Price = 25.99m,
            StockQuantity = 300
        };

        // Act
        var result = await repository.AddAsync(product);

        // Assert
        Assert.NotEqual(0, result.Id);
        var savedProduct = await context.Products.FindAsync(result.Id);
        Assert.NotNull(savedProduct);
        Assert.Equal(product.Name, savedProduct.Name);
        Assert.Equal(product.Description, savedProduct.Description);
        Assert.Equal(product.Price, savedProduct.Price);
        Assert.Equal(product.StockQuantity, savedProduct.StockQuantity);
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateExistingProduct()
    {
        // Arrange
        using var context = new AppDbContext(_options);
        var repository = new ProductRepository(context);

        var product = new Product
        {
            Name = "Original Product",
            Description = "Original Description",
            Price = 30.99m,
            StockQuantity = 400
        };

        context.Products.Add(product);
        await context.SaveChangesAsync();

        // Update product
        product.Name = "Updated Product";
        product.Description = "Updated Description";
        product.Price = 35.99m;
        product.StockQuantity = 450;

        // Act
        await repository.UpdateAsync(product);

        // Assert
        var updatedProduct = await context.Products.FindAsync(product.Id);
        Assert.NotNull(updatedProduct);
        Assert.Equal("Updated Product", updatedProduct.Name);
        Assert.Equal("Updated Description", updatedProduct.Description);
        Assert.Equal(35.99m, updatedProduct.Price);
        Assert.Equal(450, updatedProduct.StockQuantity);
    }

    [Fact]
    public async Task DeleteAsync_ShouldRemoveProduct()
    {
        // Arrange
        using var context = new AppDbContext(_options);
        var repository = new ProductRepository(context);

        var product = new Product
        {
            Name = "Product to Delete",
            Description = "Will be deleted",
            Price = 40.99m,
            StockQuantity = 500
        };

        context.Products.Add(product);
        await context.SaveChangesAsync();

        // Act
        await repository.DeleteAsync(product.Id);

        // Assert
        var deletedProduct = await context.Products.FindAsync(product.Id);
        Assert.Null(deletedProduct);
    }
} 