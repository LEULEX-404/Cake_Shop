using CakeShopApi.Data;
using CakeShopApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CakeShopApi.Services
{
    public class InvoiceService
    {
        private readonly AppDbContext _context;
        public InvoiceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Invoice>> GetInvoicesAsync()
        {
            return await _context.Invoices.Include(i => i.Items)
                                          .ThenInclude(ii => ii.Product)
                                          .ToListAsync();
        }

        public async Task<Invoice> CreateInvoiceAsync(List<InvoiceItem> items)
        {
            var invoice = new Invoice
            {
                Items = items,
                TotalAmount = items.Sum(x => x.TotalPrice)
            };

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();
            return invoice;
        }
    }
}
