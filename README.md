# RenovoRent — TFG 2DAW

> Plataforma web de inversión inmobiliaria con comunicación en tiempo real entre inversores.

***

## 📋 Descripción general

**RenovRent** es una aplicación web desarrollada como Trabajo de Fin de Grado del ciclo **2.º DAW (Desarrollo de Aplicaciones Web)**. La plataforma permite a los usuarios explorar inmuebles, realizar inversiones, gestionar su cartera y comunicarse con otros inversores mediante un sistema de chat en tiempo real.

El proyecto está dividido en dos partes bien diferenciadas:

- **Backend**: API REST construida con Django y Django REST Framework
- **Frontend**: Interfaz de usuario construida con React + Vite

***

## 🚀 Funcionalidades principales

-  **Catálogo de propiedades** — listado de inmuebles con filtros por ubicación, tipo y precio
-  **Gestión de inversiones** — realizar, consultar y seguir el retorno de inversiones
-   **Perfil de usuario** — edición de datos personales, IBAN, foto y preferencias de notificación
-   **Autenticación segura** — login con JWT y verificación en dos pasos (2FA) mediante Google Authenticator
-  **Gestión de tarjetas** — añadir y eliminar métodos de pago
-  **Chat en tiempo real** — mensajería entre inversores usando WebSockets
-  **Recomendaciones** — los usuarios pueden proponer nuevas propiedades para su revisión
-  **Panel de administración** — gestión de propuestas y usuarios desde el rol admin

***

## 🛠️ Tecnologías utilizadas

### Backend

| Tecnología | Uso |
|---|---|
| **Django** | Framework principal del backend |
| **Django REST Framework** | Construcción de la API REST |
| **Django Channels** | WebSockets para el chat en tiempo real |
| **channels-redis** | Capa de canal para Django Channels |
| **django-cors-headers** | Configuración de CORS para el frontend |
| **PyOTP** | Generación y verificación de códigos TOTP (2FA) |
| **qrcode[pil]** | Generación de códigos QR para la configuración del 2FA |
| **Pillow** | Procesamiento de imágenes (fotos de perfil e inmuebles) |
| **SimpleJWT** | Autenticación basada en tokens JWT |

### Frontend

| Tecnología | Uso |
|---|---|
| **React** | Biblioteca principal de UI |
| **Vite** | Bundler y servidor de desarrollo |
| **React Router DOM** | Navegación entre páginas |
| **Zustand** | Gestión del estado global (auth) |
| **Axios** | Cliente HTTP para comunicación con la API |

***

## 📁 Estructura del proyecto

```
renovorent/
├── backend/
│   ├── renovorent/                  # Apps de Django (usuarios, inmuebles, inversiones...)
│   ├── base/
│   │    └── config.py           # Configuración principal (settings, urls, asgi)
│   └── manage.py
└── frontend/
    ├── src/
    │   ├── api/              # Configuración de Axios
    │   ├── componentes/      # Componentes reutilizables (Navbar, Chat, 2FA...)
    │   ├── pages/            # Páginas (Inicio, Propiedades, Perfil, Inversiones...)
    │   ├── store/            # Estado global con Zustand
    │   └── theme.js          # Sistema de diseño centralizado
    └── vite.config.js
```

***

## ⚙️ Instalación y puesta en marcha

### Requisitos previos

- Python 3.11+
- Node.js 18+
- Redis (para Django Channels)

### Backend

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/renovrent.git
cd renovrent/backend

# Crear entorno virtual e instalar dependencias
python -m venv venv
source venv/bin/activate       # En Windows: venv\Scripts\activate
pip install -r requirements.txt

# Aplicar migraciones y arrancar
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd renovrent/frontend
npm install
npm run dev
```

### Redis (necesario para el chat)

```bash
# Con Docker
docker run -p 6379:6379 redis

# O instalar Redis directamente en el sistema
```

***

## 🔐 Variables de entorno

Crear un archivo `.env` en la carpeta `backend/` con las siguientes variables:

```env
SECRET_KEY=tu_clave_secreta_de_django
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
REDIS_URL=redis://localhost:6379
```

***
