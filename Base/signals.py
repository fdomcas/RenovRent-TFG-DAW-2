# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Usuario, Perfil

@receiver(post_save, sender=Usuario)
def crear_perfil(sender, instance, created, **kwargs):
    if created:  # solo cuando es un usuario nuevo
        Perfil.objects.create(id_usuario=instance)