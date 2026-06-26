import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ConversationStatus } from "@/types";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["ai_active", "paused", "resolved"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .update({ status: result.data.status as ConversationStatus })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
