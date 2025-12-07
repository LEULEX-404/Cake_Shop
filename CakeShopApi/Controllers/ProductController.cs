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
        public IActionResult GetAll() => Ok(_service.GetAll());

        [HttpGet("barcode/{code}")]
        public IActionResult GetByBarcode(string code)
        {
            var product = _service.GetByBarcode(code);
            if (product == null) return NotFound("Product not found");
            return Ok(product);
        }

        [HttpPost("reduce")]
        public IActionResult ReduceStock([FromBody] ReduceStockRequest request)
        {
            try
            {
                _service.ReduceStock(request.Barcode, request.Qty);
                return Ok("Stock reduced");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

    }
}
