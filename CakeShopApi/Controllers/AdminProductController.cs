using Microsoft.AspNetCore.Mvc;
using CakeShopApi.Models;
using CakeShopApi.Services;

namespace CakeShopApi.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    public class AdminProductController : ControllerBase
    {
        private readonly ProductService _service;

        public AdminProductController(ProductService service)
        {
            _service = service;
        }

        // GET: api/admin/adminproduct
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var products = await _service.GetAllAsync();
            return Ok(products);
        }

        // GET: api/admin/adminproduct/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _service.GetByIdAsync(id);
            if (product == null) return NotFound();
            return Ok(product);
        }

        // POST: api/admin/adminproduct
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Product product)
        {
            var created = await _service.CreateAsync(product);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        // PUT: api/admin/adminproduct/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Product product)
        {
            if (id != product.Id) return BadRequest("Product ID mismatch");

            var updated = await _service.UpdateAsync(product);
            if (updated == null) return NotFound();

            return Ok(updated);
        }

        // DELETE: api/admin/adminproduct/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}
