from django.core.management.base import BaseCommand
from inventory.models import Category, Product

class Command(BaseCommand):
    help = 'Load cloth shop product categories and products'

    def handle(self, *args, **options):
        # Define categories with their products
        products_data = [
            # Blouses
            {"category": "Blouses", "name": "Readymade Blouse", "description": "Ready to wear blouses in various designs"},
            
            # Sarees
            {"category": "Sarees", "name": "Fancy Designer Saree", "description": "Fancy designer sarees for special occasions"},
            {"category": "Sarees", "name": "Pure Silk Saree", "description": "Premium pure silk sarees"},
            
            # Kurtis
            {"category": "Kurtis", "name": "Designer Kurti Set", "description": "Designer kurti sets with bottom and dupatta"},
            {"category": "Kurtis", "name": "Single Short Kurti", "description": "Short length single piece kurtis"},
            {"category": "Kurtis", "name": "Single Long Kurti", "description": "Long length single piece kurtis"},
            {"category": "Kurtis", "name": "Daily Wear Kurti Set", "description": "Comfortable daily wear kurti sets"},
            
            # Coord Sets
            {"category": "Coord Sets", "name": "Coord Set", "description": "Matching top and bottom sets"},
            
            # One Piece
            {"category": "One Piece", "name": "Single Long One Piece", "description": "Long one piece dresses"},
            {"category": "One Piece", "name": "Single Short One Piece", "description": "Short one piece dresses"},
            
            # Bottom Wear
            {"category": "Bottom Wear", "name": "Leggings", "description": "Comfortable stretchable leggings"},
            {"category": "Bottom Wear", "name": "Chudidar", "description": "Traditional chudidar pants"},
            {"category": "Bottom Wear", "name": "Ankle Length Pants", "description": "Ankle length pants/churidar"},
            {"category": "Bottom Wear", "name": "Pants", "description": "Regular and palazzo pants"},
        ]
        
        created_categories = 0
        created_products = 0
        
        for item in products_data:
            # Get or create category
            category, cat_created = Category.objects.get_or_create(name=item["category"])
            if cat_created:
                created_categories += 1
                self.stdout.write(f"Created category: {category.name}")
            
            # Get or create product
            product, prod_created = Product.objects.get_or_create(
                category=category,
                name=item["name"],
                defaults={"description": item["description"]}
            )
            if prod_created:
                created_products += 1
                self.stdout.write(f"  Created product: {product.name}")
        
        self.stdout.write(self.style.SUCCESS(
            f'\nDone! Created {created_categories} categories and {created_products} products.'
        ))
        self.stdout.write(self.style.WARNING(
            '\nNow add variants (size, color, barcode, price) via Django Admin or Inventory page.'
        ))
