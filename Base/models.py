from datetime import datetime, date
from django.db import models
from django.core.exceptions import ValidationError
import requests
from django.contrib.auth.models import AbstractUser
# Create your models here.

class Usuario(AbstractUser):
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=250)
    Nikname = models.CharField(max_length=250, unique=True)
    fecha_nacimiento = models.DateField()
    dni = models.CharField(max_length=9, unique=True)



    REQUIRED_FIELDS = ['nombre', 'apellidos', 'Nikname', 'email', 'fecha_nacimiento', 'dni']

    def __str__(self):
        return self.nombre + " " + self.apellidos


    def clean(self):
        hoy = date.today()
        edad = hoy.year - self.fecha_nacimiento.year - ((hoy.month, hoy.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day))
        if edad < 18:
            raise ValidationError("Debes tener almenos 18 años para poder registrarte")



class Perfil(models.Model):
    id_usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE)

class Tarjeta(models.Model):
    id_usuario = models.ManyToManyField(Usuario)
    fecha_caducidad = models.DateField()
    Nombre_titular = models.CharField(max_length=100)
    Estado = models.BooleanField(default=True)


    def __str__(self):
        return self.Nombre_titular

    def clean(self):
        fecha = self.fecha_caducidad
        hoy = date.today()
        if fecha < hoy:
            raise ValidationError("La Tarjeta esta caducada")



class Dinero(models.Model):
    id_tarjeta = models.ForeignKey(Tarjeta, on_delete=models.CASCADE)
    Dinero = models.IntegerField()

    def __str__(self):
        return str(self.Dinero)

    def clean(self):
        if self.Dinero < 0:
            raise ValidationError("Dinero no valido")




def validar_url_segura(url):
    try:
        response = requests.post(
            'https://urlhaus-api.abuse.ch/v1/url/',
            data={'url': url},
            timeout=5
        )
        resultado = response.json()
        if resultado.get('query_status') == 'is_listed':
            raise ValidationError("Url segura con la lista de url")

    except requests.exceptions.RequestException as e:
        pass


class Propuestas(models.Model):
    disponible= [
        ('Denegada','Denegada'),
        ('Revision','Revision'),
        ('Aceptada','Aceptada'),
    ]

    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    motivo = models.TextField()
    url = models.URLField()
    estado = models.CharField(max_length=100, choices=disponible, default='Revision')
    ubicacion = models.TextField()
    fotos = models.FileField(upload_to='fotos/')


    def __str__(self):
        return self.url

    def clean(self):
        url = self.url
        if url:
            validar_url_segura(url)


class Inmuebles(models.Model):
    TIPOS_CHOICES = [
        # Residencial
        ('Casa', 'Casa'),
        ('Apartamento', 'Apartamento'),
        ('Piso', 'Piso'),
        ('Chalet', 'Chalet'),
        ('Bungalow', 'Bungalow'),
        ('Mansión', 'Mansión'),
        ('Dúplex', 'Dúplex'),
        ('Ático', 'Ático'),
        ('Adosado', 'Adosado'),
        # Comercial / Industrial
        ('Local', 'Local Comercial'),
        ('Oficina', 'Oficina'),
        ('Nave', 'Nave Industrial'),
        # Otros
        ('Garaje', 'Garaje'),
        ('Terreno', 'Terreno / Solar'),
    ]

    nombre = models.CharField(max_length=100)
    ubicacion = models.TextField()
    fotos = models.FileField(upload_to='fotos/')
    tipo= models.CharField(max_length=100,)
    precio= models.IntegerField(default=0)

class Caracteristicas_Inmuebles(models.Model):
    id_inmueble = models.ForeignKey(Inmuebles, on_delete=models.CASCADE)
    num_habitaciones = models.IntegerField()
    num_wc= models.IntegerField()
    m2 = models.IntegerField()
    espacios = models.TextField()
    extras = models.TextField()

    def __str__(self):
        return str(self.num_habitaciones)


class Inversiones(models.Model):
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    id_inmueble = models.ForeignKey(Inmuebles, on_delete=models.CASCADE)
    cantidad = models.IntegerField()
    retorno_mensual = models.IntegerField()
    retorno_anual = models.IntegerField()


class Chat(models.Model):
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    id_inmueble = models.ForeignKey(Inmuebles, on_delete=models.CASCADE)


class Mensaje(models.Model):
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    id_chat = models.ForeignKey(Chat, on_delete=models.CASCADE)
    mensaje = models.TextField()
    fecha = models.DateField(default=date.today)


    def __str__(self):
        return self.mensaje


