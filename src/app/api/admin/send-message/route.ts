import { NextRequest, NextResponse } from "next/server";
import { sendTextMessage } from "@/lib/whatsapp/client";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { to, message, conversationId } = await request.json();

  if (!to || !message?.trim()) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  // Save message to Supabase with service role (bypasses RLS)
  if (conversationId) {
    const supabase = await createServiceClient();
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      sender: "admin",
      content: message,
    });
  }

  await sendTextMessage({ to, message });
  return NextResponse.json({ status: "ok" });
}
