export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createServiceClient } from "@/lib/supabase/server";
import { getSanityClient } from "@/lib/sanity/client";
import { ALL_PRODUCTS_QUERY } from "@/lib/sanity/queries";
import { buildSystemPrompt } from "@/lib/ai/prompts/system";
import { sendTextMessage } from "@/lib/whatsapp/client";
import type { Message } from "@/types";

interface ProductoSanity {
  _id: string;
  titulo: string;
  slug: string;
  precio: number;
  tieneDescuento?: boolean;
  tipoDescuento?: "porcentaje" | "monto";
  valorDescuento?: number;
  textoBadge?: string;
  fechaInicioDescuento?: string;
  fechaFinDescuento?: string;
  categoria: string;
  tieneOpcionExtra?: boolean;
  nombreOpcionExtra?: string;
  precioOpcionExtra?: number;
  descripcionTexto?: string;
  disponible: boolean;
  stock?: number;
  ventas?: number;
}

interface ProcessPayload {
  message: { id: string; from: string; text: { body: string } };
  customerName: string;
  phoneNumberId: string;
}

function formatProductosParaIA(productos: ProductoSanity[]): string {
  return productos
    .map((p) => {
      const lines: string[] = [];

      // Nombre y categoría
      const categoria = p.categoria.charAt(0).toUpperCase() + p.categoria.slice(1);
      lines.push(`• ${p.titulo} [${categoria}]`);

      // Precio y descuento
      if (p.tieneDescuento && p.valorDescuento) {
        const descuento =
          p.tipoDescuento === "porcentaje"
            ? `${p.valorDescuento}% OFF`
            : `$${p.valorDescuento} MXN de descuento`;
        const badge = p.textoBadge ?? descuento;
        lines.push(`  Precio: $${p.precio} MXN — Promoción: ${badge}`);
      } else {
        lines.push(`  Precio: $${p.precio} MXN`);
      }

      // Stock
      const stock = p.stock ?? 1;
      if (stock === 0) {
        lines.push(`  Stock: Agotado`);
      } else if (stock <= 3) {
        lines.push(`  Stock: Últimas ${stock} pieza(s)`);
      } else {
        lines.push(`  Stock: Disponible (${stock} uds.)`);
      }

      // Complemento opcional (cadena, pulsera, etc.)
      if (p.tieneOpcionExtra && p.nombreOpcionExtra) {
        lines.push(
          `  Complemento opcional: ${p.nombreOpcionExtra} (+$${p.precioOpcionExtra ?? 0} MXN)`
        );
      }

      // Descripción
      if (p.descripcionTexto) {
        const resumen = p.descripcionTexto.slice(0, 120).replace(/\n/g, " ");
        lines.push(`  Descripción: ${resumen}${p.descripcionTexto.length > 120 ? "..." : ""}`);
      }

      return lines.join("\n");
    })
    .join("\n\n");
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

  const supabase = await createServiceClient();

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

  // 2. Si la conversación está pausada, solo guardar el mensaje
  if (conversation.status === "paused") {
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      role: "user",
      sender: "customer",
      content: message.text.body,
      whatsapp_message_id: message.id,
    });
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
  const productos: ProductoSanity[] = await getSanityClient().fetch(ALL_PRODUCTS_QUERY);
  const productsContext = formatProductosParaIA(productos);

  // 6. Generar respuesta con IA
  const messages = (history ?? [])
    .filter((m: Pick<Message, "role" | "content">) => m.content?.trim())
    .map((m: Pick<Message, "role" | "content">) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const { text: aiResponse } = await generateText({
    model: anthropic("claude-haiku-4-5"),
    system: buildSystemPrompt(productsContext),
    messages,
  });

  // 7. Guardar respuesta de la IA
  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    role: "assistant",
    sender: "ai",
    content: aiResponse,
  });

  // 8. Actualizar última actividad
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversation.id);

  // 9. Enviar respuesta por WhatsApp
  await sendTextMessage({ to: message.from, message: aiResponse });

  return NextResponse.json({ status: "ok" });
}
