from django.contrib import admin
from .models import Sale, SaleItem

class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ('variant', 'quantity', 'unit_price', 'total_price')
    can_delete = False

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    inlines = [SaleItemInline]
    list_display = ('invoice_number', 'total_amount', 'payment_mode', 'created_at')
    readonly_fields = ('invoice_number', 'total_amount', 'gst_total', 'created_at')
    search_fields = ('invoice_number',)
