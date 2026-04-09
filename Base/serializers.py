from rest_framework import serializers
from .models import Usuario,Tarjeta,Propuestas,Inmuebles,Caracteristicas_Inmuebles,Inversiones,Chat,Mensaje


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id','username','nombre','apellidos','Nikname','email']


class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = ['username', 'nombre', 'apellidos', 'Nikname','email','fecha_nacimiento', 'dni', 'password']


    def create(self, validated_data):
        return Usuario.objects.create_user(**validated_data)



class CaracteristicasSerializer(serializers.ModelSerializer):
    class Meta:
        model= Caracteristicas_Inmuebles
        fields = '__all__'

class inmuebleSerializer(serializers.ModelSerializer):
    caracteristicas= CaracteristicasSerializer(
        source='caracteristicas_Inmuebles',
        many=True,
        read_only=True
    )
    class Meta:
        model= Inmuebles
        fields = '__all__'



class InversionesSerializer(serializers.ModelSerializer):
    class Meta:
        model= Inversiones
        fields = '__all__'
        read_only_fields = ('id_usuario',)



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
