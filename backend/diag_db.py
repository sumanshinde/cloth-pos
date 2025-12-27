import os
import sys
import django

# Add current directory to path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_proj.settings')
django.setup()

from inventory.models import Product, ProductVariant

print("-" * 50)
saree_prods = Product.objects.filter(name__icontains='saree')
print(f"Products with 'saree' in name: {len(saree_prods)}")
for p in saree_prods:
    variants = p.variants.all()
    print(f" - Product: {p.name} (ID: {p.id}) | Variants count: {variants.count()}")
    for v in variants:
        print(f"   * Variant: {v.color}/{v.size} | Barcode: {v.barcode} | Retail: {v.price_retail}")

print("\nAll Products Sample:")
for p in Product.objects.all()[:10]:
    print(f" - {p.name}")

print("-" * 50)
