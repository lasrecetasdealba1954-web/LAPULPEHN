# La Pulpería HN 🏪

Marketplace estilo pulpería hondureña - Tu tiendita de confianza en línea.

![La Pulpería](https://img.shields.io/badge/Made%20in-Honduras-blue)

## Descripción

La Pulpería es un marketplace que conecta tienditas locales (pulperías) con clientes en Honduras. Permite a los negocios vender productos, recibir órdenes y gestionar su inventario, mientras los clientes pueden explorar, ordenar y encontrar servicios cerca de ellos.

## Características

### Para Pulperías (Negocios)
- ✅ Registro y gestión de negocio
- ✅ Subir productos con imágenes (hasta 10MB)
- ✅ Recibir órdenes con notificaciones push
- ✅ Panel de gestión estilo videojuego
- ✅ Centro de Mando con estadísticas detalladas
- ✅ Exportar datos (CSV/JSON)
- ✅ Publicar ofertas de empleo
- ✅ Compartir en redes sociales
- ✅ Sistema de reviews

### Para Clientes
- ✅ Explorar pulperías cercanas con mapa
- ✅ Carrito de compras multi-pulpería
- ✅ Seguimiento de órdenes en tiempo real
- ✅ Notificaciones push de estado
- ✅ Buscar y aplicar a empleos
- ✅ Catálogo de servicios profesionales

### General
- ✅ Autenticación con Google
- ✅ Diseño espacial con animación de estrellas
- ✅ PWA instalable
- ✅ Responsive (móvil y desktop)

## Tecnologías

### Backend
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- Firebase Admin (autenticación)
- Cloudinary (imágenes)
- Web Push (notificaciones)

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS
- Zustand (estado)
- React Router v6
- Leaflet (mapas)
- Framer Motion (animaciones)

## Requisitos Previos

1. **Node.js 18+** - [Descargar](https://nodejs.org/)
2. **Cuenta de Firebase** - [Firebase Console](https://console.firebase.google.com/)
3. **Cuenta de Cloudinary** - [Cloudinary](https://cloudinary.com/)
4. **Cuenta de Render** - [Render](https://render.com/)

---

## Guía de Despliegue en Render

### Paso 1: Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o usa uno existente
3. Ve a **Authentication > Sign-in method**
4. Habilita **Google** como proveedor
5. Ve a **Project Settings > General**
6. Crea una aplicación web y copia las credenciales
7. Ve a **Project Settings > Service accounts**
8. Genera una nueva clave privada (descarga el JSON)

### Paso 2: Configurar Cloudinary

1. Ve a [Cloudinary Dashboard](https://cloudinary.com/console)
2. Crea una cuenta gratuita si no tienes
3. Copia tu **Cloud name**, **API Key** y **API Secret**

### Paso 3: Generar claves VAPID

En tu terminal, ejecuta:
```bash
npx web-push generate-vapid-keys
```
Guarda las claves pública y privada.

### Paso 4: Crear repositorio en GitHub

1. Crea un nuevo repositorio en GitHub
2. Sube el código:
```bash
git remote add origin https://github.com/TU-USUARIO/la-pulperia.git
git branch -M main
git push -u origin main
```

### Paso 5: Desplegar en Render

#### Opción A: Usando Blueprint (Recomendado)

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Click en **New > Blueprint**
3. Conecta tu repositorio de GitHub
4. Render detectará el archivo `render.yaml` automáticamente
5. Configura las variables de entorno (ver abajo)
6. Click en **Apply**

#### Opción B: Manual

1. **Crear base de datos PostgreSQL:**
   - New > PostgreSQL
   - Name: `la-pulperia-db`
   - Plan: Free
   - Copia la **Internal Database URL**

2. **Crear Web Service:**
   - New > Web Service
   - Conecta tu repositorio
   - Name: `la-pulperia`
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: Free

### Paso 6: Configurar Variables de Entorno

En Render, ve a tu Web Service > Environment y agrega:

```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://lapulperiahn.shop

# Base de datos (copia de tu PostgreSQL en Render)
DATABASE_URL=postgresql://user:password@host/database

# Firebase (del JSON descargado)
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@tu-proyecto.iam.gserviceaccount.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=tu-api-secret

# Web Push (de las claves generadas)
VAPID_PUBLIC_KEY=tu-clave-publica
VAPID_PRIVATE_KEY=tu-clave-privada
VAPID_EMAIL=mailto:tu-email@example.com

# JWT (genera una cadena aleatoria larga)
JWT_SECRET=tu-secreto-super-seguro-de-32-caracteres-minimo
```

**IMPORTANTE para FIREBASE_PRIVATE_KEY:**
- Copia la clave del JSON tal cual
- Incluye los `\n` literales (no saltos de línea reales)
- Debe estar entre comillas simples en Render

### Paso 7: Configurar Variables del Frontend

Crea el archivo `frontend/.env` (o configura en Render):

```
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Paso 8: Configurar Dominio Personalizado

1. En Render, ve a tu Web Service > Settings > Custom Domains
2. Agrega `lapulperiahn.shop`
3. Render te dará un registro CNAME
4. En tu registrador de dominio:
   - Tipo: CNAME
   - Host: `@` o vacío (para el dominio raíz)
   - Valor: `tu-servicio.onrender.com`
5. O configura el registro A apuntando a la IP de Render

**Para subdominios (ej: www):**
- CNAME: `www` → `tu-servicio.onrender.com`

### Paso 9: Ejecutar Migraciones

Después del primer deploy, ejecuta en Render Shell:
```bash
npm run db:migrate
```

O configura como parte del build command:
```
npm install && npm run db:migrate && npm run build
```

---

## Desarrollo Local

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/TU-USUARIO/la-pulperia.git
cd la-pulperia

# Instalar dependencias
npm install

# Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edita los archivos .env con tus credenciales

# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones (requiere PostgreSQL local o usar Render)
npm run db:migrate

# Iniciar desarrollo
npm run dev
```

### Scripts Disponibles

```bash
npm run dev          # Inicia backend y frontend
npm run build        # Construye para producción
npm start            # Inicia el servidor de producción
npm run db:migrate   # Ejecuta migraciones
npm run db:studio    # Abre Prisma Studio
```

---

## Opciones de Notificaciones

### Web Push (Implementado)
- Funciona en navegadores modernos
- Requiere HTTPS
- Vibración en móvil + sonido
- Configuración: claves VAPID

### Alternativas para notificaciones más avanzadas:
1. **Firebase Cloud Messaging (FCM)** - Para apps nativas
2. **OneSignal** - Servicio gratuito con más funciones
3. **Pusher** - Para notificaciones en tiempo real

---

## Opciones de Exportación de Datos

Los dueños de pulperías pueden exportar sus datos en:
- **CSV** - Compatible con Excel, Google Sheets
- **JSON** - Para backup o migración

Datos exportables:
- Órdenes (con detalles de items y clientes)
- Productos (inventario completo)
- Reseñas (feedback de clientes)

---

## Estructura del Proyecto

```
la-pulperia/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Modelos de base de datos
│   └── src/
│       ├── index.ts           # Servidor Express
│       ├── routes/            # Endpoints API
│       ├── middleware/        # Auth, errores
│       └── lib/               # Firebase, Cloudinary, etc.
├── frontend/
│   ├── public/
│   │   ├── sw.js              # Service Worker
│   │   └── manifest.json      # PWA manifest
│   └── src/
│       ├── components/        # Componentes React
│       ├── pages/             # Páginas
│       ├── stores/            # Zustand stores
│       └── lib/               # API, Firebase, utils
├── render.yaml                # Blueprint de Render
└── package.json               # Scripts del monorepo
```

---

## Soporte

¿Problemas? Revisa:
1. Los logs en Render Dashboard
2. Las variables de entorno
3. El estado de la base de datos
4. La conexión con Firebase y Cloudinary

---

## Licencia

Este proyecto es privado. Todos los derechos reservados.

---

**Hecho con ❤️ en Honduras**
