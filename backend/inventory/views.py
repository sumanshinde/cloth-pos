from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django.db.models import ProtectedError
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

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot delete this product because it has been sold/referenced in other records."},
                status=status.HTTP_400_BAD_REQUEST
            )

class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['barcode', 'product__name'] # Allow scanning barcode to find item

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot delete this variant because it has been sold/referenced in other records."},
                status=status.HTTP_400_BAD_REQUEST
            )
