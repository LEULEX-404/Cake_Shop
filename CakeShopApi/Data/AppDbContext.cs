using CakeShopApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CakeShopApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Product> Products { get; set; } = null!;
        public DbSet<Invoice> Invoices { get; set; } = null!;
        public DbSet<InvoiceItem> InvoiceItems { get; set; } = null!;


        protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>().HasData(
            new Product { Id = 1, Barcode = "111", Name = "Chocolate Cake", Type = "fixed", Price = 1500m, StockQty = 10m },
            new Product { Id = 2, Barcode = "222", Name = "Ribbon Cake", Type = "weight", PricePerKg = 2500m, StockQty = 20m },
            new Product { Id = 3, Barcode = "333", Name = "Cup Cake", Type = "fixed", Price = 300m, StockQty = 25m }
        );

        modelBuilder.Entity<InvoiceItem>()
            .HasOne(ii => ii.Invoice)
            .WithMany(i => i.Items)
            .HasForeignKey(ii => ii.InvoiceId);

        modelBuilder.Entity<InvoiceItem>()
            .HasOne(ii => ii.Product)
            .WithMany() // no need to navigate from product to invoice items yet
            .HasForeignKey(ii => ii.ProductId);

    }

    }
    
}
