from rest_framework import serializers
from .models import Category, Product, ProductVariant

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductVariantSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'product_name', 'size', 'color', 'barcode', 'price_retail', 'stock_quantity', 'gst_rate', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'category_name', 'brand', 'description', 'variants']

    def validate_name(self, value):
        # Normalize name to Title Case (e.g., "saree" -> "Saree") to ensure consistency
        normalized_name = value.strip().title()
        
        # Check for case-insensitive duplicates
        queryset = Product.objects.filter(name__iexact=normalized_name)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
            
        if queryset.exists():
            raise serializers.ValidationError(f"Product '{normalized_name}' already exists.")
            
        return normalized_name
