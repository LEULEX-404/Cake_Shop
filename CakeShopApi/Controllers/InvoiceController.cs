using Microsoft.AspNetCore.Mvc;
using CakeShopApi.Models;

[ApiController]
[Route("api/[controller]")]
public class InvoiceController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public InvoiceController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateInvoice([FromBody] Invoice invoice)
    {
        var result = await _invoiceService.CreateInvoiceAsync(invoice);
        return Ok(result);
    }
}
