
import os
import django
import sys

# Add the current directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_proj.settings') 
django.setup()

from inventory.models import Category, Product, ProductVariant
from sales.serializers import SaleSerializer

def run_test():
    print("--- 🧪 Testing Variant-Level Stock Logic ---")
    
    # 1. Setup Data
    cat, _ = Category.objects.get_or_create(name="Test Category")
    prod, _ = Product.objects.get_or_create(name="Logic Test Shirt", category=cat)
    
    # Create two distinct variants
    var_s, _ = ProductVariant.objects.get_or_create(
        product=prod, size="S", color="Blue", barcode="TEST-S", 
        defaults={'price_retail': 100, 'stock_quantity': 10}
    )
    # Reset stock for test
    var_s.stock_quantity = 10
    var_s.save()
    
    var_m, _ = ProductVariant.objects.get_or_create(
        product=prod, size="M", color="Blue", barcode="TEST-M",
        defaults={'price_retail': 100, 'stock_quantity': 10}
    )
    # Reset stock for test
    var_m.stock_quantity = 10
    var_m.save()
    
    print(f"Initial Stock -> Small: {var_s.stock_quantity}, Medium: {var_m.stock_quantity}")
    
    # 2. Simulate Sale of ONLY Small (Qty: 2)
    sale_data = {
        "invoice_number": "TEST-INV-001", # generated automatically usually
        "customer_name": "Tester",
        "payment_mode": "CASH",
        "items": [
            {
                "variant": var_s.id, # Selling SMALL
                "quantity": 2,
                "unit_price": 100
            }
        ]
    }
    
    print("\n🛒 Processing Sale: 2 units of SMALL...")
    
    serializer = SaleSerializer(data=sale_data)
    if serializer.is_valid():
        serializer.save()
        print("✅ Sale Complete!")
    else:
        print("❌ Sale Failed:", serializer.errors)
        return

    # 3. Verify Results
    var_s.refresh_from_db()
    var_m.refresh_from_db()
    
    print(f"\nFinal Stock   -> Small: {var_s.stock_quantity} (Expected 8)")
    print(f"Final Stock   -> Medium: {var_m.stock_quantity} (Expected 10)")
    
    if var_s.stock_quantity == 8 and var_m.stock_quantity == 10:
        print("\n✨ SUCCESS: Stock reduced ONLY for the selected size!")
    else:
        print("\n💀 FAILURE: Stock logic is incorrect.")

if __name__ == "__main__":
    run_test()
