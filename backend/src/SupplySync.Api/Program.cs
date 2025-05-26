using SupplySync.Api.Data;
using SupplySync.Api.Models;
using MongoDB.Driver;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Document 201 responses
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "SupplySync API", Version = "v1" });
});

// Add MongoDB
builder.Services.AddSingleton<MongoDbContext>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Helper function to validate MongoDB ObjectId format
bool IsValidObjectId(string id)
{
    if (string.IsNullOrEmpty(id)) return false;
    // MongoDB ObjectId is a 24-character hex string
    return Regex.IsMatch(id, "^[0-9a-fA-F]{24}$");
}

// Create a new product
app.MapPost("/api/products", async (MongoDbContext db, Product product) =>
{
    // Set timestamps
    product.CreatedAt = DateTime.UtcNow;
    product.UpdatedAt = DateTime.UtcNow;

    // Validate supplier ID format
    if (!IsValidObjectId(product.SupplierId))
        return Results.BadRequest("Invalid supplier ID format");

    // Validate warehouse ID formats
    if (product.Warehouses.Any(w => !IsValidObjectId(w.WarehouseId)))
        return Results.BadRequest("Invalid warehouse ID format");

    // Check for duplicate SKU
    var collection = db.Products<Product>();
    var existingProduct = await collection.Find(p => p.SKU == product.SKU).FirstOrDefaultAsync();
    if (existingProduct != null)
        return Results.BadRequest($"A product with SKU '{product.SKU}' already exists");

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

    await collection.InsertOneAsync(product);

    // Update supplier's productsSupplied
    var update = Builders<Supplier>.Update.AddToSet(s => s.ProductsSupplied, product.Id);
    await db.GetCollection<Supplier>("Suppliers").UpdateOneAsync(s => s.Id == product.SupplierId, update);

    return Results.Created($"/api/products/{product.Id}", product);
})
.WithName("CreateProduct")
.Produces<Product>(201)
.Produces(400)
.WithOpenApi(operation => {
    operation.Responses["201"].Description = "Product successfully created";
    operation.Responses["400"].Description = "Invalid request (duplicate SKU, invalid IDs, etc)";
    return operation;
});

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
    if (!IsValidObjectId(id))
        return Results.BadRequest("Invalid ID format");

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
    if (!IsValidObjectId(id))
        return Results.BadRequest("Invalid ID format");

    updatedProduct.Id = id;
    updatedProduct.UpdatedAt = DateTime.UtcNow;

    // Validate supplier ID format
    if (!IsValidObjectId(updatedProduct.SupplierId))
        return Results.BadRequest("Invalid supplier ID format");

    var collection = db.Products<Product>();

    // Get existing product
    var existingProduct = await collection.Find(p => p.Id == id).FirstOrDefaultAsync();
    if (existingProduct == null)
        return Results.NotFound();

    // Check for duplicate SKU (only if SKU changed)
    if (updatedProduct.SKU != existingProduct.SKU)
    {
        var duplicateSku = await collection
            .Find(p => p.SKU == updatedProduct.SKU && p.Id != id)
            .AnyAsync();
        if (duplicateSku)
            return Results.BadRequest($"A product with SKU '{updatedProduct.SKU}' already exists");
    }

    // Validate warehouses exist and have valid IDs
    var warehouseIds = updatedProduct.Warehouses.Select(w => w.WarehouseId).ToList();
    if (warehouseIds.Any(id => !IsValidObjectId(id)))
        return Results.BadRequest("Invalid warehouse ID format");

    var warehousesExist = await db.GetCollection<Warehouse>("Warehouses")
        .Find(w => warehouseIds.Contains(w.Id))
        .ToListAsync();
    if (warehousesExist.Count != warehouseIds.Count)
        return Results.BadRequest("One or more invalid warehouse IDs");

    // Update the product
    var result = await collection.ReplaceOneAsync(p => p.Id == id, updatedProduct);
    if (result.ModifiedCount == 0)
        return Results.NotFound();

    // If supplier changed, update both old and new supplier's productsSupplied
    if (existingProduct.SupplierId != updatedProduct.SupplierId)
    {
        var suppliersCollection = db.GetCollection<Supplier>("Suppliers");
        
        // Remove from old supplier
        var removeUpdate = Builders<Supplier>.Update.Pull(s => s.ProductsSupplied, id);
        await suppliersCollection
            .UpdateOneAsync(s => s.Id == existingProduct.SupplierId, removeUpdate);

        // Add to new supplier
        var addUpdate = Builders<Supplier>.Update.AddToSet(s => s.ProductsSupplied, id);
        await suppliersCollection
            .UpdateOneAsync(s => s.Id == updatedProduct.SupplierId, addUpdate);
    }

    return Results.Ok(updatedProduct);
})
.WithName("UpdateProduct")
.Produces<Product>(200)
.Produces(400)
.Produces(404)
.WithOpenApi(operation => {
    operation.Responses["200"].Description = "Product successfully updated";
    operation.Responses["400"].Description = "Invalid request (duplicate SKU, invalid IDs, etc)";
    operation.Responses["404"].Description = "Product not found";
    return operation;
});

// Delete product
app.MapDelete("/api/products/{id}", async (MongoDbContext db, string id) =>
{
    if (!IsValidObjectId(id))
        return Results.BadRequest("Invalid ID format");

    var collection = db.Products<Product>();
    var suppliersCollection = db.GetCollection<Supplier>("Suppliers");
    
    // Get the product first to know its supplier
    var product = await collection.Find(p => p.Id == id).FirstOrDefaultAsync();
    if (product == null)
        return Results.NotFound();

    // First remove product ID from supplier's productsSupplied
    var updateResult = await suppliersCollection
        .UpdateOneAsync(
            s => s.Id == product.SupplierId,
            Builders<Supplier>.Update.Pull(s => s.ProductsSupplied, id)
        );

    if (updateResult.ModifiedCount == 0)
    {
        // Log warning but continue with deletion
        Console.WriteLine($"Warning: Product {id} was not found in supplier {product.SupplierId}'s product list");
    }

    // Then delete the product
    var deleteResult = await collection.DeleteOneAsync(p => p.Id == id);
    if (deleteResult.DeletedCount == 0)
    {
        // This should rarely happen since we checked existence above
        return Results.NotFound();
    }

    return Results.NoContent();
})
.WithName("DeleteProduct")
.Produces(204)
.Produces(404)
.WithOpenApi(operation => {
    operation.Responses["204"].Description = "Product successfully deleted";
    operation.Responses["404"].Description = "Product not found";
    return operation;
});

#region Supplier Endpoints

// Get all suppliers
app.MapGet("/api/suppliers", async (MongoDbContext db) =>
{
    var collection = db.GetCollection<Supplier>("Suppliers");
    var suppliers = await collection.Find(_ => true).ToListAsync();
    return Results.Ok(suppliers);
})
.WithName("GetAllSuppliers")
.WithOpenApi();

// Get supplier by ID
app.MapGet("/api/suppliers/{id}", async (MongoDbContext db, string id) =>
{
    if (!IsValidObjectId(id))
        return Results.BadRequest("Invalid ID format");

    var collection = db.GetCollection<Supplier>("Suppliers");
    var supplier = await collection.Find(s => s.Id == id).FirstOrDefaultAsync();
    if (supplier == null)
        return Results.NotFound();
    return Results.Ok(supplier);
})
.WithName("GetSupplierById")
.WithOpenApi();

// Create a new supplier
app.MapPost("/api/suppliers", async (MongoDbContext db, Supplier supplier) =>
{
    // Set creation timestamp
    supplier.CreatedAt = DateTime.UtcNow;
    
    // Initialize empty products list if null
    supplier.ProductsSupplied ??= new List<string>();

    var collection = db.GetCollection<Supplier>("Suppliers");
    
    // Check if email is already in use
    var existingSupplier = await collection.Find(s => s.ContactEmail == supplier.ContactEmail).FirstOrDefaultAsync();
    if (existingSupplier != null)
        return Results.BadRequest("A supplier with this email already exists");

    await collection.InsertOneAsync(supplier);
    return Results.Created($"/api/suppliers/{supplier.Id}", supplier);
})
.WithName("CreateSupplier")
.Produces<Supplier>(201)  // Document 201 response
.WithOpenApi(operation => {
    operation.Responses["201"].Description = "Supplier successfully created";
    return operation;
});

// Update a supplier
app.MapPut("/api/suppliers/{id}", async (MongoDbContext db, string id, Supplier updatedSupplier) =>
{
    if (!IsValidObjectId(id))
        return Results.BadRequest("Invalid ID format");

    var collection = db.GetCollection<Supplier>("Suppliers");
    
    // Get existing supplier
    var filter = Builders<Supplier>.Filter.Eq(s => s.Id, id);
    var existingSupplier = await collection.Find(filter).FirstOrDefaultAsync();
    if (existingSupplier == null)
    {
        return Results.NotFound($"Supplier with ID {id} not found");
    }

    // Check if email is already in use by another supplier
    if (updatedSupplier.ContactEmail != existingSupplier.ContactEmail)
    {
        var emailFilter = Builders<Supplier>.Filter.And(
            Builders<Supplier>.Filter.Ne(s => s.Id, id),
            Builders<Supplier>.Filter.Eq(s => s.ContactEmail, updatedSupplier.ContactEmail)
        );
        var emailExists = await collection.Find(emailFilter).AnyAsync();
        if (emailExists)
            return Results.BadRequest("A supplier with this email already exists");
    }

    // Preserve creation timestamp and products list
    updatedSupplier.Id = id;
    updatedSupplier.CreatedAt = existingSupplier.CreatedAt;
    updatedSupplier.ProductsSupplied = existingSupplier.ProductsSupplied;

    // Use ReplaceOne with IsUpsert false to ensure we only update existing documents
    var result = await collection.ReplaceOneAsync(
        filter,
        updatedSupplier,
        new ReplaceOptions { IsUpsert = false }
    );

    if (result.ModifiedCount == 0)
    {
        // This should rarely happen since we checked existence above
        return Results.NotFound($"Failed to update supplier with ID {id}");
    }

    return Results.Ok(updatedSupplier);
})
.WithName("UpdateSupplier")
.WithOpenApi();

// Delete a supplier
app.MapDelete("/api/suppliers/{id}", async (MongoDbContext db, string id) =>
{
    if (!IsValidObjectId(id))
        return Results.BadRequest("Invalid ID format");

    var collection = db.GetCollection<Supplier>("Suppliers");
    
    // Check if supplier exists and has no products
    var supplier = await collection.Find(s => s.Id == id).FirstOrDefaultAsync();
    if (supplier == null)
        return Results.NotFound();
    
    if (supplier.ProductsSupplied.Any())
        return Results.BadRequest("Cannot delete supplier with associated products");

    var result = await collection.DeleteOneAsync(s => s.Id == id);
    if (result.DeletedCount == 0)
        return Results.NotFound();

    return Results.NoContent();
})
.WithName("DeleteSupplier")
.Produces(204)
.Produces(404)
.WithOpenApi(operation => {
    operation.Responses["204"].Description = "Supplier successfully deleted";
    operation.Responses["404"].Description = "Supplier not found";
    return operation;
});

#endregion

#region Warehouse Endpoints

// Get all warehouses
app.MapGet("/api/warehouses", async (MongoDbContext db) =>
{
    var collection = db.GetCollection<Warehouse>("Warehouses");
    var warehouses = await collection.Find(_ => true).ToListAsync();
    return Results.Ok(warehouses);
})
.WithName("GetAllWarehouses")
.WithOpenApi();

// Get warehouse by ID
app.MapGet("/api/warehouses/{id}", async (MongoDbContext db, string id) =>
{
    if (!IsValidObjectId(id))
        return Results.BadRequest("Invalid ID format");

    var collection = db.GetCollection<Warehouse>("Warehouses");
    var warehouse = await collection.Find(w => w.Id == id).FirstOrDefaultAsync();
    if (warehouse == null)
        return Results.NotFound();
    return Results.Ok(warehouse);
})
.WithName("GetWarehouseById")
.WithOpenApi();

// Create a new warehouse
app.MapPost("/api/warehouses", async (MongoDbContext db, Warehouse warehouse) =>
{
    // Set creation timestamp
    warehouse.CreatedAt = DateTime.UtcNow;

    var collection = db.GetCollection<Warehouse>("Warehouses");
    
    // Check if location code is already in use
    var existingWarehouse = await collection
        .Find(w => w.LocationCode == warehouse.LocationCode)
        .FirstOrDefaultAsync();
    if (existingWarehouse != null)
        return Results.BadRequest("A warehouse with this location code already exists");

    // Validate capacity and utilization
    if (warehouse.Capacity < 0)
        return Results.BadRequest("Capacity cannot be negative");
    if (warehouse.CurrentUtilization < 0)
        return Results.BadRequest("Current utilization cannot be negative");
    if (warehouse.CurrentUtilization > warehouse.Capacity)
        return Results.BadRequest("Current utilization cannot exceed capacity");

    await collection.InsertOneAsync(warehouse);
    return Results.Created($"/api/warehouses/{warehouse.Id}", warehouse);
})
.WithName("CreateWarehouse")
.Produces<Warehouse>(201)  // Document 201 response
.WithOpenApi(operation => {
    operation.Responses["201"].Description = "Warehouse successfully created";
    return operation;
});

// Update warehouse
app.MapPut("/api/warehouses/{id}", async (MongoDbContext db, string id, Warehouse updatedWarehouse) =>
{
    if (!IsValidObjectId(id))
        return Results.BadRequest("Invalid ID format");

    var collection = db.GetCollection<Warehouse>("Warehouses");
    
    // Get existing warehouse
    var existingWarehouse = await collection.Find(w => w.Id == id).FirstOrDefaultAsync();
    if (existingWarehouse == null)
        return Results.NotFound();

    // Check if location code is already in use by another warehouse
    if (updatedWarehouse.LocationCode != existingWarehouse.LocationCode)
    {
        var locationCodeExists = await collection
            .Find(w => w.LocationCode == updatedWarehouse.LocationCode && w.Id != id)
            .AnyAsync();
        if (locationCodeExists)
            return Results.BadRequest("A warehouse with this location code already exists");
    }

    // Validate capacity and utilization
    if (updatedWarehouse.Capacity < 0)
        return Results.BadRequest("Capacity cannot be negative");
    if (updatedWarehouse.CurrentUtilization < 0)
        return Results.BadRequest("Current utilization cannot be negative");
    if (updatedWarehouse.CurrentUtilization > updatedWarehouse.Capacity)
        return Results.BadRequest("Current utilization cannot exceed capacity");

    // Preserve creation timestamp and ID
    updatedWarehouse.Id = id;
    updatedWarehouse.CreatedAt = existingWarehouse.CreatedAt;

    var result = await collection.ReplaceOneAsync(w => w.Id == id, updatedWarehouse);
    if (result.ModifiedCount == 0)
        return Results.NotFound();

    return Results.Ok(updatedWarehouse);
})
.WithName("UpdateWarehouse")
.WithOpenApi();

// Delete warehouse
app.MapDelete("/api/warehouses/{id}", async (MongoDbContext db, string id) =>
{
    if (!IsValidObjectId(id))
        return Results.BadRequest("Invalid ID format");

    // First check if any products are using this warehouse
    var productsCollection = db.Products<Product>();
    var productsUsingWarehouse = await productsCollection
        .Find(p => p.Warehouses.Any(w => w.WarehouseId == id))
        .AnyAsync();

    if (productsUsingWarehouse)
        return Results.BadRequest("Cannot delete warehouse that is being used by products");

    var collection = db.GetCollection<Warehouse>("Warehouses");
    var result = await collection.DeleteOneAsync(w => w.Id == id);
    
    if (result.DeletedCount == 0)
        return Results.NotFound();

    return Results.NoContent();
})
.WithName("DeleteWarehouse")
.Produces(204)
.Produces(404)
.WithOpenApi(operation => {
    operation.Responses["204"].Description = "Warehouse successfully deleted";
    operation.Responses["404"].Description = "Warehouse not found";
    return operation;
});

#endregion

#region Additional Query Endpoints

// Get products below reorder threshold
app.MapGet("/api/products/low-stock", async (MongoDbContext db) =>
{
    var collection = db.Products<Product>();
    
    // First get all products
    var products = await collection.Find(_ => true).ToListAsync();
    
    // Then filter in memory for products with low stock
    var lowStockProducts = products.Where(p => 
        p.Warehouses.Any(w => w.Quantity <= w.ReorderThreshold)
    );

    // Get all warehouse details for enriching the response
    var warehouseCollection = db.GetCollection<Warehouse>("Warehouses");
    var allWarehouses = await warehouseCollection
        .Find(_ => true)
        .ToListAsync();
    var warehousesDict = allWarehouses.ToDictionary(w => w.Id);

    // Enhance the response with warehouse-specific details
    var result = lowStockProducts.Select(p => new
    {
        Product = p,
        LowStockWarehouses = p.Warehouses
            .Where(w => w.Quantity <= w.ReorderThreshold)
            .Select(w => new
            {
                WarehouseId = w.WarehouseId,
                WarehouseName = warehousesDict.TryGetValue(w.WarehouseId, out var wh) ? wh.Name : null,
                LocationCode = warehousesDict.TryGetValue(w.WarehouseId, out var wh2) ? wh2.LocationCode : null,
                CurrentQuantity = w.Quantity,
                ReorderThreshold = w.ReorderThreshold,
                QuantityBelowThreshold = w.ReorderThreshold - w.Quantity
            })
            .ToList()
    });

    return Results.Ok(result);
})
.WithName("GetLowStockProducts")
.WithOpenApi();

// Get all products from a specific supplier
app.MapGet("/api/suppliers/{id}/products", async (MongoDbContext db, string id) =>
{
    if (!IsValidObjectId(id))
        return Results.BadRequest("Invalid ID format");

    // First verify supplier exists
    var supplierExists = await db.GetCollection<Supplier>("Suppliers")
        .Find(s => s.Id == id)
        .AnyAsync();
    
    if (!supplierExists)
        return Results.NotFound("Supplier not found");

    var collection = db.Products<Product>();
    var products = await collection
        .Find(p => p.SupplierId == id)
        .ToListAsync();

    return Results.Ok(products);
})
.WithName("GetSupplierProducts")
.WithOpenApi();

// Get all products in a specific warehouse
app.MapGet("/api/warehouses/{id}/products", async (MongoDbContext db, string id) =>
{
    if (!IsValidObjectId(id))
        return Results.BadRequest("Invalid ID format");

    // First verify warehouse exists
    var warehouseExists = await db.GetCollection<Warehouse>("Warehouses")
        .Find(w => w.Id == id)
        .AnyAsync();
    
    if (!warehouseExists)
        return Results.NotFound("Warehouse not found");

    var collection = db.Products<Product>();
    var products = await collection
        .Find(p => p.Warehouses.Any(w => w.WarehouseId == id))
        .ToListAsync();

    // Enhance the response with warehouse-specific inventory details
    var result = products.Select(p => new
    {
        Product = p,
        WarehouseInventory = p.Warehouses
            .Where(w => w.WarehouseId == id)
            .Select(w => new
            {
                Quantity = w.Quantity,
                ReorderThreshold = w.ReorderThreshold,
                IsLowStock = w.Quantity <= w.ReorderThreshold
            })
            .FirstOrDefault()
    });

    return Results.Ok(result);
})
.WithName("GetWarehouseProducts")
.WithOpenApi();

#endregion

app.Run();
