using System.Text.Json.Serialization;

namespace CakeShopApi.Models
{
    public class Invoice
    {
        public int Id { get; set; }
        public DateTime Date { get; set; } = DateTime.Now;
        public decimal TotalAmount { get; set; }

        // Navigation property
        public List<InvoiceItem> Items { get; set; } = new();
    }

    public class InvoiceItem
    {
        public int Id { get; set; }

        // Foreign Keys
        public int InvoiceId { get; set; }

         [JsonIgnore]
        public Invoice? Invoice { get; set; }

        public int ProductId { get; set; }
        public Product? Product { get; set; }

        // Item data
        public string ProductName { get; set; } = string.Empty;
        public decimal Qty { get; set; }
        public decimal UnitPrice { get; set; }

        // Automatically calculated line total
        public decimal LineTotal => Qty * UnitPrice;
    }
}
