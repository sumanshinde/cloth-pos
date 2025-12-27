from django.contrib.auth import get_user_model
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_proj.settings')
django.setup()

User = get_user_model()
username = 'abhacreations0110@gmail.com'
password = 'AbhaCreations@123'
email = 'abhacreations0110@gmail.com'

try:
    try:
        user = User.objects.get(username=username)
        print(f"User {username} exists. Updating password...")
    except User.DoesNotExist:
        print(f"User {username} not found. Creating new superuser...")
        user = User(username=username, email=email)
        user.is_superuser = True
        user.is_staff = True

    user.set_password(password)
    user.save()
    print(f"Successfully set up user: {username}")

except Exception as e:
    print(f"Error setting up user: {e}")
