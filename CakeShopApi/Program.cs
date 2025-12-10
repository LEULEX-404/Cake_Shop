using CakeShopApi.Data;
using CakeShopApi.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add controllers
builder.Services.AddControllers();

// Configure EF Core with MySQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        new MySqlServerVersion(new Version(8, 0, 42)), // Set your MySQL version here
        mySqlOptions => mySqlOptions.EnableRetryOnFailure() // Helps with transient connection issues
    )
);

// Register ProductService as scoped (so it uses DbContext properly)
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<IInvoiceService,InvoiceService>();

// Enable CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod()
    );
});

// Build the app
var app = builder.Build();


// Use CORS
app.UseCors();

// Map controllers
app.MapControllers();

// Optional: disable HTTPS redirection for dev
// app.UseHttpsRedirection();

// Run the app
app.Run();
