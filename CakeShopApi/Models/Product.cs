namespace CakeShopApi.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Barcode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;

        // "fixed" or "weight"
        public string Type { get; set; } = string.Empty;

        // Fixed price cakes use this
        public decimal Price { get; set; }

        // Weight-based cakes use this (price per kilo)
        public decimal PricePerKg { get; set; }

        // Available stock (for fixed cakes: units, for weight cakes: kg)
        public decimal StockQty { get; set; }
    }
}
