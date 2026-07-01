import { NextRequest, NextResponse } from "next/server";
import { sendTextMessage } from "@/lib/whatsapp/client";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { to, message, conversationId } = await request.json();

  if (!to || !message?.trim()) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  let savedMessage = null;

  if (conversationId) {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        sender: "admin",
        content: message.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving admin message:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    savedMessage = data;

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);
  }

  try {
    await sendTextMessage({ to, message: message.trim() });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error al enviar por WhatsApp",
        message: savedMessage,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: "ok", message: savedMessage });
}
