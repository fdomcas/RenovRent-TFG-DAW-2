from luhncheck import is_luhn
from rest_framework import serializers
from .models import Usuario,Tarjeta,Propuestas,Inmuebles,Inversiones,Chat,Mensaje


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id','username','nombre','apellidos','Nikname','email','is_staff']


class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = ['username', 'nombre', 'apellidos', 'Nikname','email','fecha_nacimiento', 'dni', 'password']


    def create(self, validated_data):
        return Usuario.objects.create_user(**validated_data)


class inmuebleSerializer(serializers.ModelSerializer):
    class Meta:
        model= Inmuebles
        fields = '__all__'



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
        model= Tarjeta
        fields = ['id_usuario', 'numero_tarjeta', 'fecha_caducidad', 'nombre_titular']
        read_only_fields = ('estado','id_usuario')


    def validate_numero_tarjeta(self,value):
        if not is_luhn(value):
            raise serializers.ValidationError("Numero invalido")
        return value


    def validate_fecha_caducidad(self,value):
        from datetime import date
        try:
            mes, anio = value.split('-')
            fecha = date(int(anio),int(mes),1)
            if fecha < date.today().replace(day=1):
                raise serializers.ValidationError("Tarjeta caducada")
        except ValueError:
            raise serializers.ValidationError("Formato inválido, usa MM/YYYY")
        return value
