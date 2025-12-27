import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_proj.settings')
django.setup()

from inventory.models import Product, ProductVariant

# Products to delete (old sample data)
old_products = ['Cotton Crew Neck', 'Slim Fit Denim']

for name in old_products:
    products = Product.objects.filter(name=name)
    count = products.count()
    if count > 0:
        # Delete variants first
        for p in products:
            variant_count = p.variants.count()
            p.variants.all().delete()
            print(f"Deleted {variant_count} variants of {name}")
        # Delete products
        products.delete()
        print(f"Deleted product: {name}")

print("\n✅ Old products removed!")
print("\nRemaining products:")
for p in Product.objects.all():
    print(f"  - {p.name} ({p.category.name})")
