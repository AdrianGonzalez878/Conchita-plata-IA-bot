import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      customer_phone,
      customer_name,
      status,
      last_message_at,
      created_at,
      messages (
        content,
        created_at
      )
    `)
    .order("last_message_at", { ascending: false })
    .limit(1, { foreignTable: "messages" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
