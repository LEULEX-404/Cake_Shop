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
            base.OnModelCreating(modelBuilder);

            // -------------------------------
            // PRODUCT SEEDING
            // -------------------------------
            modelBuilder.Entity<Product>().HasData(
                new Product 
                { 
                    Id = 1, Barcode = "111", Name = "Chocolate Cake", 
                    Type = "fixed", Price = 1500m, StockQty = 10m 
                },

                new Product 
                { 
                    Id = 2, Barcode = "222", Name = "Ribbon Cake", 
                    Type = "weight", PricePerKg = 2500m, StockQty = 20m 
                },

                new Product 
                { 
                    Id = 3, Barcode = "333", Name = "Cup Cake", 
                    Type = "fixed", Price = 300m, StockQty = 25m 
                }
            );

            // -------------------------------
            // INVOICE ↔ INVOICE ITEMS RELATION
            // -------------------------------
            modelBuilder.Entity<Invoice>()
                .HasMany(i => i.Items)
                .WithOne(ii => ii.Invoice)
                .HasForeignKey(ii => ii.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            // -------------------------------
            // PRODUCT ↔ INVOICE ITEMS RELATION
            // -------------------------------
            modelBuilder.Entity<InvoiceItem>()
                .HasOne(ii => ii.Product)
                .WithMany()  // Product does not need InvoiceItems list
                .HasForeignKey(ii => ii.ProductId)
                .OnDelete(DeleteBehavior.Restrict);  // safer for stock-driven systems
        }
    }
}
