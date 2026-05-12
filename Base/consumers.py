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

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        historial = await self.get_historial()
        await self.send(text_data=json.dumps({
            'type': 'historial',
            'mensajes': historial
        }))

        participantes = await self.get_participantes()
        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'participantes_update',
            'participantes': participantes
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        tipo = data.get('type')

        if tipo == 'ban' and (self.user.is_staff or self.user.is_superuser):
            usuario_id = data.get('usuario_id')
            await self.banear_usuario(usuario_id)
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'usuario_baneado',
                'usuario_id': usuario_id
            })

            participantes = await self.get_participantes()
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'participantes_update',
                'participantes': participantes
            })
            return
        if tipo == 'unban' and (self.user.is_staff or self.user.is_superuser):
            usuario_id = data.get('usuario_id')
            await self.desbanear_usuario(usuario_id)

            # Avisamos a la sala para actualizar participantes tras desbanear
            participantes = await self.get_participantes()
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'participantes_update',
                'participantes': participantes
            })
            return

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

    async def usuario_baneado(self, event):
        await self.send(text_data=json.dumps({
            'type': 'baneado',
            'usuario_id': event['usuario_id']
        }))



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
        from django.utils import timezone
        chat = Chat.objects.get(id_inmueble_id=self.inmueble_id)
        Mensaje.objects.create(
            id_usuario=self.user,
            id_chat=chat,
            mensaje=texto,
            fecha=timezone.now()
        )

    @database_sync_to_async
    def get_historial(self):
        from django.utils import timezone
        import datetime
        chat = Chat.objects.get(id_inmueble_id=self.inmueble_id)
        mensajes = Mensaje.objects.filter(id_chat=chat).order_by('fecha')[:100]

        resultado = []
        for m in mensajes:
            hora_str = "00:00"
            if m.fecha:
                # Comprobamos si el objeto es datetime (tiene hora) o solo date (no tiene hora)
                if isinstance(m.fecha, datetime.datetime):
                    hora_str = timezone.localtime(m.fecha).strftime('%H:%M')
                else:
                    # Si es solo un 'date', no podemos extraer horas/minutos
                    hora_str = "00:00"

            resultado.append({
                'texto': m.mensaje,
                'usuario': m.id_usuario.Nikname,
                'fecha': hora_str,
            })

        return resultado

    @database_sync_to_async
    def get_participantes(self):
        usuarios_ids = (
            Inversiones.objects
            .filter(id_inmueble=self.inmueble_id)
            .values_list('id_usuario', flat=True)
            .distinct()
        )
        from django.contrib.auth import get_user_model
        User = get_user_model()
        usuarios = User.objects.filter(id__in=usuarios_ids)
        return [
            {
                'id': u.id,
                'nick': u.Nikname,
                'baneado': not u.is_active,
            }
            for u in usuarios
        ]

    @database_sync_to_async
    def banear_usuario(self, usuario_id):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.filter(id=usuario_id).update(is_active=False)

    @database_sync_to_async
    def desbanear_usuario(self, usuario_id):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.filter(id=usuario_id).update(is_active=True)

    @database_sync_to_async
    def get_fecha_ahora(self):
        from django.utils import timezone
        return timezone.localtime(timezone.now()).strftime('%H:%M')