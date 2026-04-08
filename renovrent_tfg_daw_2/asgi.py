# asgi.py
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'renovrent_tfg_daw_2.settings')

from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from Base.middleware import JwtAuthMiddleware
import Base.routing

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': JwtAuthMiddleware(
        URLRouter(
            Base.routing.websocket_urlpatterns
        )
    )
})