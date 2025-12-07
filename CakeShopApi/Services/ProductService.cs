using CakeShopApi.Models;

namespace CakeShopApi.Services
{
    public class ProductService
    {
        private readonly List<Product> _products;

        public ProductService()
        {
            _products = new List<Product>
            {
                new Product { Id = 1, Barcode = "111", Name = "Chocolate Cake", Type = "fixed", Price = 1500m, StockQty = 10m },
                new Product { Id = 2, Barcode = "222", Name = "Ribbon Cake", Type = "weight", PricePerKg = 2500m, StockQty = 20m },
                new Product { Id = 3, Barcode = "333", Name = "Cup Cake", Type = "fixed", Price = 300m, StockQty = 25m }
            };
        }

        public List<Product> GetAll() => _products;

        public Product? GetByBarcode(string barcode)
            => _products.FirstOrDefault(p => p.Barcode == barcode);

        public void ReduceStock(string barcode, decimal qty)
        {
            var product = GetByBarcode(barcode);
            if (product != null && product.StockQty >= qty)
                product.StockQty -= qty;
            else
                throw new Exception("Not enough stock or product not found");
        }
    }
}
