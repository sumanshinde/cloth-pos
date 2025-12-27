
import os
import django
import sys

# Add the current directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_proj.settings')
django.setup()

from inventory.models import Category, Product, ProductVariant

def create_demo_data():
    print("--- 🛠️ Creating Demo Data for Presentation ---")
    
    # 1. Create Category
    cat, _ = Category.objects.get_or_create(name="Demo Category")
    
    # 2. Create Product
    prod, created = Product.objects.get_or_create(name="Demo Brand Shirt", category=cat)
    if created:
        print(f"✅ Created Product: {prod.name}")
    else:
        print(f"ℹ️ Product already exists: {prod.name}")

    # 3. Create Variants (S=2, M=7, L=3)
    variants_data = [
        {"size": "Small", "color": "Blue", "qty": 2, "bar": "DEMO-S"},
        {"size": "Medium", "color": "Blue", "qty": 7, "bar": "DEMO-M"},
        {"size": "Large", "color": "Blue", "qty": 3, "bar": "DEMO-L"},
    ]
    
    for v in variants_data:
        variant, created = ProductVariant.objects.update_or_create(
            product=prod,
            size=v["size"],
            color=v["color"],
            defaults={
                "stock_quantity": v["qty"],
                "barcode": v["bar"],
                "price_retail": 1200,
                "gst_rate": 18.00
            }
        )
        action = "Created" if created else "Updated"
        print(f"   👉 {action} Variant: {v['size']} | Color: {v['color']} | Stock: {v['qty']} | Barcode: {v['bar']}")
        
    print("\n✅ Demo Data Ready! Total Stock = 12 (Spread across S/M/L)")

if __name__ == "__main__":
    create_demo_data()
