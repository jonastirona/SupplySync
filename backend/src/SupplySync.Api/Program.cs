using SupplySync.Api.Data;
using SupplySync.Api.Models;
using SupplySync.Api.Models.Requests;
using SupplySync.Api.Filters;
using MongoDB.Driver;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.OpenApi.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200")  // Angular dev server
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddSwaggerGen(options =>
{
    // Document API information
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SupplySync API",
        Version = "v1",
        Description = "Supply Chain Management System API",
        Contact = new OpenApiContact
        {
            Name = "SupplySync Team"
        }
    });
    
    // Add JWT Bearer Authentication
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = """
            JWT Authorization header using the Bearer scheme.
            Enter 'Bearer' [space] and then your token in the text input below.
            Example: 'Bearer 12345abcdef'
            """,
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    // Add global security requirement
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Add operation filter to exclude auth requirement for login/register endpoints
    options.OperationFilter<SwaggerAuthOperationFilter>();
});

// Configure MongoDB
builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDb"));
builder.Services.AddSingleton<MongoDbContext>();

// Configure JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSecret = builder.Configuration["Jwt:Secret"];
            
        if (string.IsNullOrEmpty(jwtSecret))
            throw new InvalidOperationException("JWT secret is not configured");
            
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

// Configure authorization with roles
builder.Services.AddAuthorization(options =>
{
    // Default policy requires authentication
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    // Admin-only policy
    options.AddPolicy("RequireAdminRole", policy =>
        policy.RequireRole("Admin"));
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Add CORS middleware
app.UseCors();

app.UseHttpsRedirection();

// Add Authentication & Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

// Register endpoint
app.MapPost("/api/auth/register", async (MongoDbContext db, RegisterRequest request) =>
{
    // Validate role code
    string role = request.RoleCode switch
    {
        "ADMIN123" => "Admin",
        "STAFF123" => "Staff",
        _ => string.Empty
    };

    if (string.IsNullOrEmpty(role))
    {
        return Results.BadRequest("Invalid role code");
    }

    var usersCollection = db.Users;

    // Check for existing username or email
    var existingUser = await usersCollection
        .Find(u => u.Username == request.Username || u.Email == request.Email)
        .FirstOrDefaultAsync();

    if (existingUser != null)
    {
        if (existingUser.Username == request.Username)
        {
            return Results.BadRequest("Username already exists");
        }
        return Results.BadRequest("Email already exists");
    }

    // Create new user with hashed password
    var user = new User
    {
        Username = request.Username,
        Email = request.Email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
        Role = role,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    await usersCollection.InsertOneAsync(user);

    // Return success response with user ID and role
    return Results.Created($"/api/users/{user.Id}", new { Id = user.Id, Role = user.Role });
})
.AllowAnonymous()  // Allow anonymous access
.WithName("Register")
.Produces<object>(201)
.Produces(400)
.WithOpenApi(operation =>
{
    operation.Summary = "Register a new user";
    operation.Description = "Creates a new user account with the specified role";
    operation.Responses["201"].Description = "User successfully registered";
    operation.Responses["400"].Description = "Invalid request (duplicate username/email or invalid role code)";
    return operation;
});

// Login endpoint
app.MapPost("/api/auth/login", async (MongoDbContext db, IConfiguration config, LoginRequest request) =>
{
    var user = await db.Users
        .Find(u => u.Email == request.Email)
        .FirstOrDefaultAsync();

    if (user == null)
    {
        return Results.BadRequest("Invalid email or password");
    }

    if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
    {
        return Results.BadRequest("Invalid email or password");
    }

    // Generate JWT token
    var jwtSecret = config["Jwt:Secret"] ?? 
        throw new InvalidOperationException("JWT secret is not configured");

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id),
        new Claim(JwtRegisteredClaimNames.Email, user.Email),
        new Claim(ClaimTypes.Role, user.Role),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
    };

    var token = new JwtSecurityToken(
        claims: claims,
        expires: DateTime.UtcNow.AddHours(24),
        signingCredentials: creds
    );

    var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

    return Results.Ok(new { Token = tokenString, Role = user.Role });
})
.AllowAnonymous()  // Allow anonymous access
.WithName("Login")
.Produces<object>(200)
.Produces(400)
.WithOpenApi(operation =>
{
    operation.Summary = "Login with email and password";
    operation.Description = "Authenticates a user and returns a JWT token";
    operation.Responses["200"].Description = "Login successful";
    operation.Responses["400"].Description = "Invalid credentials";
    return operation;
});

// Protected test endpoint
app.MapGet("/api/test/auth", () =>
{
    return Results.Ok(new { message = "You have access to this protected endpoint!" });
})
.RequireAuthorization()  // This makes the endpoint require authentication
.WithName("TestAuth")
.WithOpenApi(operation =>
{
    operation.Summary = "Test protected endpoint";
    operation.Description = "This endpoint requires a valid JWT token";
    return operation;
});

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
        .Find(w => w.Id != null && warehouseIds.Contains(w.Id))
        .ToListAsync();
    if (warehousesExist.Count != warehouseIds.Count)
        return Results.BadRequest("One or more invalid warehouse IDs");

    await collection.InsertOneAsync(product);

    // Update supplier's productsSupplied
    var update = Builders<Supplier>.Update.AddToSet(s => s.ProductsSupplied, product.Id);
    await db.GetCollection<Supplier>("Suppliers").UpdateOneAsync(s => s.Id == product.SupplierId, update);

    return Results.Created($"/api/products/{product.Id}", product);
})
.RequireAuthorization("RequireAdminRole")
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
.RequireAuthorization()
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
.RequireAuthorization()
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
        .Find(w => w.Id != null && warehouseIds.Contains(w.Id))
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
            .UpdateOneAsync(s => s.Id != null && s.ProductsSupplied.Contains(id), removeUpdate);

        // Add to new supplier
        var addUpdate = Builders<Supplier>.Update.AddToSet(s => s.ProductsSupplied, id);
        await suppliersCollection
            .UpdateOneAsync(s => s.Id == updatedProduct.SupplierId, addUpdate);
    }

    return Results.Ok(updatedProduct);
})
.RequireAuthorization("RequireAdminRole")
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
            s => s.Id != null && s.ProductsSupplied.Contains(id),
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
.RequireAuthorization("RequireAdminRole")
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
.RequireAuthorization()
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
.RequireAuthorization()
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
.RequireAuthorization("RequireAdminRole")
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
.RequireAuthorization("RequireAdminRole")
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
.RequireAuthorization("RequireAdminRole")
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
.RequireAuthorization()
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
.RequireAuthorization()
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
.RequireAuthorization("RequireAdminRole")
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
.RequireAuthorization("RequireAdminRole")
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
.RequireAuthorization("RequireAdminRole")
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
    
    // Get all products
    var products = await collection.Find(_ => true).ToListAsync();
    
    // Filter products that have any warehouse with quantity below or at reorder threshold
    var lowStockProducts = products.Where(p => 
        p.Warehouses.Any(w => w.Quantity <= w.ReorderThreshold)
    ).ToList();

    return Results.Ok(lowStockProducts);
})
.RequireAuthorization()
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
.RequireAuthorization()
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
.RequireAuthorization()
.WithName("GetWarehouseProducts")
.WithOpenApi();

#endregion

// Get current user's role
app.MapGet("/api/auth/role", (ClaimsPrincipal user) =>
{
    var role = user.FindFirst(ClaimTypes.Role)?.Value;
    if (string.IsNullOrEmpty(role))
    {
        return Results.BadRequest("Role not found in token");
    }
    return Results.Ok(new { Role = role });
})
.RequireAuthorization()  // Requires authentication but no specific role
.WithName("GetUserRole")
.Produces<object>(200)
.Produces(400)
.WithOpenApi(operation =>
{
    operation.Summary = "Get current user's role";
    operation.Description = "Returns the role of the currently authenticated user";
    return operation;
});

app.Run();
