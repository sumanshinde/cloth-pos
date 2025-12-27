from rest_framework import serializers
from .models import Sale, SaleItem, Return, ReturnItem
from inventory.models import ProductVariant
from django.db import transaction

class SaleItemSerializer(serializers.ModelSerializer):
    variant_name = serializers.ReadOnlyField(source='variant.product.name')
    variant_size = serializers.ReadOnlyField(source='variant.size')
    variant_color = serializers.ReadOnlyField(source='variant.color')
    variant_details = serializers.ReadOnlyField(source='variant.__str__')

    class Meta:
        model = SaleItem
        fields = ['id', 'variant', 'variant_name', 'variant_size', 'variant_color', 'variant_details', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['total_price']

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)

    class Meta:
        model = Sale
        fields = ['id', 'invoice_number', 'customer_name', 'customer_phone', 'total_amount', 'gst_total', 'payment_mode', 'created_at', 'items']
        read_only_fields = ['invoice_number', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        with transaction.atomic():
            sale = Sale.objects.create(**validated_data)
            
            total_amount = 0
            gst_total_amount = 0

            for item_data in items_data:
                variant = item_data['variant']
                quantity = item_data['quantity']
                
                # Check Stock
                if variant.stock_quantity < quantity:
                    raise serializers.ValidationError(f"Insufficient stock for {variant}")

                # Deduct Stock
                variant.stock_quantity -= quantity
                variant.save()

                # Calculate Price & GST
                unit_price = variant.price_retail
                total_line_price = unit_price * quantity
                tax_amount = (total_line_price * variant.gst_rate) / 100
                
                SaleItem.objects.create(
                    sale=sale,
                    variant=variant,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_line_price
                )
                
                total_amount += total_line_price + tax_amount
                gst_total_amount += tax_amount

            sale.total_amount = total_amount
            sale.gst_total = gst_total_amount
            sale.save()
            
        return sale


class ReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ReturnItem
        fields = ['id', 'sale_item', 'quantity', 'refund_price', 'product_name']
        read_only_fields = ['refund_price']
    
    def get_product_name(self, obj):
        return f"{obj.sale_item.variant.product.name} ({obj.sale_item.variant.size}/{obj.sale_item.variant.color})"


class ReturnSerializer(serializers.ModelSerializer):
    items = ReturnItemSerializer(many=True)
    original_invoice = serializers.ReadOnlyField(source='original_sale.invoice_number')
    
    class Meta:
        model = Return
        fields = ['id', 'return_number', 'original_sale', 'original_invoice', 'reason', 'notes', 
                  'refund_amount', 'refund_gst', 'created_at', 'items']
        read_only_fields = ['return_number', 'refund_amount', 'refund_gst', 'created_at']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        with transaction.atomic():
            return_order = Return.objects.create(**validated_data)
            
            total_refund = 0
            total_gst_refund = 0
            
            for item_data in items_data:
                sale_item = item_data['sale_item']
                quantity = item_data['quantity']
                
                # Calculate refund
                refund_price = sale_item.unit_price * quantity
                gst_refund = (refund_price * sale_item.variant.gst_rate) / 100
                
                # Restore stock
                sale_item.variant.stock_quantity += quantity
                sale_item.variant.save()
                
                ReturnItem.objects.create(
                    return_order=return_order,
                    sale_item=sale_item,
                    quantity=quantity,
                    refund_price=refund_price
                )
                
                total_refund += refund_price + gst_refund
                total_gst_refund += gst_refund
            
            return_order.refund_amount = total_refund
            return_order.refund_gst = total_gst_refund
            return_order.save()
        
        return return_order
