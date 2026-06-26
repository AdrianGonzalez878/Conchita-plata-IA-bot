# Conchita Plata — Asistente Virtual con IA

Chatbot de WhatsApp con IA para la joyería **Conchita Plata**, construido con Next.js, Supabase, Sanity y el SDK de Vercel AI.

---

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| Framework | Next.js 15+ (App Router) | Webhook de WhatsApp + Dashboard admin |
| Base de datos | Supabase | Conversaciones, mensajes, auth y Realtime |
| CMS Catálogo | Sanity | Gestión del inventario de joyas |
| IA | Vercel AI SDK + Claude Haiku | Respuestas inteligentes |
| Cola de mensajes | Upstash QStash | Procesamiento asíncrono del webhook |
| Cache / Rate limit | Upstash Redis | Opcional |
| Deploy | Vercel | Nativo para Next.js |

---

## Arquitectura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── whatsapp/
│   │   │   ├── webhook/route.ts      # Recibe mensajes de Meta y encola en QStash
│   │   │   └── process/route.ts      # Procesa IA y envía respuesta (llamado por QStash)
│   │   └── admin/
│   │       └── conversations/
│   │           ├── route.ts          # GET: lista de conversaciones
│   │           └── [id]/
│   │               └── status/route.ts  # PATCH: pausar/reactivar IA
│   ├── dashboard/                    # Panel de administración (protegido)
│   │   └── conversations/[id]/       # Vista de un chat individual
│   └── (auth)/
│       └── login/                    # Login para admins
├── components/
│   ├── chat/                         # Componentes del panel de chat
│   ├── dashboard/                    # Componentes del dashboard
│   └── ui/                           # Componentes reutilizables (botones, inputs, etc.)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Cliente para el browser
│   │   ├── server.ts                 # Cliente para Server Components
│   │   └── middleware.ts             # Protección de rutas
│   ├── sanity/
│   │   ├── client.ts                 # Cliente de Sanity
│   │   └── queries.ts                # Queries GROQ del catálogo
│   ├── whatsapp/
│   │   └── client.ts                 # Funciones para enviar mensajes via API de Meta
│   └── ai/
│       └── prompts/
│           └── system.ts             # Prompt del sistema de la IA
├── hooks/                            # Custom hooks de React
├── types/
│   └── index.ts                      # Tipos TypeScript globales
└── utils/                            # Utilidades generales
supabase/
└── schema.sql                        # Esquema de la base de datos
```

---

## Flujo de un Mensaje

```
Cliente de WhatsApp
       ↓
POST /api/whatsapp/webhook   ← Meta envía el mensaje
       ↓
  Encolar en QStash          ← Respuesta 200 inmediata a Meta
       ↓
POST /api/whatsapp/process   ← QStash ejecuta esto de forma asíncrona
       ↓
  ¿Conversación pausada?
  → Sí: Solo guarda el mensaje, NO responde con IA
  → No: Continuar
       ↓
  Fetch catálogo desde Sanity
       ↓
  Generar respuesta con Claude Haiku
       ↓
  Guardar en Supabase
       ↓
  Enviar respuesta por WhatsApp API
```

---

## Configuración Inicial

### 1. Variables de entorno

```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

### 2. Base de datos (Supabase)

Ir al SQL Editor de tu proyecto en [supabase.com](https://supabase.com) y ejecutar el contenido de `supabase/schema.sql`.

### 3. Catálogo (Sanity)

Crear un proyecto en [sanity.io](https://sanity.io) con el schema de producto:
- `name` (string)
- `slug` (slug)
- `description` (text)
- `price` (number)
- `category` (string)
- `material` (string)
- `stock` (number)
- `images` (array of images)
- `isAvailable` (boolean)

### 4. WhatsApp (Meta)

1. Crear una app en [Meta for Developers](https://developers.facebook.com)
2. Agregar el producto "WhatsApp Business"
3. Configurar el webhook apuntando a `https://tu-dominio.com/api/whatsapp/webhook`
4. Usar el `WHATSAPP_VERIFY_TOKEN` que definas en tu `.env.local`

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

---

## Funcionalidades del Dashboard

- Ver todas las conversaciones activas en tiempo real
- Leer el historial completo de cada chat
- **Pausar la IA** en una conversación para responder manualmente
- **Reactivar la IA** cuando termines de atender al cliente
- Marcar conversaciones como resueltas
