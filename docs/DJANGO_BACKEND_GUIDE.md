# Django REST Framework Backend Guide for MagiVents

This guide details how to implement the production Django REST Framework (DRF) backend to support all frontend features:
- **Patron & Curator Authentication** (JWT + Google Identity Services One-Tap / Button)
- **Profile Management & Avatar Uploads** (Direct image upload, storage, and persistence)
- **Boutique Event & Editorial Artwork Publishing** (Image upload, pricing tiers, agendas)
- **Booking, Tickets, and Bookmarks**

---

## 1. Project Setup & Dependencies

### `requirements.txt`
```text
Django>=5.0,<6.0
djangorestframework>=3.15.0
djangorestframework-simplejwt>=5.3.1
django-cors-headers>=4.3.1
google-auth>=2.29.0
requests>=2.31.0
Pillow>=10.3.0
python-dotenv>=1.0.1
psycopg2-binary>=2.9.9       # PostgreSQL driver (or use sqlite3 for local dev)
django-storages[boto3]>=1.14.2  # Optional: For AWS S3 / Cloudflare R2 media storage
```

Install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## 2. Django Configuration (`settings.py`)

```python
import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-curated-gathering-secret')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # App modules
    'core',
    'accounts',
    'gatherings',
    'tickets',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Top of middleware stack
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework & JWT Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS Configuration (allows Vite frontend dev server and production URLs)
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://your-production-app.run.app",
]
CORS_ALLOW_CREDENTIALS = True

# Media Files (User avatars and Event artwork)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Google OAuth Client ID (must match Google Cloud Console)
GOOGLE_OAUTH_CLIENT_ID = os.environ.get('GOOGLE_OAUTH_CLIENT_ID', '')
```

---

## 3. Database Models

### `accounts/models.py`
```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('patron', 'Patron of the Arts'),
        ('curator', 'Host & Curator'),
    )
    PROVIDER_CHOICES = (
        ('email', 'Email & Password'),
        ('google', 'Google Identity'),
    )

    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    avatar_url = models.CharField(max_length=500, null=True, blank=True)
    bio = models.TextField(blank=True, default='')
    city = models.CharField(max_length=120, blank=True, default='')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patron')
    auth_provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='email')
    google_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    joined_date = models.DateField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    @property
    def effective_avatar_url(self):
        if self.avatar:
            return self.avatar.url
        return self.avatar_url or 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
```

### `gatherings/models.py`
```python
import uuid
from django.db import models
from django.conf import settings

class Gathering(models.Model):
    CATEGORY_CHOICES = (
        ('Culinary & Wine', 'Culinary & Wine'),
        ('Architecture & Design', 'Architecture & Design'),
        ('Fine Arts & Craft', 'Fine Arts & Craft'),
        ('Music & Performance', 'Music & Performance'),
        ('Literature & Thought', 'Literature & Thought'),
        ('Gatherings & Salons', 'Gatherings & Salons'),
    )
    STATUS_CHOICES = (
        ('published', 'Published'),
        ('draft', 'Draft'),
        ('sold_out', 'Sold Out'),
    )

    id = models.CharField(primary_key=True, max_length=100, default=uuid.uuid4, editable=False)
    organizer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organized_gatherings')
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=300, blank=True, default='')
    category = models.CharField(max_length=60, choices=CATEGORY_CHOICES)
    description = models.TextField()
    full_content = models.TextField(blank=True, default='')
    
    date_display = models.CharField(max_length=120)  # e.g., "Saturday, Nov 28, 2026"
    iso_date = models.DateField()
    time_display = models.CharField(max_length=120)  # e.g., "19:00 — 22:30"
    
    # Venue
    venue_name = models.CharField(max_length=255)
    venue_address = models.CharField(max_length=255, blank=True, default='')
    venue_city = models.CharField(max_length=120, blank=True, default='')
    venue_neighborhood = models.CharField(max_length=120, blank=True, default='')
    venue_map_note = models.TextField(blank=True, default='')
    venue_lat = models.FloatField(null=True, blank=True)
    venue_lng = models.FloatField(null=True, blank=True)

    # Capacity & Pricing
    starting_price = models.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    currency = models.CharField(max_length=10, default='$')
    capacity = models.PositiveIntegerField(default=100)
    attendee_count = models.PositiveIntegerField(default=0)

    # Editorial Artwork
    artwork_image = models.ImageField(upload_to='gatherings/artwork/', null=True, blank=True)
    artwork_url = models.CharField(max_length=500, blank=True, default='')

    # Host Identity
    host_name = models.CharField(max_length=120, blank=True, default='')
    host_role = models.CharField(max_length=120, blank=True, default='')
    host_avatar_url = models.CharField(max_length=500, blank=True, default='')
    host_bio = models.TextField(blank=True, default='')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    is_featured = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    curator_note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def get_image_url(self):
        if self.artwork_image:
            return self.artwork_image.url
        return self.artwork_url or ''


class TicketTier(models.Model):
    gathering = models.ForeignKey(Gathering, on_delete=models.CASCADE, related_name='tiers')
    name = models.CharField(max_length=120)  # e.g. "Patron Circle"
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, default='')
    available = models.PositiveIntegerField(default=50)
    perks = models.JSONField(default=list, blank=True)


class AgendaItem(models.Model):
    gathering = models.ForeignKey(Gathering, on_delete=models.CASCADE, related_name='agenda_items')
    time = models.CharField(max_length=50)   # e.g. "19:00"
    title = models.CharField(max_length=200) # e.g. "Welcome Aperitif"
    detail = models.TextField(blank=True, default='')
    order = models.PositiveIntegerField(default=0)
```

### `tickets/models.py`
```python
import uuid
from django.db import models
from django.conf import settings
from gatherings.models import Gathering

class Booking(models.Model):
    PAYMENT_CHOICES = (
        ('mpesa', 'M-Pesa'),
        ('card', 'Credit / Debit Card'),
        ('complimentary', 'Curator Invitation'),
    )

    id = models.CharField(primary_key=True, max_length=100, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='bookings')
    gathering = models.ForeignKey(Gathering, on_delete=models.CASCADE, related_name='bookings')
    
    tier_name = models.CharField(max_length=120)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    attendee_name = models.CharField(max_length=120)
    attendee_email = models.EmailField()
    ticket_code = models.CharField(max_length=60, unique=True)
    booking_date = models.DateTimeField(auto_now_add=True)

    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='card')
    mpesa_phone_number = models.CharField(max_length=30, blank=True, default='')
    mpesa_receipt_number = models.CharField(max_length=50, blank=True, default='')
    total_in_kes = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)


class Bookmark(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookmarks')
    gathering = models.ForeignKey(Gathering, on_delete=models.CASCADE, related_name='bookmarked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'gathering')
```

---

## 4. Google Authentication & User Serializers

### `accounts/serializers.py`
```python
from rest_framework import serializers
from .models import User

class UserProfileSerializer(serializers.ModelSerializer):
    avatarUrl = serializers.CharField(source='effective_avatar_url', read_only=True)
    joinedDate = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'name', 'avatar', 'avatarUrl',
            'bio', 'city', 'role', 'joinedDate', 'auth_provider'
        ]
        read_only_fields = ['id', 'email', 'auth_provider']

    def get_joinedDate(self, obj):
        return obj.joined_date.strftime("%B %Y")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['first_name', 'email', 'password', 'role']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            role=validated_data.get('role', 'patron'),
            auth_provider='email'
        )
        return user


class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField(required=False, help_text="Google ID Token JWT")
    email = serializers.EmailField(required=False)
    name = serializers.CharField(required=False)
    avatarUrl = serializers.CharField(required=False)
```

### `accounts/views.py`
```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from .models import User
from .serializers import UserProfileSerializer, RegisterSerializer, GoogleAuthSerializer

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        credential = serializer.validated_data.get('credential')
        email = serializer.validated_data.get('email')
        name = serializer.validated_data.get('name')
        avatar_url = serializer.validated_data.get('avatarUrl')
        google_sub = None

        # Verify Google JWT if provided
        if credential and settings.GOOGLE_OAUTH_CLIENT_ID:
            try:
                id_info = id_token.verify_oauth2_token(
                    credential,
                    google_requests.Request(),
                    settings.GOOGLE_OAUTH_CLIENT_ID
                )
                email = id_info.get('email')
                name = id_info.get('name', '')
                avatar_url = id_info.get('picture', '')
                google_sub = id_info.get('sub')
            except ValueError:
                return Response({'error': 'Invalid Google token signature.'}, status=status.HTTP_400_BAD_REQUEST)

        if not email:
            return Response({'error': 'Email is required for Google account authentication.'}, status=status.HTTP_400_BAD_REQUEST)

        # Lookup or create user
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            user = User.objects.create(
                username=email,
                email=email,
                first_name=name or email.split('@')[0],
                avatar_url=avatar_url,
                auth_provider='google',
                google_id=google_sub,
                role='patron'
            )
            user.set_unusable_password()
            user.save()
        else:
            if not user.avatar_url and avatar_url:
                user.avatar_url = avatar_url
                user.save(update_fields=['avatar_url'])

        tokens = get_tokens_for_user(user)
        user_data = UserProfileSerializer(user).data

        return Response({
            'tokens': tokens,
            'user': user_data
        }, status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AvatarUploadView(APIView):
    """Handles direct multipart image file uploads for patron profile photos."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No image file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        
        request.user.avatar = file_obj
        request.user.save(update_fields=['avatar'])
        
        return Response({
            'avatarUrl': request.user.avatar.url,
            'message': 'Profile portrait updated successfully.'
        }, status=status.HTTP_200_OK)
```

---

## 5. Gatherings & Editorial Artwork API

### `gatherings/serializers.py`
```python
from rest_framework import serializers
from .models import Gathering, TicketTier, AgendaItem

class TicketTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketTier
        fields = ['id', 'name', 'price', 'description', 'available', 'perks']

class AgendaItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgendaItem
        fields = ['time', 'title', 'detail', 'order']

class GatheringSerializer(serializers.ModelSerializer):
    tiers = TicketTierSerializer(many=True, required=False)
    agenda = AgendaItemSerializer(source='agenda_items', many=True, required=False)
    imageUrl = serializers.SerializerMethodField()
    venue = serializers.SerializerMethodField()
    pricing = serializers.SerializerMethodField()
    host = serializers.SerializerMethodField()
    date = serializers.CharField(source='date_display')
    isoDate = serializers.DateField(source='iso_date')
    time = serializers.CharField(source='time_display')
    fullContent = serializers.CharField(source='full_content')
    attendeeCount = serializers.IntegerField(source='attendee_count', read_only=True)
    curatorNote = serializers.CharField(source='curator_note', required=False, allow_blank=True)
    isFeatured = serializers.BooleanField(source='is_featured', required=False)

    class Meta:
        model = Gathering
        fields = [
            'id', 'title', 'subtitle', 'category', 'description', 'fullContent',
            'date', 'isoDate', 'time', 'venue', 'pricing', 'capacity', 'attendeeCount',
            'imageUrl', 'artwork_image', 'host', 'agenda', 'status', 'isFeatured',
            'tags', 'curatorNote'
        ]

    def get_imageUrl(self, obj):
        return obj.get_image_url()

    def get_venue(self, obj):
        return {
            'name': obj.venue_name,
            'address': obj.venue_address,
            'city': obj.venue_city,
            'neighborhood': obj.venue_neighborhood,
            'mapNote': obj.venue_map_note,
            'coordinates': {
                'lat': obj.venue_lat,
                'lng': obj.venue_lng
            } if obj.venue_lat and obj.venue_lng else None
        }

    def get_pricing(self, obj):
        return {
            'currency': obj.currency,
            'startingPrice': float(obj.starting_price),
            'tiers': TicketTierSerializer(obj.tiers.all(), many=True).data
        }

    def get_host(self, obj):
        return {
            'name': obj.host_name,
            'role': obj.host_role,
            'avatarUrl': obj.host_avatar_url,
            'bio': obj.host_bio
        }
```

### `gatherings/views.py`
```python
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Gathering
from .serializers import GatheringSerializer

class GatheringViewSet(viewsets.ModelViewSet):
    queryset = Gathering.objects.all().order_by('-iso_date')
    serializer_class = GatheringSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'subtitle', 'venue_city', 'tags']

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_gatherings(self, request):
        """Returns gatherings organized by the current curator."""
        gatherings = Gathering.objects.filter(organizer=request.user)
        serializer = self.get_serializer(gatherings, many=True)
        return Response(serializer.data)
```

---

## 6. URLs Router Setup (`urls.py`)

### `config/urls.py`
```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import GoogleAuthView, ProfileView, AvatarUploadView
from gatherings.views import GatheringViewSet
from tickets.views import BookingViewSet, BookmarkToggleView

router = DefaultRouter()
router.register(r'gatherings', GatheringViewSet, basename='gatherings')
router.register(r'bookings', BookingViewSet, basename='bookings')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth Endpoints
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/google/', GoogleAuthView.as_view(), name='google_auth'),
    path('api/auth/profile/', ProfileView.as_view(), name='user_profile'),
    path('api/auth/avatar/upload/', AvatarUploadView.as_view(), name='avatar_upload'),
    
    # Bookmarks
    path('api/bookmarks/toggle/<str:gathering_id>/', BookmarkToggleView.as_view(), name='bookmark_toggle'),

    # Gathering & Booking Resources
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## 7. Connecting Frontend to the Django Backend

Create or update `.env` in the React frontend:
```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

### Example Frontend API Client (`src/services/api.ts`)
```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('magivents_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function uploadAvatarFile(file: File): Promise<string> {
  const token = localStorage.getItem('magivents_access_token');
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/auth/avatar/upload/`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  if (!res.ok) throw new Error('Failed to upload avatar to Django backend.');
  const data = await res.json();
  return data.avatarUrl;
}
```
