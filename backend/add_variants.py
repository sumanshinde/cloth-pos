import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_proj.settings')
django.setup()

from inventory.models import Category, Product, ProductVariant
import random

# Sample sizes and colors
sizes = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size']
colors = ['Red', 'Blue', 'Black', 'White', 'Pink', 'Green', 'Yellow', 'Purple', 'Maroon', 'Navy']

# Price ranges by category (cost, retail)
price_ranges = {
    'Blouses': (200, 450),
    'Sarees': (1500, 3500),
    'Kurtis': (400, 850),
    'Coord Sets': (600, 1200),
    'One Piece': (500, 1100),
    'Bottom Wear': (200, 500),
}

def generate_barcode():
    return f"CLT{random.randint(100000, 999999)}"

created_count = 0

# Get all products
products = Product.objects.all()

for product in products:
    category_name = product.category.name
    price_range = price_ranges.get(category_name, (300, 700))
    
    # Create 2-3 variants per product
    num_variants = random.randint(2, 3)
    used_combinations = []
    
    for _ in range(num_variants):
        # Pick random size and color (avoid duplicates)
        for attempt in range(10):
            size = random.choice(sizes)
            color = random.choice(colors)
            if (size, color) not in used_combinations:
                used_combinations.append((size, color))
                break
        
        # Generate prices
        cost_price = random.randint(price_range[0], price_range[1])
        retail_price = int(cost_price * random.uniform(1.3, 1.8))
        
        # Check if variant already exists
        if not ProductVariant.objects.filter(product=product, size=size, color=color).exists():
            variant = ProductVariant.objects.create(
                product=product,
                size=size,
                color=color,
                barcode=generate_barcode(),
                price_cost=cost_price,
                price_retail=retail_price,
                gst_rate=5.00,  # 5% GST for garments
                stock_quantity=random.randint(5, 50)
            )
            print(f"Created: {product.name} - {size}/{color} - ₹{retail_price}")
            created_count += 1

print(f"\n✅ Created {created_count} variants!")
print("Refresh your Inventory page to see the new products.")
