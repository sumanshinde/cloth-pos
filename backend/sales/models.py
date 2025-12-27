from django.db import models
from django.contrib.auth.models import User
from inventory.models import ProductVariant
import uuid

class Sale(models.Model):
    PAYMENT_MODES = [
        ('CASH', 'Cash'),
        ('CARD', 'Card'),
        ('UPI', 'UPI'),
        ('MIXED', 'Mixed'),
    ]

    invoice_number = models.CharField(max_length=50, unique=True, editable=False)
    cashier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    customer_name = models.CharField(max_length=100, blank=True, null=True)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gst_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_mode = models.CharField(max_length=10, choices=PAYMENT_MODES, default='CASH')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # Simple Invoice Number Logic: INV-UUID-First 8 chars
            # In production, use a sequence table or Redis counter
            self.invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.total_amount}"

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT) # Don't allow deleting sold items
    quantity = models.PositiveIntegerField(default=1)
    
    # Snapshot of price at time of sale
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity} x {self.variant.product.name}"


class Return(models.Model):
    """Track customer returns with refund details"""
    RETURN_REASONS = [
        ('DEFECT', 'Defective Product'),
        ('WRONG_SIZE', 'Wrong Size'),
        ('WRONG_COLOR', 'Wrong Color'),
        ('NOT_AS_EXPECTED', 'Not as Expected'),
        ('CUSTOMER_CHANGE', 'Customer Changed Mind'),
        ('OTHER', 'Other'),
    ]
    
    return_number = models.CharField(max_length=50, unique=True, editable=False)
    original_sale = models.ForeignKey(Sale, related_name='returns', on_delete=models.CASCADE)
    reason = models.CharField(max_length=20, choices=RETURN_REASONS, default='OTHER')
    notes = models.TextField(blank=True, null=True)
    
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    refund_gst = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.return_number:
            self.return_number = f"RET-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Return {self.return_number} - ₹{self.refund_amount}"


class ReturnItem(models.Model):
    """Individual items in a return"""
    return_order = models.ForeignKey(Return, related_name='items', on_delete=models.CASCADE)
    sale_item = models.ForeignKey(SaleItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    refund_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    def __str__(self):
        return f"{self.quantity} x {self.sale_item.variant.product.name} returned"
