from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from datetime import date
from Base.models import Perfil, Inmuebles

Usuario = get_user_model()

class Command(BaseCommand):
    help = 'Crea un superusuario, 3 usuarios normales y 5 inmuebles de prueba'

    def handle(self, *args, **kwargs):
        self.crear_superusuario()
        self.crear_usuarios()
        self.crear_inmuebles()
        self.stdout.write(self.style.SUCCESS('✅ Seed completado con éxito'))

    # ─── Superusuario ────────────────────────────────────────────────────────────
    def crear_superusuario(self):
        if not Usuario.objects.filter(username='admin').exists():
            u = Usuario.objects.create_superuser(
                username='admin',
                email='admin@renovrent.com',
                password='admin1234',
                nombre='Admin',
                apellidos='Principal',
                Nikname='admin_reno',
                fecha_nacimiento=date(1990, 1, 1),
                dni='00000000A',
            )
            # USAR UPDATE_OR_CREATE PARA EVITAR CHOQUES CON SIGNALS
            Perfil.objects.update_or_create(id_usuario=u, defaults={'telefono': '600000000'})
            self.stdout.write(self.style.SUCCESS('  → Superusuario creado: admin / admin1234'))
        else:
            self.stdout.write('  → Superusuario ya existe, se omite')

    # ─── Usuarios normales ───────────────────────────────────────────────────────
    def crear_usuarios(self):
        usuarios = [
            {
                'username': 'usuario1',
                'email': 'usuario1@renovrent.com',
                'password': 'pass1234',
                'nombre': 'Carlos',
                'apellidos': 'García López',
                'Nikname': 'carlosg',
                'fecha_nacimiento': date(1995, 5, 15),
                'dni': '11111111A',
            },
            {
                'username': 'usuario2',
                'email': 'usuario2@renovrent.com',
                'password': 'pass1234',
                'nombre': 'Laura',
                'apellidos': 'Martínez Ruiz',
                'Nikname': 'lauramr',
                'fecha_nacimiento': date(1998, 8, 22),
                'dni': '22222222B',
            },
            {
                'username': 'usuario3',
                'email': 'usuario3@renovrent.com',
                'password': 'pass1234',
                'nombre': 'Pablo',
                'apellidos': 'Sánchez Torres',
                'Nikname': 'pablost',
                'fecha_nacimiento': date(1993, 3, 10),
                'dni': '33333333C',
            },
        ]

        for datos in usuarios:
            if not Usuario.objects.filter(username=datos['username']).exists():
                u = Usuario.objects.create_user(**datos)
                # USAR UPDATE_OR_CREATE PARA EVITAR CHOQUES CON SIGNALS
                Perfil.objects.update_or_create(id_usuario=u, defaults={'telefono': '60000000' + datos['dni'][0]})
                self.stdout.write(self.style.SUCCESS(f"  → Usuario creado: {datos['username']} / {datos['password']}"))
            else:
                self.stdout.write(f"  → {datos['username']} ya existe, se omite")

    # ─── Inmuebles ───────────────────────────────────────────────────────────────
    def crear_inmuebles(self):
        inmuebles = [
            {
                'nombre': 'Piso Centro Madrid',
                'ubicacion': 'Calle Gran Vía 10, Madrid',
                'tipo': 'Piso',
                'precio': 250000,
                'num_habitaciones': 3,
                'num_banos': 2,
                'metros_cuadrados': 90.00,
                'planta': 4,
                'garaje': False,
                'piscina': False,
                'ascensor': True,
                'terraza': False,
                'extras': 'Céntrico, luminoso, reformado',
            },
            {
                'nombre': 'Chalet con piscina Valencia',
                'ubicacion': 'Urbanización La Cañada, Valencia',
                'tipo': 'Chalet',
                'precio': 480000,
                'num_habitaciones': 5,
                'num_banos': 3,
                'metros_cuadrados': 280.00,
                'planta': 0,
                'garaje': True,
                'piscina': True,
                'ascensor': False,
                'terraza': True,
                'extras': 'Jardín privado, barbacoa, zona residencial tranquila',
            },
            {
                'nombre': 'Apartamento Playa Málaga',
                'ubicacion': 'Paseo Marítimo 45, Málaga',
                'tipo': 'Apartamento',
                'precio': 180000,
                'num_habitaciones': 2,
                'num_banos': 1,
                'metros_cuadrados': 60.00,
                'planta': 2,
                'garaje': False,
                'piscina': True,
                'ascensor': True,
                'terraza': True,
                'extras': 'Vistas al mar, a 50m de la playa',
            },
            {
                'nombre': 'Local Comercial Barcelona',
                'ubicacion': 'Calle Aragón 200, Barcelona',
                'tipo': 'Local',
                'precio': 320000,
                'num_habitaciones': None,
                'num_banos': 1,
                'metros_cuadrados': 150.00,
                'planta': 0,
                'garaje': False,
                'piscina': False,
                'ascensor': False,
                'terraza': False,
                'extras': 'Zona de alto tráfico peatonal, escaparate amplio',
            },
            {
                'nombre': 'Ático Lujo Sevilla',
                'ubicacion': 'Avenida de la Constitución 5, Sevilla',
                'tipo': 'Ático',
                'precio': 550000,
                'num_habitaciones': 4,
                'num_banos': 3,
                'metros_cuadrados': 200.00,
                'planta': 8,
                'garaje': True,
                'piscina': True,
                'ascensor': True,
                'terraza': True,
                'extras': 'Vistas panorámicas a la Giralda, domótica incluida',
            },
        ]

        for datos in inmuebles:
            if not Inmuebles.objects.filter(nombre=datos['nombre']).exists():
                Inmuebles.objects.create(**datos)
                self.stdout.write(self.style.SUCCESS(f"  → Inmueble creado: {datos['nombre']}"))
            else:
                self.stdout.write(f"  → {datos['nombre']} ya existe, se omite")