using CakeShopApi.Models;
using CakeShopApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddSingleton<ProductService>();
builder.Services.AddControllers();
builder.Services.AddCors();

var app = builder.Build();

// CORS
app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());

// Map controllers
app.MapControllers();

// Comment out HTTPS redirection to avoid dev warning
// app.UseHttpsRedirection();

app.Run();
