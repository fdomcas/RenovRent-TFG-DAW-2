from rest_framework import viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core import signing
from django.core.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
from .models import *
from .serializers import *
import pyotp, qrcode, io, base64
import uuid


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return RegistroSerializer
        return UsuarioSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        inmueble = serializer.validated_data.get('id_inmueble')
        cantidad = serializer.validated_data.get('cantidad')

        if cantidad > inmueble.disponible_para_invertir:
            raise ValidationError(
                f"Solo quedan {inmueble.disponible_para_invertir}€ disponibles."
            )

        retorno_anual = round(cantidad * inmueble.retorno_anual_porcentaje / 100, 2)
        retorno_mensual = round(retorno_anual / 12, 2)

        inversion = serializer.save(
            id_usuario=request.user,
            retorno_anual=retorno_anual,
            retorno_mensual=retorno_mensual,
        )

        return Response({
            **serializer.data,
            'numero_transaccion': f'INV-{inversion.id:06d}'
        }, status=201)


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
        tiene_inversion = Inversiones.objects.filter(
            id_usuario=self.request.user,
            id_inmueble=chat.id_inmueble
        ).exists()
        if not tiene_inversion:
            raise PermissionDenied('Debes invertir para hablar en este inmueble')
        serializer.save(id_usuario=self.request.user)


class TarjetaViewSet(viewsets.ModelViewSet):
    serializer_class = TarjetaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Tarjeta.objects.filter(id_usuario=self.request.user)

    def perform_create(self, serializer):
        tarjeta = serializer.save()
        tarjeta.id_usuario.add(self.request.user)




@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({'error': 'Credenciales incorrectas'}, status=401)

    perfil, _ = Perfil.objects.get_or_create(id_usuario=user)

    if not perfil.otp_activo:
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'two_factor_required': False,
        })

    temp_token = signing.dumps({'user_id': user.id}, salt='2fa-login')
    return Response({
        'two_factor_required': True,
        'temp_token': temp_token,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def login_2fa(request):
    temp_token = request.data.get('temp_token')
    codigo = request.data.get('codigo')

    try:
        data = signing.loads(temp_token, salt='2fa-login', max_age=300)
    except signing.SignatureExpired:
        return Response({'error': 'Código caducado, vuelve a iniciar sesión'}, status=400)
    except signing.BadSignature:
        return Response({'error': 'Token inválido'}, status=400)

    try:
        user = Usuario.objects.get(id=data['user_id'])
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=400)

    perfil = Perfil.objects.get(id_usuario=user)
    totp = pyotp.TOTP(perfil.otp_secret)

    if not totp.verify(codigo):
        return Response({'error': 'Código 2FA incorrecto'}, status=400)

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'two_factor_required': False,
    })




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activar_2fa(request):
    perfil, _ = Perfil.objects.get_or_create(id_usuario=request.user)

    if not perfil.otp_secret:
        perfil.otp_secret = pyotp.random_base32()
        perfil.save()

    totp = pyotp.TOTP(perfil.otp_secret)
    uri = totp.provisioning_uri(
        name=request.user.email,
        issuer_name='RenovRent'
    )

    img = qrcode.make(uri)
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()

    return Response({
        'qr': f'data:image/png;base64,{qr_base64}',
        'secret': perfil.otp_secret,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirmar_2fa(request):
    perfil, _ = Perfil.objects.get_or_create(id_usuario=request.user)
    codigo = request.data.get('codigo')

    if not perfil.otp_secret:
        return Response({'error': 'Primero genera el QR'}, status=400)

    totp = pyotp.TOTP(perfil.otp_secret)
    if not totp.verify(codigo):
        return Response({'error': 'Código incorrecto'}, status=400)

    perfil.otp_activo = True
    perfil.save()
    return Response({'ok': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def desactivar_2fa(request):
    perfil, _ = Perfil.objects.get_or_create(id_usuario=request.user)
    perfil.otp_activo = False
    perfil.otp_secret = None
    perfil.save()
    return Response({'ok': True})




@api_view(['GET'])
@permission_classes([AllowAny])
def tipos_inmueble(request):
    tipos = [{'value': k, 'label': v} for k, v in Inmuebles.TIPOS_CHOICES]
    return Response(tipos)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def todas_propuestas(request):
    propuestas = Propuestas.objects.all().order_by('-id')
    serializer = PropuestasSerializer(propuestas, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def cambiar_estado(request, pk):
    propuesta = get_object_or_404(Propuestas, pk=pk)
    estado = request.data.get('estado')
    if estado not in ['Aceptada', 'Revision', 'Denegada']:
        return Response({'error': 'Estado inválido'}, status=400)
    propuesta.estado = estado
    propuesta.save()
    return Response({'estado': propuesta.estado})


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def mi_perfil(request):
    usuario = request.user
    perfil, _ = Perfil.objects.get_or_create(id_usuario=usuario)

    if request.method == 'GET':
        data = {
            'id': usuario.id,
            'username': usuario.username,
            'nombre': usuario.nombre,
            'apellidos': usuario.apellidos,
            'Nikname': usuario.Nikname,
            'email': usuario.email,
            'fecha_nacimiento': usuario.fecha_nacimiento,
            'dni': usuario.dni,
            'foto': request.build_absolute_uri(perfil.foto.url) if perfil.foto else None,
            'telefono': perfil.telefono,
            'direccion': perfil.direccion,
            'iban': perfil.iban,
            'notif_email': perfil.notif_email,
            'notif_telefono': perfil.notif_telefono,
            'verificado': perfil.verificado,
            'otp_activo': perfil.otp_activo,
        }
        return Response(data)

    if request.method == 'PATCH':
        campos_usuario = ['nombre', 'apellidos', 'email', 'Nikname']
        for campo in campos_usuario:
            if campo in request.data:
                setattr(usuario, campo, request.data[campo])
        usuario.save()

        campos_perfil = ['telefono', 'direccion', 'iban']
        for campo in campos_perfil:
            if campo in request.data:
                setattr(perfil, campo, request.data[campo])

        if 'notif_email' in request.data:
            perfil.notif_email = request.data['notif_email'] in [True, 'true', '1', 'True']
        if 'notif_telefono' in request.data:
            perfil.notif_telefono = request.data['notif_telefono'] in [True, 'true', '1', 'True']

        if 'foto' in request.FILES:
            perfil.foto = request.FILES['foto']

        perfil.save()
        return Response({'ok': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cambiar_password(request):
    usuario = request.user
    actual = request.data.get('actual')
    nueva = request.data.get('nueva')
    if not usuario.check_password(actual):
        return Response({'error': 'Contraseña actual incorrecta'}, status=400)
    if len(nueva) < 6:
        return Response({'error': 'La nueva contraseña debe tener al menos 6 caracteres'}, status=400)
    usuario.set_password(nueva)
    usuario.save()
    return Response({'ok': True})