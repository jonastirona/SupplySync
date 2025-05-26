using SupplySync.Api.Data;
using SupplySync.Api.Models;
using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add MongoDB
builder.Services.AddSingleton<MongoDbContext>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    // Reset the collection in development
    var db = app.Services.GetRequiredService<MongoDbContext>();
    try
    {
        db.GetDatabase().DropCollection("Products");
    }
    catch (MongoCommandException ex) when (ex.Message.Contains("ns not found"))
    {
        // Collection doesn't exist, that's fine
    }
}

app.UseHttpsRedirection();

// Create a new product
app.MapPost("/api/products", async (MongoDbContext db, Product product) =>
{
    // Set timestamps
    product.CreatedAt = DateTime.UtcNow;
    product.UpdatedAt = DateTime.UtcNow;

    // Validate supplier exists
    var supplierExists = await db.GetCollection<Supplier>("Suppliers")
        .Find(s => s.Id == product.SupplierId)
        .AnyAsync();
    if (!supplierExists)
        return Results.BadRequest("Invalid supplier ID");

    // Validate warehouses exist
    var warehouseIds = product.Warehouses.Select(w => w.WarehouseId).ToList();
    var warehousesExist = await db.GetCollection<Warehouse>("Warehouses")
        .Find(w => warehouseIds.Contains(w.Id))
        .ToListAsync();
    if (warehousesExist.Count != warehouseIds.Count)
        return Results.BadRequest("One or more invalid warehouse IDs");

    var collection = db.Products<Product>();
    await collection.InsertOneAsync(product);

    // Update supplier's productsSupplied
    var update = Builders<Supplier>.Update.AddToSet(s => s.ProductsSupplied, product.Id);
    await db.GetCollection<Supplier>("Suppliers").UpdateOneAsync(s => s.Id == product.SupplierId, update);

    return Results.Created($"/api/products/{product.Id}", product);
})
.WithName("CreateProduct")
.WithOpenApi();

// Get all products
app.MapGet("/api/products", async (MongoDbContext db) =>
{
    var collection = db.Products<Product>();
    var products = await collection.Find(_ => true).ToListAsync();
    return Results.Ok(products);
})
.WithName("GetAllProducts")
.WithOpenApi();

// Get product by id
app.MapGet("/api/products/{id}", async (MongoDbContext db, string id) =>
{
    var collection = db.Products<Product>();
    var product = await collection.Find(p => p.Id == id).FirstOrDefaultAsync();
    if (product == null)
        return Results.NotFound();
    return Results.Ok(product);
})
.WithName("GetProductById")
.WithOpenApi();

// Update product
app.MapPut("/api/products/{id}", async (MongoDbContext db, string id, Product updatedProduct) =>
{
    updatedProduct.Id = id;
    updatedProduct.UpdatedAt = DateTime.UtcNow;

    // Validate supplier exists
    var supplierExists = await db.GetCollection<Supplier>("Suppliers")
        .Find(s => s.Id == updatedProduct.SupplierId)
        .AnyAsync();
    if (!supplierExists)
        return Results.BadRequest("Invalid supplier ID");

    // Validate warehouses exist
    var warehouseIds = updatedProduct.Warehouses.Select(w => w.WarehouseId).ToList();
    var warehousesExist = await db.GetCollection<Warehouse>("Warehouses")
        .Find(w => warehouseIds.Contains(w.Id))
        .ToListAsync();
    if (warehousesExist.Count != warehouseIds.Count)
        return Results.BadRequest("One or more invalid warehouse IDs");

    var collection = db.Products<Product>();
    
    // Get the old product to check if supplier changed
    var oldProduct = await collection.Find(p => p.Id == id).FirstOrDefaultAsync();
    if (oldProduct == null)
        return Results.NotFound();

    // Update the product
    var result = await collection.ReplaceOneAsync(p => p.Id == id, updatedProduct);
    if (result.ModifiedCount == 0)
        return Results.NotFound();

    // If supplier changed, update both old and new supplier's productsSupplied
    if (oldProduct.SupplierId != updatedProduct.SupplierId)
    {
        // Remove from old supplier
        var removeUpdate = Builders<Supplier>.Update.Pull(s => s.ProductsSupplied, id);
        await db.GetCollection<Supplier>("Suppliers")
            .UpdateOneAsync(s => s.Id == oldProduct.SupplierId, removeUpdate);

        // Add to new supplier
        var addUpdate = Builders<Supplier>.Update.AddToSet(s => s.ProductsSupplied, id);
        await db.GetCollection<Supplier>("Suppliers")
            .UpdateOneAsync(s => s.Id == updatedProduct.SupplierId, addUpdate);
    }

    return Results.Ok(updatedProduct);
})
.WithName("UpdateProduct")
.WithOpenApi();

// Delete product
app.MapDelete("/api/products/{id}", async (MongoDbContext db, string id) =>
{
    var collection = db.Products<Product>();
    
    // Get the product first to know its supplier
    var product = await collection.Find(p => p.Id == id).FirstOrDefaultAsync();
    if (product == null)
        return Results.NotFound();

    // Delete the product
    var result = await collection.DeleteOneAsync(p => p.Id == id);
    if (result.DeletedCount == 0)
        return Results.NotFound();

    // Remove product ID from supplier's productsSupplied
    var update = Builders<Supplier>.Update.Pull(s => s.ProductsSupplied, id);
    await db.GetCollection<Supplier>("Suppliers")
        .UpdateOneAsync(s => s.Id == product.SupplierId, update);

    return Results.NoContent();
})
.WithName("DeleteProduct")
.WithOpenApi();

app.Run();
