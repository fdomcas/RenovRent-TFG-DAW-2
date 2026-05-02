import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Mensaje, Chat, Inmuebles, Usuario, Inversiones

class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.inmueble_id = self.scope['url_route']['kwargs']['inmueble_id']
        self.room_group_name = 'chat_%s' % self.inmueble_id
        self.user = self.scope['user']

        tiene_inversion = await self.verificar_inversion()
        if not tiene_inversion:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Enviar historial al conectarse
        historial = await self.get_historial()
        await self.send(text_data=json.dumps({
            'type': 'historial',
            'mensajes': historial
        }))

        # Enviar lista de participantes a todos
        participantes = await self.get_participantes()
        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'participantes_update',
            'participantes': participantes
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        tipo = data.get('type')

        # Banear usuario (solo admin/staff)
        if tipo == 'ban' and (self.user.is_staff or self.user.is_superuser):
            usuario_id = data.get('usuario_id')
            await self.banear_usuario(usuario_id)
            participantes = await self.get_participantes()
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'participantes_update',
                'participantes': participantes
            })
            return

        # Enviar mensaje
        if tipo == 'mensaje':
            texto = data.get('texto', '').strip()
            if not texto:
                return
            await self.guardar_mensaje(texto)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'mensaje': {
                        'texto': texto,
                        'usuario': self.user.Nikname,
                        'fecha': await self.get_fecha_ahora(),
                    }
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'mensaje',
            'mensaje': event['mensaje']
        }))

    async def participantes_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'participantes',
            'participantes': event['participantes']
        }))

    # ── Helpers sync ─────────────────────────────────────────────

    @database_sync_to_async
    def verificar_inversion(self):
        if self.user.is_staff or self.user.is_superuser:
            return True
        return Inversiones.objects.filter(
            id_usuario=self.user.id,
            id_inmueble=self.inmueble_id,
        ).exists()

    @database_sync_to_async
    def guardar_mensaje(self, texto):
        chat = Chat.objects.get(id_inmueble_id=self.inmueble_id)
        Mensaje.objects.create(
            id_usuario=self.user,
            id_chat=chat,
            mensaje=texto,
        )

    @database_sync_to_async
    def get_historial(self):
        chat = Chat.objects.get(id_inmueble_id=self.inmueble_id)
        mensajes = Mensaje.objects.filter(id_chat=chat).order_by('fecha')[:100]
        return [
            {
                'texto': m.mensaje,
                'usuario': m.id_usuario.Nikname,
                'fecha': m.fecha.strftime('%H:%M'),
            }
            for m in mensajes
        ]

    @database_sync_to_async
    def get_participantes(self):
        inversiones = Inversiones.objects.filter(
            id_inmueble=self.inmueble_id
        ).select_related('id_usuario')
        return [
            {
                'id': inv.id_usuario.id,
                'nick': inv.id_usuario.Nikname,
                'baneado': False,  # ajusta si tienes campo de ban
            }
            for inv in inversiones
        ]

    @database_sync_to_async
    def banear_usuario(self, usuario_id):
        # Implementa según tu modelo de ban
        pass

    @database_sync_to_async
    def get_fecha_ahora(self):
        from django.utils import timezone
        return timezone.now().strftime('%H:%M')