import { NextRequest, NextResponse } from "next/server";
import { sendTextMessage } from "@/lib/whatsapp/client";

export async function POST(request: NextRequest) {
  const { to, message } = await request.json();

  if (!to || !message?.trim()) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  await sendTextMessage({ to, message });
  return NextResponse.json({ status: "ok" });
}
