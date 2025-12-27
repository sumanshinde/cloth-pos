from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from inventory.views import CategoryViewSet, ProductViewSet, ProductVariantViewSet
from sales.views import SaleViewSet, ReturnViewSet
from rest_framework.authtoken.views import obtain_auth_token

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'variants', ProductVariantViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'returns', ReturnViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-token-auth/', obtain_auth_token),
]
