namespace CakeShopApi.Models
{
    public class ReduceStockRequest
    {
        public string Barcode { get; set; } = string.Empty; // cake එකේ barcode
        public decimal Qty { get; set; } // reduce කරන්න ඕන stock quantity
    }
}
