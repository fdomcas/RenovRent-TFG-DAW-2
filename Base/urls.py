from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet)
router.register(r'inmuebles', views.InmuebleViewSet)
router.register(r'propuestas', views.PropuestaViewSet, basename='propuestas')
router.register(r'inversiones', views.InversionesViewSet, basename='inversiones')
router.register(r'mensajes', views.MesajeViewSet, basename='mensajes')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='refresh'),
]