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
  whatsapp_message_id: string | null;
  created_at: string;
}

// --- Catálogo de Productos (Sanity) ---

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  material: string;
  stock: number;
  images: Array<{ _key: string; asset: { _ref: string } }>;
  isAvailable: boolean;
}

// --- Dashboard ---

export interface ConversationWithLastMessage extends Conversation {
  last_message: string | null;
}
