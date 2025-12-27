from django.db import models
from django.utils.text import slugify

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"

class Product(models.Model):
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    brand = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, related_name='variants', on_delete=models.CASCADE)
    size = models.CharField(max_length=100, help_text="e.g. S, M, L, XL, 32, 34")
    color = models.CharField(max_length=100, help_text="e.g. Red, Blue, Black")
    
    # Stock & Pricing
    barcode = models.CharField(max_length=100, unique=True, help_text="Scan Barcode here")
    price_cost = models.DecimalField(max_digits=10, decimal_places=2, help_text="Purchase Price", default=0)
    price_retail = models.DecimalField(max_digits=10, decimal_places=2, help_text="Selling Price")
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="GST Percentage (e.g. 18.00)")
    stock_quantity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        unique_together = ('product', 'size', 'color')

    def __str__(self):
        return f"{self.product.name} ({self.size}/{self.color}) - {self.barcode}"
