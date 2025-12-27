from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, F, Q
from django.utils import timezone
from datetime import timedelta
from .models import Sale, SaleItem, Return
from .serializers import SaleSerializer, ReturnSerializer

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().order_by('-created_at')
    serializer_class = SaleSerializer
    http_method_names = ['get', 'post', 'head']

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """
        Provides sales analytics including returns impact:
        - Net revenue (sales - returns)
        - Total returns
        - Top-selling products
        - Payment mode breakdown
        """
        # Date filtering logic
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        days = int(request.query_params.get('days', 30))

        if start_date_str and end_date_str:
            try:
                from django.utils.dateparse import parse_datetime
                start_date = parse_datetime(start_date_str)
                end_date = parse_datetime(end_date_str)
            except:
                end_date = timezone.now()
                start_date = end_date - timedelta(days=days)
        else:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)

        # Ensure we cover the full day for the range
        if end_date:
            end_date = end_date.replace(hour=23, minute=59, second=59)
        if start_date:
            start_date = start_date.replace(hour=0, minute=0, second=0)

        # Filter sales within date range
        sales = Sale.objects.filter(created_at__gte=start_date, created_at__lte=end_date)
        
        # Sales Summary
        sales_summary = sales.aggregate(
            total_revenue=Sum('total_amount'),
            total_sales_count=Count('id'),
            total_gst=Sum('gst_total'),
            total_items=Sum('items__quantity')
        )
        
        # Returns Summary - subtract from revenue
        returns = Return.objects.filter(created_at__gte=start_date, created_at__lte=end_date)
        returns_summary = returns.aggregate(
            total_refund_amount=Sum('refund_amount'),
            total_returns_count=Count('id'),
            refund_gst=Sum('refund_gst'),
            total_items_returned=Sum('items__quantity')
        )
        
        # Net Totals
        gross_revenue = float(sales_summary['total_revenue'] or 0)
        total_refunds = float(returns_summary['total_refund_amount'] or 0)
        net_revenue = gross_revenue - total_refunds
        
        total_items_sold = (sales_summary['total_items'] or 0) - (returns_summary['total_items_returned'] or 0)
        net_gst = float(sales_summary['total_gst'] or 0) - float(returns_summary['refund_gst'] or 0)
        
        # Calculate average sale amount
        avg_sale = gross_revenue / sales_summary['total_sales_count'] if sales_summary['total_sales_count'] > 0 else 0
        
        # Payment Mode Breakdown
        payment_breakdown = sales.values('payment_mode').annotate(
            count=Count('id'),
            total=Sum('total_amount')
        ).order_by('-total')
        
        # Top Selling Products
        top_products = SaleItem.objects.filter(
            sale__created_at__gte=start_date,
            sale__created_at__lte=end_date
        ).values(
            product_name=F('variant__product__name'),
            variant_size=F('variant__size'),
            variant_color=F('variant__color')
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total_price')
        ).order_by('-total_quantity')[:10]
        
        # Recent Sales (last 10)
        recent_sales_qs = Sale.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).order_by('-created_at')[:10]
        recent_sales = SaleSerializer(recent_sales_qs, many=True).data
        
        # Recent Returns (last 5)
        recent_returns = Return.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).order_by('-created_at')[:5].values(
            'id', 'return_number', 'original_sale__invoice_number',
            'refund_amount', 'reason', 'created_at'
        )
        
        # Monthly breakdown (Calendar Months for last 6 months)
        monthly_data = []
        current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        for i in range(12):
            # Calculate calendar month range
            if i == 0:
                target_month_start = current_month_start
                month = current_month_start.month
                year = current_month_start.year
            else:
                # Calculate correct year and month for previous months
                year = current_month_start.year
                month = current_month_start.month - i
                while month < 1:
                    month += 12
                    year -= 1
                target_month_start = current_month_start.replace(year=year, month=month, day=1)
            
            # End of target month
            tmp_year = target_month_start.year
            tmp_month = target_month_start.month
            
            if tmp_month == 12:
                next_month_start = target_month_start.replace(year=tmp_year + 1, month=1, day=1)
            else:
                next_month_start = target_month_start.replace(month=tmp_month + 1, day=1)
            target_month_end = next_month_start - timedelta(seconds=1)

            month_sales = Sale.objects.filter(
                created_at__gte=target_month_start,
                created_at__lte=target_month_end
            ).aggregate(revenue=Sum('total_amount'), count=Count('id'))
            
            month_returns = Return.objects.filter(
                created_at__gte=target_month_start,
                created_at__lte=target_month_end
            ).aggregate(refunds=Sum('refund_amount'))
            
            monthly_data.append({
                'month': target_month_start.strftime('%B %Y'),
                'revenue': float(month_sales['revenue'] or 0),
                'refunds': float(month_returns['refunds'] or 0),
                'net': float(month_sales['revenue'] or 0) - float(month_returns['refunds'] or 0),
                'count': month_sales['count']
            })
            if i == 11: break # Limit to 12 months
        
        return Response({
            'summary': {
                'gross_revenue': gross_revenue,
                'total_revenue': gross_revenue, # Alias for consistency
                'total_refunds': total_refunds,
                'net_revenue': net_revenue,
                'total_sales': sales_summary['total_sales_count'],
                'total_items': total_items_sold,
                'total_returns': returns_summary['total_returns_count'],
                'total_gst': net_gst,
                'average_sale': float(avg_sale),
                'period_days': days,
                'start_date': start_date,
                'end_date': end_date
            },
            'payment_breakdown': list(payment_breakdown),
            'top_products': list(top_products),
            'recent_sales': list(recent_sales),
            'recent_returns': list(recent_returns),
            'monthly_data': monthly_data[::-1]
        })


class ReturnViewSet(viewsets.ModelViewSet):
    queryset = Return.objects.all().order_by('-created_at')
    serializer_class = ReturnSerializer
    http_method_names = ['get', 'post', 'head']
