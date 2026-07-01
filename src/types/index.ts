// ============================================================
// TIPOS GLOBALES DEL PROYECTO CONCHITA PLATA IA BOT
// ============================================================

// --- WhatsApp ---

export type WhatsAppMessageType = "text" | "image" | "audio" | "document" | "interactive";

export interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: WhatsAppMessageType;
  text?: { body: string };
  image?: { id: string; mime_type: string; caption?: string };
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: WhatsAppMessage[];
        statuses?: Array<{ id: string; status: string; timestamp: string; recipient_id: string }>;
      };
      field: string;
    }>;
  }>;
}

// --- Conversaciones ---

export type ConversationStatus = "ai_active" | "paused" | "resolved";

export interface Conversation {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  status: ConversationStatus;
  last_message_at: string;
  created_at: string;
  unread_count: number;
}

// --- Mensajes ---

export type MessageRole = "user" | "assistant" | "system";
export type MessageSender = "customer" | "ai" | "admin";

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  sender: MessageSender;
  content: string;
  media_url: string | null;
  whatsapp_message_id: string | null;
  created_at: string;
}

// --- Catálogo de Productos (Sanity — schema real de Conchita Plata) ---

export type CategoriaProducto =
  | "anillos"
  | "collares"
  | "aretes"
  | "pulseras"
  | "dijes"
  | "cadenas"
  | "juegos";

export interface SanityImageRef {
  _type: "image";
  asset: { _ref: string; _type: "reference" };
  alt?: string;
}

export interface PortableTextBlock {
  _type: "block";
  _key: string;
  children: { _key: string; _type: "span"; text: string }[];
}

export interface Producto {
  _id: string;
  titulo: string;
  slug: { current: string };
  precio: number;
  tieneDescuento?: boolean;
  tipoDescuento?: "porcentaje" | "monto";
  valorDescuento?: number;
  textoBadge?: string;
  fechaInicioDescuento?: string;
  fechaFinDescuento?: string;
  imagenPrincipal: SanityImageRef;
  galeria?: SanityImageRef[];
  categoria: CategoriaProducto;
  tieneOpcionExtra?: boolean;
  nombreOpcionExtra?: string;
  precioOpcionExtra?: number;
  descripcion: PortableTextBlock[];
  disponible: boolean;
  stock?: number;
  ventas?: number;
}

// --- Dashboard ---

export interface ConversationWithLastMessage extends Conversation {
  last_message: string | null;
}

// Mantener alias para compatibilidad hacia atrás
export type Product = Producto;
