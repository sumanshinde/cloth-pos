
import os
import django
import sys

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_proj.settings')
django.setup()

from inventory.models import Category, Product, ProductVariant
from sales.models import Sale, SaleItem, Return

def clear_all_data():
    print("⚠️  STARTING DATABASE SCRIPT...")
    
    # 1. Delete Returns (Dependent on Sales)
    print(f"   Deleting {Return.objects.count()} Returns...")
    Return.objects.all().delete()

    # 2. Delete Sales (Dependent on Products/Variants)
    # Note: Deleting Sales deletes SaleItems (CASCADE)
    print(f"   Deleting {Sale.objects.count()} Sales...")
    Sale.objects.all().delete()

    # 3. Delete Inventory
    print(f"   Deleting {ProductVariant.objects.count()} Variants...")
    ProductVariant.objects.all().delete()
    
    print(f"   Deleting {Product.objects.count()} Products...")
    Product.objects.all().delete()
    
    print(f"   Deleting {Category.objects.count()} Categories...")
    Category.objects.all().delete()
    
    print("\n✅ SUCCESS: Database is now empty! You can start fresh.")

if __name__ == "__main__":
    clear_all_data()
