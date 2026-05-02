# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Usuario, Perfil, Tarjeta, Dinero, Inmuebles


@receiver(post_save, sender=Usuario)
def crear_perfil(sender, instance, created, **kwargs):
    if created:
        Perfil.objects.create(id_usuario=instance)


@receiver(post_save, sender=Tarjeta)
def crear_dinero(sender, instance, created, **kwargs):
    if created:
        Dinero.objects.create(id_tarjeta=instance, Dinero=0)




