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
    foto = models.FileField(upload_to='fotos/perfil/', blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True)
    direccion = models.CharField(max_length=255, blank=True)
    iban = models.CharField(max_length=34, blank=True)
    notif_email = models.BooleanField(default=True)
    notif_telefono = models.BooleanField(default=False)
    verificado = models.BooleanField(default=False)
    otp_secret = models.CharField(max_length=32, blank=True, null=True)
    otp_activo = models.BooleanField(default=False)

class Tarjeta(models.Model):
    id_usuario = models.ManyToManyField(Usuario)
    numero_tarjeta = models.CharField(max_length=19)
    fecha_caducidad = models.CharField(max_length=7)
    nombre_titular = models.CharField(max_length=100)
    estado = models.BooleanField(default=True)


    def __str__(self):
        return self.nombre_titular

    def save(self, *args, **kwargs):
        from datetime import date
        try:
            mes, anio = self.fecha_caducidad.split('/')
            fecha = date(int(anio), int(mes), 1)
            self.estado = fecha >= date.today().replace(day=1)
        except:
            self.estado = False
        super().save(*args, **kwargs)



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

    RETORNO_POR_TIPO = {
        'Casa': 8.0,
        'Apartamento': 7.0,
        'Piso': 7.0,
        'Chalet': 9.0,
        'Bungalow': 6.5,
        'Mansion': 10.0,
        'Duplex': 7.5,
        'Atico': 8.5,
        'Adosado': 7.0,
        'Local': 10.0,
        'Oficina': 9.0,
        'Nave': 8.0,
        'Garaje': 5.0,
        'Terreno': 4.0,
    }

    nombre = models.CharField(max_length=100)
    ubicacion = models.TextField()
    fotos = models.FileField(upload_to='fotos/')
    tipo= models.CharField(max_length=100, choices=TIPOS_CHOICES, default='Piso')
    precio= models.IntegerField(default=0)
    retorno_anual_porcentaje = models.IntegerField(default=0)
    num_habitaciones = models.IntegerField(null=True, blank=True)
    num_banos = models.IntegerField(null=True, blank=True)
    metros_cuadrados = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    planta = models.IntegerField(null=True, blank=True)
    garaje = models.BooleanField(default=False)
    piscina = models.BooleanField(default=False)
    ascensor = models.BooleanField(default=False)
    terraza = models.BooleanField(default=False)
    extras = models.TextField(null=True, blank=True)


    def save(self, *args, **kwargs):

        self.retorno_anual_porcentaje = self.RETORNO_POR_TIPO.get(self.tipo, 5.0)
        super().save(*args, **kwargs)



    @property
    def maximo_invertible(self):
        return self.precio/2


    @property
    def total_invertible(self):
        from django.db.models import Sum
        resultado = self.inversiones_set.aggregate(Sum('cantidad'))['cantidad__sum']
        return  resultado or 0

    @property
    def disponible_para_invertir(self):
        return self.maximo_invertible - self.total_invertible


    def __str__(self):
        return self.nombre


class Inversiones(models.Model):
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    id_inmueble = models.ForeignKey(Inmuebles, on_delete=models.CASCADE)
    cantidad = models.IntegerField()
    retorno_mensual = models.IntegerField()
    retorno_anual = models.IntegerField()

class Chat(models.Model):
    id_inmueble = models.ForeignKey(Inmuebles, on_delete=models.CASCADE)


class Mensaje(models.Model):
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    id_chat = models.ForeignKey(Chat, on_delete=models.CASCADE)
    mensaje = models.TextField()
    fecha = models.DateField(default=date.today)


    def __str__(self):
        return self.mensaje
