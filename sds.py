import asyncio
import websockets
import json


async def test():
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc1NzA2Mjk1LCJpYXQiOjE3NzU2Nzc0OTUsImp0aSI6IjE4ODczN2ZhMGI0MDQwODZiZDFmOTAzOTdkMDExMjJkIiwidXNlcl9pZCI6IjEifQ.n7V88zmwWIgqQ75A-l_UgONvBSFFcjcoXtp0s7Jmwyk"

    uri = f"ws://127.0.0.1:8000/ws/chat/4/?token={token}"

    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({"mensaje": "hola desde el test"}))
        respuesta = await ws.recv()
        print("Recibido:", respuesta)


asyncio.run(test())
