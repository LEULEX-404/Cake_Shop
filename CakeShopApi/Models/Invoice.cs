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
        public Invoice Invoice { get; set; } = null!;

        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        // Item-specific fields
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; } // Price per unit or per kg
        public decimal TotalPrice { get; set; }
    }
}
