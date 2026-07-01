"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message, ConversationStatus } from "@/types";

type ConvWithPreview = Conversation & { lastMessage: string };

const STATUS_LABEL: Record<ConversationStatus, string> = {
  ai_active: "IA Activa",
  paused: "Pausado",
  resolved: "Resuelto",
};

const STATUS_COLOR: Record<ConversationStatus, string> = {
  ai_active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  resolved: "bg-stone-100 text-stone-500",
};

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60_000) return "ahora";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const supabase = createClient();

  const [conversations, setConversations] = useState<ConvWithPreview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [manualText, setManualText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;

  // ── Fetch conversations ──────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select("*, messages(content, created_at, role)")
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (data) {
      const convs = (data as any[]).map((c) => {
        const sorted = [...(c.messages ?? [])].sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return {
          ...c,
          messages: undefined,
          lastMessage: sorted[0]?.content ?? "",
        } as ConvWithPreview;
      });
      setConversations(convs);
    }
    setLoadingConvs(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch messages for selected conversation ─────────────────
  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);
    setLoadingMsgs(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Real-time: conversations ──────────────────────────────────
  useEffect(() => {
    fetchConversations();

    const ch = supabase
      .channel("rt-conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [fetchConversations]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Real-time: messages for selected conv ─────────────────────
  useEffect(() => {
    if (!selectedId) return;
    fetchMessages(selectedId);

    const ch = supabase
      .channel(`rt-messages-${selectedId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [selectedId, fetchMessages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll to bottom ─────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Pause / Resume AI ─────────────────────────────────────────
  const handleTogglePause = async () => {
    if (!selectedConv || updatingStatus) return;
    const next: ConversationStatus = selectedConv.status === "paused" ? "ai_active" : "paused";
    setUpdatingStatus(true);
    await fetch(`/api/admin/conversations/${selectedConv.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConv.id ? { ...c, status: next } : c))
    );
    setUpdatingStatus(false);
  };

  const handleResolve = async () => {
    if (!selectedConv) return;
    await fetch(`/api/admin/conversations/${selectedConv.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConv.id ? { ...c, status: "resolved" } : c))
    );
  };

  // ── Send manual message ───────────────────────────────────────
  const handleSendManual = async () => {
    if (!selectedConv || !manualText.trim() || sendingMsg) return;
    setSendingMsg(true);
    const text = manualText.trim();
    setManualText("");

    // Save message to Supabase
    await supabase.from("messages").insert({
      conversation_id: selectedConv.id,
      role: "assistant",
      sender: "admin",
      content: text,
    });

    // Send via WhatsApp API
    await fetch("/api/admin/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: selectedConv.customer_phone, message: text }),
    });

    setSendingMsg(false);
  };

  // ── Filtered conversations ────────────────────────────────────
  const filteredConvs = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.customer_name?.toLowerCase().includes(q) ||
      c.customer_phone.includes(q)
    );
  });

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex">
      {/* ── LEFT SIDEBAR: Conversations ── */}
      <aside className="w-80 shrink-0 border-r border-stone-200 bg-white flex flex-col">
        {/* Search */}
        <div className="p-3 border-b border-stone-100">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg bg-stone-100 border-0 focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-400"
          />
        </div>

        {/* Stats bar */}
        <div className="px-3 py-2 border-b border-stone-100 flex gap-3 text-xs text-stone-500">
          <span className="font-medium text-stone-700">{conversations.length}</span> conversaciones
          <span>·</span>
          <span className="text-emerald-600 font-medium">
            {conversations.filter((c) => c.status === "ai_active").length}
          </span> activas
          <span>·</span>
          <span className="text-amber-600 font-medium">
            {conversations.filter((c) => c.status === "paused").length}
          </span> pausadas
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-stone-400 text-sm">Sin conversaciones</p>
            </div>
          ) : (
            filteredConvs.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left px-4 py-3.5 border-b border-stone-100 hover:bg-stone-50 transition-colors ${
                  selectedId === conv.id ? "bg-stone-100 border-l-2 border-l-stone-700" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-stone-800 text-sm truncate">
                        {conv.customer_name ?? conv.customer_phone}
                      </span>
                    </div>
                    <p className="text-stone-500 text-xs truncate leading-relaxed">
                      {conv.lastMessage || "Sin mensajes"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-stone-400 text-xs">
                      {conv.last_message_at ? formatTime(conv.last_message_at) : ""}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[conv.status]}`}>
                      {STATUS_LABEL[conv.status]}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── RIGHT: Chat View ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
            <span className="text-4xl mb-3">💬</span>
            <p className="text-sm">Selecciona una conversación para ver los mensajes</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="h-14 bg-white border-b border-stone-200 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 text-sm font-medium">
                  {(selectedConv.customer_name ?? selectedConv.customer_phone)[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-stone-800 text-sm leading-tight">
                    {selectedConv.customer_name ?? "Cliente"}
                  </p>
                  <p className="text-stone-400 text-xs">{selectedConv.customer_phone}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[selectedConv.status]}`}>
                  {STATUS_LABEL[selectedConv.status]}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {selectedConv.status !== "resolved" && (
                  <>
                    <button
                      onClick={handleTogglePause}
                      disabled={updatingStatus}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                        selectedConv.status === "paused"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      }`}
                    >
                      {updatingStatus
                        ? "..."
                        : selectedConv.status === "paused"
                        ? "▶ Reactivar IA"
                        : "⏸ Pausar IA"}
                    </button>
                    <button
                      onClick={handleResolve}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                    >
                      ✓ Resolver
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center pt-12">
                  <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-stone-400 text-sm">Sin mensajes aún</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCustomer = msg.sender === "customer";
                  const isAdmin = msg.sender === "admin";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-sm lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isCustomer
                            ? "bg-white border border-stone-200 text-stone-800 rounded-tl-sm"
                            : isAdmin
                            ? "bg-blue-600 text-white rounded-tr-sm"
                            : "bg-stone-800 text-white rounded-tr-sm"
                        }`}
                      >
                        {!isCustomer && (
                          <p className={`text-xs mb-1 font-medium ${isAdmin ? "text-blue-200" : "text-stone-400"}`}>
                            {isAdmin ? "Admin" : "IA Conchita"}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isCustomer ? "text-stone-400" : isAdmin ? "text-blue-200" : "text-stone-400"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Manual message input (only when paused) */}
            {selectedConv.status === "paused" && (
              <div className="bg-white border-t border-stone-200 px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-amber-600 text-xs font-medium">
                    ⏸ IA pausada — puedes responder manualmente
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendManual(); } }}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50"
                  />
                  <button
                    onClick={handleSendManual}
                    disabled={!manualText.trim() || sendingMsg}
                    className="px-4 py-2.5 bg-stone-800 text-white text-sm font-medium rounded-xl hover:bg-stone-700 disabled:opacity-40 transition-colors"
                  >
                    {sendingMsg ? "..." : "Enviar"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
