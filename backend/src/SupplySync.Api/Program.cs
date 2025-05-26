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
    var collection = db.Products<Product>();
    await collection.InsertOneAsync(product);
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
    var collection = db.Products<Product>();
    updatedProduct.Id = id;
    var result = await collection.ReplaceOneAsync(p => p.Id == id, updatedProduct);
    if (result.ModifiedCount == 0)
        return Results.NotFound();
    return Results.Ok(updatedProduct);
})
.WithName("UpdateProduct")
.WithOpenApi();

// Delete product
app.MapDelete("/api/products/{id}", async (MongoDbContext db, string id) =>
{
    var collection = db.Products<Product>();
    var result = await collection.DeleteOneAsync(p => p.Id == id);
    if (result.DeletedCount == 0)
        return Results.NotFound();
    return Results.NoContent();
})
.WithName("DeleteProduct")
.WithOpenApi();

app.Run();
