-- Incrementa no leídos y actualiza last_message_at (ejecutar en SQL Editor de Supabase)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_conversation_unread(conv_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET unread_count = COALESCE(unread_count, 0) + 1,
      last_message_at = NOW()
  WHERE id = conv_id;
END;
$$;

-- Service role puede actualizar conversaciones (webhook / process)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conversations'
      AND policyname = 'Service role puede actualizar conversaciones'
  ) THEN
    CREATE POLICY "Service role puede actualizar conversaciones"
      ON conversations FOR UPDATE
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
