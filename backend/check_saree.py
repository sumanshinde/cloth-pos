import os
import sys
import django

# Add the current directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_proj.settings')
django.setup()

from inventory.models import Product, Variant

print("-" * 30)
products = Product.objects.filter(name__icontains='saree')
print(f"Products with 'saree': {list(products.values_list('name', flat=True))}")

variants = Variant.objects.filter(product__name__icontains='saree')
print(f"Variants with 'saree' in product name: {list(variants.values_list('product__name', 'color', 'size', 'barcode'))}")

all_products = Product.objects.all().values_list('name', flat=True)
print(f"All Products Sample (first 10): {list(all_products)[:10]}")
print("-" * 30)
