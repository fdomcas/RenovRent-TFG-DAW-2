import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import  Mensaje, Chat,Inmuebles,Usuario, Inversiones

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.inmueble_id = self.scope['url_route']['kwargs']['inmueble_id']
        self.room_group_name = 'chat_%s' % self.inmueble_id
        self.user = self.scope['user']

        tiene_inversion = await self.verificar_inversion()
        if not tiene_inversion:
            await self.close()
            return
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
            )

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        mensaje = data['mensaje']

        await self.guardar_mensaje(mensaje)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'mensaje': mensaje,
                'usuario':self.user.Nikname,
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'mensaje': event['mensaje'],
            'Usuario': event['usuario'],
        }))

    @database_sync_to_async
    def verificar_inversion(self):
        return Inversiones.objects.filter(
            id_usuario= self.user.id,
            id_inmueble= self.inmueble_id,
        ).exists()


    @database_sync_to_async
    def guardar_mensaje(self, mensaje):
        chat = Chat.objects.get(id_inmueble_id=self.inmueble_id)
        Mensaje.objects.create(
            id_usuario=self.user,
            id_chat=chat,
            mensaje=mensaje,
        )