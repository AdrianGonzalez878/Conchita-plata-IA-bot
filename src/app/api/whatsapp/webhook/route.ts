export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import type { WhatsAppWebhookPayload } from "@/types";
import { Client as QStashClient } from "@upstash/qstash";

// GET: Verificación del webhook por Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("Webhook verificado por Meta");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST: Recibir mensajes entrantes de WhatsApp
export async function POST(request: NextRequest) {
  const body: WhatsAppWebhookPayload = await request.json();

  // Responder 200 de inmediato a Meta (requerido en < 3 segundos)
  // El procesamiento real se encola en QStash
  const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN! });

  if (body.object === "whatsapp_business_account") {
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field !== "messages") continue;

        const messages = change.value.messages;
        if (!messages?.length) continue;

        for (const message of messages) {
          if (message.type !== "text") continue;

          const customerName =
            change.value.contacts?.[0]?.profile?.name ?? "Cliente";

          // Encolar en QStash para procesamiento asíncrono
          await qstash.publishJSON({
            url: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/process`,
            body: {
              message,
              customerName,
              phoneNumberId: change.value.metadata.phone_number_id,
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
