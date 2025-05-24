using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupplySync.Api.Models;
using SupplySync.Api.Interfaces;

namespace SupplySync.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly IProductRepository _productRepository;

    public ProductController(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    [HttpGet]
    [Authorize] // Any authenticated user can view products
    public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
    {
        var products = await _productRepository.GetAllAsync();
        return Ok(products);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")] // Only admins can create products
    public async Task<ActionResult<Product>> CreateProduct([FromBody] Product product)
    {
        var createdProduct = await _productRepository.AddAsync(product);
        return CreatedAtAction(nameof(GetProducts), new { id = createdProduct.Id }, createdProduct);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Staff")] // Both admins and staff can update products
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] Product product)
    {
        if (id != product.Id)
        {
            return BadRequest();
        }

        await _productRepository.UpdateAsync(product);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")] // Only admins can delete products
    public async Task<IActionResult> DeleteProduct(int id)
    {
        await _productRepository.DeleteAsync(id);
        return NoContent();
    }
} 