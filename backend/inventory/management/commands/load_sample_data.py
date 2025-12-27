from django.core.management.base import BaseCommand
from inventory.models import Category, Product, ProductVariant

class Command(BaseCommand):
    help = 'Load sample data for testing'

    def handle(self, *args, **kwargs):
        # Create Categories
        tshirts, _ = Category.objects.get_or_create(name='T-Shirts', slug='t-shirts')
        jeans, _ = Category.objects.get_or_create(name='Jeans', slug='jeans')
        
        # Create Products
        product1, _ = Product.objects.get_or_create(
            category=tshirts,
            name='Cotton Crew Neck',
            brand='Nike'
        )
        
        product2, _ = Product.objects.get_or_create(
            category=jeans,
            name='Slim Fit Denim',
            brand='Levis'
        )
        
        # Create Variants
        variants_data = [
            # T-Shirts
            {'product': product1, 'size': 'M', 'color': 'Red', 'barcode': 'ABC123', 'price_retail': 1500, 'gst_rate': 18, 'stock_quantity': 50},
            {'product': product1, 'size': 'L', 'color': 'Blue', 'barcode': 'DEF456', 'price_retail': 1600, 'gst_rate': 18, 'stock_quantity': 30},
            {'product': product1, 'size': 'XL', 'color': 'Black', 'barcode': 'GHI789', 'price_retail': 1700, 'gst_rate': 18, 'stock_quantity': 20},
            
            # Jeans
            {'product': product2, 'size': '32', 'color': 'Dark Blue', 'barcode': 'JKL101', 'price_retail': 2500, 'gst_rate': 18, 'stock_quantity': 40},
            {'product': product2, 'size': '34', 'color': 'Light Blue', 'barcode': 'MNO202', 'price_retail': 2600, 'gst_rate': 18, 'stock_quantity': 35},
        ]
        
        for data in variants_data:
            ProductVariant.objects.get_or_create(
                barcode=data['barcode'],
                defaults=data
            )
        
        self.stdout.write(self.style.SUCCESS('✅ Sample data loaded successfully!'))
        self.stdout.write('Test barcodes: ABC123, DEF456, GHI789, JKL101, MNO202')
