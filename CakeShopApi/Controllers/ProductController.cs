using Microsoft.AspNetCore.Mvc;
using CakeShopApi.Services;
using CakeShopApi.Models;

namespace CakeShopApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly ProductService _service;
        public ProductController(ProductService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

        [HttpGet("barcode/{code}")]
        public async Task<IActionResult> GetByBarcode(string code)
        {
            var product = await _service.GetByBarcodeAsync(code);
            if (product == null) return NotFound("Product not found");
            return Ok(product);
        }

        [HttpPost("reduce")]
        public async Task<IActionResult> ReduceStock([FromBody] ReduceStockRequest request)
        {
            try
            {
                await _service.ReduceStockAsync(request.Barcode, request.Qty);
                return Ok("Stock reduced");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
