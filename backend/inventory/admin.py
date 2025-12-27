from django.contrib import admin
from .models import Category, Product, ProductVariant

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductVariantInline]
    list_display = ('name', 'category', 'brand')
    search_fields = ('name', 'brand')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'size', 'color', 'price_retail', 'stock_quantity', 'barcode')
    search_fields = ('barcode', 'product__name')
