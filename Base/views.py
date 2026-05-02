from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from django.core.exceptions import PermissionDenied, ValidationError
from .models import *
from .serializers import *
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Inmuebles

# Create your views here.





class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    def  get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return RegistroSerializer
        return UsuarioSerializer
    @action(detail=False, methods=['get'])
    def me(self,request):
        return Response(UsuarioSerializer(request.user).data)

class InmuebleViewSet(viewsets.ModelViewSet):
    queryset = Inmuebles.objects.all()
    serializer_class = inmuebleSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'create', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class PropuestaViewSet(viewsets.ModelViewSet):
    serializer_class = PropuestasSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Propuestas.objects.filter(id_usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(id_usuario=self.request.user)


class InversionesViewSet(viewsets.ModelViewSet):
    serializer_class = InversionesSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Inversiones.objects.filter(id_usuario=self.request.user)

    def perform_create(self, serializer):
        inmueble = serializer.validated_data.get('id_inmueble')
        cantidad = serializer.validated_data.get('cantidad')

        if cantidad > inmueble.disponible_para_invertir:
            raise ValidationError(
                f"Solo quedan {inmueble.disponible_para_invertir}€ disponibles para invertir."
            )

        retorno_anual = cantidad * inmueble.retorno_anual_porcentaje / 100
        retorno_mensual = retorno_anual / 12

        serializer.save(
            id_usuario=self.request.user,
            retorno_anual=round(retorno_anual, 2),
            retorno_mensual=round(retorno_mensual, 2),
        )





class MesajeViewSet(viewsets.ModelViewSet):
    serializer_class = MensajeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        chat_id = self.request.query_params.get('id_chat')
        if chat_id:
            return Mensaje.objects.filter(id_chat=chat_id)
        return Mensaje.objects.none()


    def perform_create(self, serializer):
        chat = serializer.validated_data.get('id_chat')
        tiene_inversion= Inversiones.objects.filter(
            id_usuario = self.request.user,
            id_inmueble = chat.id_inmueble
        ).exists()
        if not tiene_inversion:
            raise PermissionDenied('Debes invertir par hablar en este inmueble')
        serializer.save(id_usuario=self.request.user)


class TarjetaViewSet(viewsets.ModelViewSet):
    serializer_class = TarjetaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Tarjeta.objects.filter(id_usuario=self.request.user)

    def perform_create(self, serializer):
        tarjeta = serializer.save()
        tarjeta.id_usuario.add(self.request.user)



@api_view(['GET'])
@permission_classes([AllowAny])
def tipos_inmueble(request):
    tipos = [{'value': k, 'label': v} for k, v in Inmuebles.TIPOS_CHOICES]
    return Response(tipos)