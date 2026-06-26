-- ============================================================
-- ESQUEMA DE BASE DE DATOS - CONCHITA PLATA IA BOT
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Tabla de conversaciones
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_phone TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'ai_active' 
    CHECK (status IN ('ai_active', 'paused', 'resolved')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  sender TEXT NOT NULL CHECK (sender IN ('customer', 'ai', 'admin')),
  content TEXT NOT NULL,
  whatsapp_message_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Habilitar Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: solo usuarios autenticados (admins del dashboard) pueden leer
CREATE POLICY "Admins pueden ver conversaciones"
  ON conversations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins pueden actualizar conversaciones"
  ON conversations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Service role puede insertar conversaciones"
  ON conversations FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Admins pueden ver mensajes"
  ON messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role puede insertar mensajes"
  ON messages FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Habilitar Realtime para el dashboard en vivo
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
