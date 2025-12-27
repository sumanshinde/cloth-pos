from rest_framework import viewsets, filters
from .models import Category, Product, ProductVariant
from .serializers import CategorySerializer, ProductSerializer, ProductVariantSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'brand']

class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['barcode', 'product__name'] # Allow scanning barcode to find item
