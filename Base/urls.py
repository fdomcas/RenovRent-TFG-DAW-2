from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'usuarios',    views.UsuarioViewSet)
router.register(r'inmuebles',   views.InmuebleViewSet)
router.register(r'propuestas',  views.PropuestaViewSet,   basename='propuestas')
router.register(r'inversiones', views.InversionesViewSet, basename='inversiones')
router.register(r'mensajes',    views.MesajeViewSet,      basename='mensajes')
router.register(r'tarjetas',    views.TarjetaViewSet,     basename='tarjetas')

urlpatterns = [
    path('api/inmuebles/tipos/',                  views.tipos_inmueble),
    path('api/admin/propuestas/todas/',           views.todas_propuestas),
    path('api/admin/propuestas/<int:pk>/estado/', views.cambiar_estado),
    path('api/auth/login/',     views.login),
    path('api/auth/login/2fa/', views.login_2fa),
    path('api/auth/refresh/',   TokenRefreshView.as_view()),

    # 2FA
    path('api/2fa/activar/',    views.activar_2fa),
    path('api/2fa/confirmar/',  views.confirmar_2fa),
    path('api/2fa/desactivar/', views.desactivar_2fa),

    path('api/perfil/',          views.mi_perfil),
    path('api/perfil/password/', views.cambiar_password),
    # Router al final
    path('api/', include(router.urls)),
]