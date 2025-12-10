using CakeShopApi.Data;
using CakeShopApi.Models;
using Microsoft.EntityFrameworkCore;

public class InvoiceService : IInvoiceService
{
    private readonly AppDbContext _context;

    public InvoiceService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Invoice> CreateInvoiceAsync(Invoice invoice)
    {
        // Calculate total
        invoice.TotalAmount = invoice.Items.Sum(i => i.LineTotal);

        // Save invoice + items
        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        return invoice;
    }
}
