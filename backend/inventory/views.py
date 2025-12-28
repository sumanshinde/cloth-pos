from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django.db.models import ProtectedError
from .models import Category, Product, ProductVariant
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.db.models import ProtectedError
from .models import Category, Product, ProductVariant
from sales.models import Sale, Return
from .serializers import CategorySerializer, ProductSerializer, ProductVariantSerializer

@api_view(['POST'])
def reset_database(request):
    """
    DANGEROUS: Wipes all data to start fresh.
    """
    try:
        # 1. Delete Returns (Dependent on Sales)
        Return.objects.all().delete()
        # 2. Delete Sales (Dependent on Products/Variants)
        Sale.objects.all().delete()
        # 3. Delete Inventory
        ProductVariant.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        
        return Response({"message": "Database reset successfully!"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
