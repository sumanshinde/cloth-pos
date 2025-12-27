import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_proj.settings')
django.setup()

from django.contrib.auth.models import User

try:
    user = User.objects.get(username='admin')
    user.set_password('admin123')
    user.save()
    print('Password updated for admin user!')
except User.DoesNotExist:
    User.objects.create_superuser('admin', 'admin@clothpos.com', 'admin123')
    print('Created new admin user!')
    
print('\nLogin credentials:')
print('Username: admin')
print('Password: admin123')
