from luhncheck import is_luhn
from rest_framework import serializers
from datetime import date
from .models import Usuario, Tarjeta, Propuestas, Inmuebles, Inversiones, Chat, Mensaje, Perfil


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id','username','nombre','apellidos','Nikname','email','is_staff']


class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = ['username', 'nombre', 'apellidos', 'Nikname','email','fecha_nacimiento', 'dni', 'password']


    def create(self, validated_data):         # ← único cambio
        password = validated_data.pop('password')
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def validate_fecha_nacimiento(self, value):
        hoy = date.today()
        edad = hoy.year - value.year - ((hoy.month, hoy.day) < (value.month, value.day))
        if edad < 18:
            raise serializers.ValidationError("Debes ser mayor de 18 años para registrarte.")
        return value


class inmuebleSerializer(serializers.ModelSerializer):
    disponible_para_invertir = serializers.SerializerMethodField()
    maximo_invertible = serializers.SerializerMethodField()

    class Meta:
        model = Inmuebles
        fields = '__all__'

    def get_disponible_para_invertir(self, obj):
        return float(obj.disponible_para_invertir)

    def get_maximo_invertible(self, obj):
        return float(obj.maximo_invertible)



class InversionesSerializer(serializers.ModelSerializer):
    class Meta:
        model= Inversiones
        fields = '__all__'
        read_only_fields = ('id_usuario', 'retorno_mensual', 'retorno_anual')



class MensajeSerializer(serializers.ModelSerializer):
    usuario_nikame = serializers.CharField(source='usuario.Nikname', read_only=True)

    class Meta:
        model= Mensaje
        fields = '__all__'
        read_only_fields = ('id_usuario', 'fecha')

class PropuestasSerializer(serializers.ModelSerializer):
    class Meta:
        model= Propuestas
        fields = '__all__'
        read_only_fields = ('estado', 'id_usuario')



class TarjetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tarjeta
        fields = ['id', 'numero_tarjeta', 'fecha_caducidad', 'nombre_titular', 'estado']
        read_only_fields = ['estado']

    def validate_numero_tarjeta(self, value):
        limpio = value.replace(' ', '').replace('-', '')
        if not is_luhn(limpio):
            raise serializers.ValidationError("Número inválido")
        return limpio
    def validate_fecha_caducidad(self, value):
        from datetime import date
        try:
            separador = '/' if '/' in value else '-'
            mes, anio = value.split(separador)
            fecha = date(int(anio), int(mes), 1)
            if fecha < date.today().replace(day=1):
                raise serializers.ValidationError("Tarjeta caducada")
        except (ValueError, AttributeError):
            raise serializers.ValidationError("Formato inválido, usa MM/YYYY")
        return value


class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = ['foto', 'telefono', 'direccion', 'iban', 'notif_email', 'notif_telefono', 'verificado']

class PerfilCompletoSerializer(serializers.ModelSerializer):
    perfil = PerfilSerializer()
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'nombre', 'apellidos', 'Nikname', 'email', 'fecha_nacimiento', 'dni', 'perfil']