from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import PermissionDenied
from .models import *
from .serializers import *
# Create your views here.





class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()

    def  get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return RegistroSerializer
        return RegistroSerializer

    @action(detail=True, methods=['get'])
    def me(self,request):
        return Response(UsuarioSerializer(request.user).data)


class InmuebleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Inmuebles.objects.all()
    serializer_class = inmuebleSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProductoViewSet(viewsets.ModelViewSet):
    serializer_class = PropuestasSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Propuestas.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class InventarioViewSet(viewsets.ModelViewSet):
    serializer_class = InversionesSerializer
    Permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Inversiones.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class MesajeViewSet(viewsets.ModelViewSet):
    serializer_class = MensajeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        chat_id = self.request.query_params.get('chat_id')
        if chat_id:
            return Mensaje.objects.filter(chat_id=chat_id)
        return Mensaje.objects.none()


    def perform_create(self, serializer):
        chat = serializer.validated_data.get['id_chat']
        tiene_inversion= Inversiones.objects.filter(
            id_usuario = self.request.user,
            id_inmueble = chat.id_inmueble
        ).exists()
        if not tiene_inversion:
            raise PermissionDenied('Debes invertir par hablar en este inmueble')
        serializer.save(usuario=self.request.user)
