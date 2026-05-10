# Base/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Tarjeta, Dinero, Propuestas, Inmuebles, Inversiones, Chat, Mensaje

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ['username', 'nombre', 'apellidos', 'email', 'dni']
    fieldsets = UserAdmin.fieldsets + (
        ('Datos extra', {'fields': ('nombre', 'apellidos', 'Nikname', 'fecha_nacimiento', 'dni')}),
    )


@admin.register(Inmuebles)
class InmueblesAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo', 'ubicacion', 'precio', 'retorno_anual_porcentaje']
    list_filter = ['tipo']
    search_fields = ['nombre', 'ubicacion']


@admin.register(Inversiones)
class InversionesAdmin(admin.ModelAdmin):
    list_display = ['id_usuario', 'id_inmueble', 'cantidad', 'retorno_anual', 'retorno_mensual']
    list_filter = ['id_inmueble']


@admin.register(Propuestas)
class PropuestasAdmin(admin.ModelAdmin):
    list_display = ['id_usuario', 'ubicacion', 'estado']
    list_filter = ['estado']
    list_editable = ['estado']  # cambia el estado directamente desde la lista


@admin.register(Tarjeta)
class TarjetaAdmin(admin.ModelAdmin):
    list_display = ['nombre_titular', 'fecha_caducidad', 'estado']

@admin.register(Dinero)
class DineroAdmin(admin.ModelAdmin):
    list_display = ['id_tarjeta', 'Dinero']


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ['id_inmueble']

@admin.register(Mensaje)
class MensajeAdmin(admin.ModelAdmin):
    list_display = ['id_usuario', 'id_chat', 'fecha']