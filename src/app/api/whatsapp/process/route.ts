export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createServiceClient } from "@/lib/supabase/server";
import { getSanityClient } from "@/lib/sanity/client";
import { ALL_PRODUCTS_QUERY } from "@/lib/sanity/queries";
import { buildSystemPrompt } from "@/lib/ai/prompts/system";
import {
  buildProductUrl,
  customerWantsPhotos,
  findProductsForPhotos,
  formatProductosParaIA,
  getProductImageUrl,
  type ProductoCatalogo,
} from "@/lib/products/catalog";
import { sendImageMessage, sendTextMessage } from "@/lib/whatsapp/client";
import type { Message } from "@/types";

interface ProcessPayload {
  message: { id: string; from: string; text: { body: string } };
  customerName: string;
  phoneNumberId: string;
}

async function verifyQStashSignature(request: NextRequest): Promise<boolean> {
  const signature = request.headers.get("upstash-signature");
  if (!signature) return false;
  const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  return !!signingKey && !!signature;
}

export async function POST(request: NextRequest) {
  const isValid = await verifyQStashSignature(request);
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload: ProcessPayload = await request.json();
  const { message, customerName } = payload;

  const supabase = createServiceClient();

  // 1. Buscar o crear la conversación del cliente
  let { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("customer_phone", message.from)
    .single();

  if (!conversation) {
    const { data: newConversation } = await supabase
      .from("conversations")
      .insert({
        customer_phone: message.from,
        customer_name: customerName,
        status: "ai_active",
      })
      .select()
      .single();
    conversation = newConversation;
  }

  if (!conversation) {
    return NextResponse.json({ error: "Could not create conversation" }, { status: 500 });
  }

  // 2. Si la conversación está pausada, guardar el mensaje y marcar como no leído
  if (conversation.status === "paused") {
    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      role: "user",
      sender: "customer",
      content: message.text.body,
      whatsapp_message_id: message.id,
    });

    if (insertError) {
      console.error("Error saving paused customer message:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { error: unreadError } = await supabase.rpc("increment_conversation_unread", {
      conv_id: conversation.id,
    });

    if (unreadError) {
      const { error: fallbackError } = await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          unread_count: (conversation.unread_count ?? 0) + 1,
        })
        .eq("id", conversation.id);

      if (fallbackError) {
        console.error("Error incrementing unread count:", fallbackError);
      }
    }

    return NextResponse.json({ status: "paused" });
  }

  // 3. Guardar el mensaje del cliente
  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    role: "user",
    sender: "customer",
    content: message.text.body,
    whatsapp_message_id: message.id,
  });

  // 4. Obtener historial de la conversación (últimos 20 mensajes)
  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(20);

  // 5. Obtener catálogo de productos desde Sanity
  const productos: ProductoCatalogo[] = await getSanityClient().fetch(ALL_PRODUCTS_QUERY);
  const productsContext = formatProductosParaIA(productos);
  const historyText = (history ?? []).map((m) => m.content).join("\n");

  // 6. Generar respuesta con IA
  const messages = (history ?? [])
    .filter((m: Pick<Message, "role" | "content">) => m.content?.trim())
    .map((m: Pick<Message, "role" | "content">) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const result = await generateText({
    model: anthropic("claude-haiku-4-5"),
    system: buildSystemPrompt(productsContext),
    messages: messages.length > 0 ? messages : [{ role: "user", content: message.text.body }],
  });

  console.log("AI result finishReason:", result.finishReason);
  console.log("AI response length:", result.text?.length);

  const aiResponse = result.text?.trim()
    || "Hola, soy el asistente de Conchita Plata. En este momento tengo problemas para generar una respuesta. Por favor intenta de nuevo en un momento.";

  // 7. Guardar y enviar respuesta
  const productsToPhoto = customerWantsPhotos(message.text.body)
    ? findProductsForPhotos(message.text.body, aiResponse, historyText, productos, 2)
    : [];

  let savedContent = aiResponse;

  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    role: "assistant",
    sender: "ai",
    content: savedContent,
  });

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversation.id);

  await sendTextMessage({ to: message.from, message: aiResponse });

  for (const product of productsToPhoto) {
    const imageUrl = getProductImageUrl(product.imagenPrincipal);
    if (!imageUrl) continue;

    const caption = `${product.titulo}\n${buildProductUrl(product.slug)}`;

    try {
      await sendImageMessage({
        to: message.from,
        imageUrl,
        caption,
      });

      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        role: "assistant",
        sender: "ai",
        content: caption,
        media_url: imageUrl,
      });
    } catch (error) {
      console.error("Error sending product image:", product.slug, error);
    }
  }

  return NextResponse.json({ status: "ok" });
}
