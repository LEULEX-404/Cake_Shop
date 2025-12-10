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

        // ======= Billing Methods =======

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
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Barcode == barcode) ?? throw new Exception("Product not found");
            if (qty <= 0) throw new Exception("Quantity must be greater than zero");
            if (qty > product.StockQty) throw new Exception("Insufficient stock");

            product.StockQty -= qty;
            await _context.SaveChangesAsync();
        }

        // ======= Admin Dashboard Methods =======

        // Get product by ID
        public async Task<Product?> GetByIdAsync(int id)
        {
            return await _context.Products.FindAsync(id);
        }

        // Create a new product
        public async Task<Product> CreateAsync(Product product)
        {
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        // Update existing product
        public async Task<Product?> UpdateAsync(Product product)
        {
            var existing = await _context.Products.FindAsync(product.Id);
            if (existing == null) return null;

            existing.Name = product.Name;
            existing.Barcode = product.Barcode;
            existing.Type = product.Type;
            existing.Price = product.Price;
            existing.PricePerKg = product.PricePerKg;
            existing.StockQty = product.StockQty;

            await _context.SaveChangesAsync();
            return existing;
        }

        // Delete product
        public async Task<bool> DeleteAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return false;

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
