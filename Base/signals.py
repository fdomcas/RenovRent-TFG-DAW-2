# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Usuario, Perfil, Tarjeta, Dinero, Inmuebles, Caracteristicas_Inmuebles


@receiver(post_save, sender=Usuario)
def crear_perfil(sender, instance, created, **kwargs):
    if created:
        Perfil.objects.create(id_usuario=instance)


@receiver(post_save, sender=Tarjeta)
def crear_dinero(sender, instance, created, **kwargs):
    if created:
        Dinero.objects.create(id_tarjeta=instance, Dinero=0)




@receiver(post_save, sender=Inmuebles)
def crear_caracteristicas(sender, instance, created, **kwargs):
    if created:
            Caracteristicas_Inmuebles.objects.get_or_create(id_inmuebles=instance)