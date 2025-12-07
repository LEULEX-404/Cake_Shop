using CakeShopApi.Data;
using CakeShopApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CakeShopApi.Services
{
    public class ProductService
    {
        private readonly AppDbContext _context;

        public ProductService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Product>> GetAllAsync()
        {
            return await _context.Products.ToListAsync();
        }

        public async Task<Product?> GetByBarcodeAsync(string barcode)
        {
            return await _context.Products.FirstOrDefaultAsync(p => p.Barcode == barcode);
        }

        public async Task ReduceStockAsync(string barcode, decimal qty)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Barcode == barcode);
            if (product == null)
                throw new Exception("Product not found");

            if (product.StockQty < qty)
                throw new Exception("Not enough stock");

            product.StockQty -= qty;
            await _context.SaveChangesAsync();
        }
    }
}
