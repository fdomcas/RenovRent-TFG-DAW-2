from datetime import datetime, date
from symtable import Class

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django import forms
from django.core.exceptions import ValidationError
import requests
# Create your models here.

class Usuario(models.Model):
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=250)
    Nikname = models.CharField(max_length=250, unique=True)
    Email = models.EmailField(unique=True)
    fecha_nacimiento = models.DateField()
    dni = models.CharField(max_length=9, unique=True)

    def __str__(self):
        return self.nombre + " " + self.apellidos


    def clean_edad(self):
        fecha = self.cleaned_data.get('fecha_nacimiento')
        hoy = date.today()
        edad = hoy.year - fecha.year - ((hoy.month, hoy.day) < (hoy.month, hoy.day))
        if edad < 18:
            raise forms.ValidationError("Debes tener almenos 18 años para poder registrarte")
        return fecha


class Tarjeta(models.Model):
    id_usuario = models.ManyToManyField(Usuario)
    fecha_caducidad = models.DateField()
    Nombre_titular = models.CharField(max_length=100)
    Estado = models.BooleanField(default=True)


    def __str__(self):
        return self.Nombre_titular

    def clean_fecha_caducidad(self):
        fecha = self.cleaned_data.get('fecha_caducidad')
        hoy = date.today()
        if fecha < hoy:
            raise forms.ValidationError("La Tarjeta esta caducada")
        return fecha


class Dinero(models.Model):
    id_tarjeta = models.ForeignKey(Tarjeta)
    Dinero = models.IntegerField()

    def __str__(self):
        return self.Dinero

    def clean_Dinero(self):
        if self.Dinero < 0:
            raise forms.ValidationError("Dinero no valido")
        return self.Dinero



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

    def clean_url(self):
        url = self.cleaned_data.get('url')
        if url:
            validar_url_segura(url)
        return url