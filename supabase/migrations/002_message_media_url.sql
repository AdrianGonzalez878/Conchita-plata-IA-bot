-- Guardar URLs de imágenes enviadas por el bot en el panel
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
