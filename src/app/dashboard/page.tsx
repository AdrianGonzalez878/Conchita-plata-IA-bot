"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProfileView } from "@/components/dashboard/ProfileView";
import type { Conversation, Message, ConversationStatus } from "@/types";

type ConvWithPreview = Conversation & { lastMessage: string };
type Tab = "chats" | "campanas" | "perfil";

const STATUS_LABEL: Record<ConversationStatus, string> = {
  ai_active: "IA Activa",
  paused: "Pausado",
  resolved: "Resuelto",
};

const STATUS_DOT: Record<ConversationStatus, string> = {
  ai_active: "bg-emerald-400",
  paused: "bg-amber-400",
  resolved: "bg-stone-400",
};

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60_000) return "ahora";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000)
    return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function getInitials(name: string | null, phone: string) {
  if (name) return name.charAt(0).toUpperCase();
  return phone.slice(-2);
}

function avatarColor(str: string) {
  const colors = [
    "bg-teal-500", "bg-violet-500", "bg-pink-500", "bg-orange-500",
    "bg-sky-500", "bg-rose-500", "bg-indigo-500", "bg-green-500",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ── Placeholder de campañas ──────────────────────────────────────────────────
function CampanasView() {
  const campaigns = [
    { icon: "🛍️", name: "Buen Fin", desc: "Descuentos especiales de hasta 30% en toda la colección." },
    { icon: "💐", name: "Día de la Madre", desc: "Mensaje de regalo especial para mamá con código de descuento." },
    { icon: "🎄", name: "Navidad", desc: "Promoción navideña con envío gratis en pedidos mayores a $800." },
    { icon: "💝", name: "San Valentín", desc: "Colección especial de joyas para regalar en pareja." },
    { icon: "🎓", name: "Graduaciones", desc: "Regalos de joyería para celebrar logros académicos." },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto" style={{ background: "#0b141a" }}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#ffffff12]" style={{ background: "#202c33" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#e9edef] text-lg font-semibold">Campañas de difusión</h2>
            <p className="text-[#8696a0] text-sm mt-0.5">
              Envía mensajes masivos a tus clientes en fechas especiales
            </p>
          </div>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
            style={{ background: "#00a884", color: "white" }}
            title="Próximamente"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva campaña
          </button>
        </div>
      </div>

      {/* Coming soon banner */}
      <div className="mx-6 mt-5 rounded-xl px-5 py-4 flex items-start gap-4" style={{ background: "#1d2b34", border: "1px solid #00a88440" }}>
        <span className="text-2xl shrink-0 mt-0.5">🚀</span>
        <div>
          <p className="text-[#25d366] font-medium text-sm">Próximamente disponible</p>
          <p className="text-[#8696a0] text-xs mt-1 leading-relaxed">
            Esta sección te permitirá enviar mensajes de WhatsApp a todos tus clientes anteriores
            para informarles de promociones, nuevas colecciones y fechas especiales.
            Requiere configurar plantillas aprobadas por Meta y un método de pago.
          </p>
        </div>
      </div>

      {/* Requirements */}
      <div className="mx-6 mt-4 rounded-xl px-5 py-4" style={{ background: "#182229" }}>
        <p className="text-[#aebac1] text-xs font-semibold uppercase tracking-wider mb-3">Requisitos para activar</p>
        <div className="space-y-2.5">
          {[
            { done: true,  label: "App de Meta publicada" },
            { done: true,  label: "Número de WhatsApp registrado en la API" },
            { done: false, label: "Plantillas de mensaje aprobadas por Meta" },
            { done: false, label: "Método de pago configurado en Meta Business" },
          ].map((req) => (
            <div key={req.label} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${req.done ? "bg-emerald-500" : "bg-[#2a3942]"}`}>
                {req.done
                  ? <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  : <svg className="w-3 h-3 text-[#8696a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                }
              </div>
              <span className={`text-sm ${req.done ? "text-[#e9edef]" : "text-[#8696a0]"}`}>{req.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign ideas */}
      <div className="mx-6 mt-5 mb-6">
        <p className="text-[#aebac1] text-xs font-semibold uppercase tracking-wider mb-3">Ideas de campañas</p>
        <div className="grid grid-cols-1 gap-3">
          {campaigns.map((c) => (
            <div key={c.name} className="flex items-start gap-4 rounded-xl px-4 py-3.5" style={{ background: "#182229" }}>
              <span className="text-2xl shrink-0">{c.icon}</span>
              <div>
                <p className="text-[#e9edef] text-sm font-medium">{c.name}</p>
                <p className="text-[#8696a0] text-xs mt-0.5 leading-relaxed">{c.desc}</p>
              </div>
              <span className="ml-auto text-xs text-[#8696a0] bg-[#2a3942] px-2 py-1 rounded-full shrink-0 self-center">
                Próximamente
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>("chats");
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
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;

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
        return { ...c, messages: undefined, lastMessage: sorted[0]?.content ?? "" } as ConvWithPreview;
      });
      setConversations(convs);
    }
    setLoadingConvs(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    fetchConversations();
    const ch = supabase
      .channel("rt-conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () =>
        fetchConversations()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchConversations]); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    if (next === "paused") setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSendManual = async () => {
    if (!selectedConv || !manualText.trim() || sendingMsg) return;
    setSendingMsg(true);
    const text = manualText.trim();
    setManualText("");

    const optimisticMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: selectedConv.id,
      role: "assistant",
      sender: "admin",
      content: text,
      whatsapp_message_id: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    await fetch("/api/admin/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: selectedConv.customer_phone, message: text, conversationId: selectedConv.id }),
    });
    setSendingMsg(false);
  };

  const filteredConvs = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.customer_name?.toLowerCase().includes(q) || c.customer_phone.includes(q);
  });

  return (
    <div className="h-full flex" style={{ background: "#111b21" }}>
      {/* ── SIDEBAR ── */}
      <aside className="w-[360px] shrink-0 flex flex-col border-r border-[#ffffff12]" style={{ background: "#111b21" }}>

        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: "#202c33" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold text-sm">
              CP
            </div>
            <span className="text-white font-medium text-sm">Conchita Plata</span>
          </div>
          <div className="flex items-center gap-1 text-[#aebac1]">
            <span className="text-xs bg-[#2a3942] px-2 py-1 rounded-full">
              {conversations.filter((c) => c.status === "ai_active").length} activas
            </span>
            <span className="text-xs bg-amber-900/40 text-amber-300 px-2 py-1 rounded-full ml-1">
              {conversations.filter((c) => c.status === "paused").length} pausadas
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#ffffff12]" style={{ background: "#111b21" }}>
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "chats"
                ? "text-[#00a884] border-b-2 border-[#00a884]"
                : "text-[#8696a0] hover:text-[#aebac1]"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab("campanas")}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "campanas"
                ? "text-[#00a884] border-b-2 border-[#00a884]"
                : "text-[#8696a0] hover:text-[#aebac1]"
            }`}
          >
            📣 Campañas
          </button>
          <button
            onClick={() => setActiveTab("perfil")}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "perfil"
                ? "text-[#00a884] border-b-2 border-[#00a884]"
                : "text-[#8696a0] hover:text-[#aebac1]"
            }`}
          >
            Perfil
          </button>
        </div>

        {activeTab === "chats" && (
          <>
            {/* Search */}
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#202c33" }}>
                <svg className="w-4 h-4 text-[#aebac1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar conversación"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none w-full"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex justify-center pt-12">
                  <div className="w-5 h-5 border-2 border-[#aebac1] border-t-teal-500 rounded-full animate-spin" />
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-[#8696a0] text-sm">Sin conversaciones</p>
                </div>
              ) : (
                filteredConvs.map((conv) => {
                  const name = conv.customer_name ?? conv.customer_phone;
                  const isSelected = selectedId === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedId(conv.id)}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors border-b border-[#ffffff08]"
                      style={{ background: isSelected ? "#2a3942" : "transparent" }}
                      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#202c33"; }}
                      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div className={`w-12 h-12 rounded-full ${avatarColor(conv.customer_phone)} flex items-center justify-center text-white font-semibold text-base shrink-0`}>
                        {getInitials(conv.customer_name, conv.customer_phone)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[#e9edef] text-sm font-medium truncate">{name}</span>
                          <span className="text-[#8696a0] text-xs shrink-0 ml-2">
                            {conv.last_message_at ? formatTime(conv.last_message_at) : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[#8696a0] text-xs truncate leading-relaxed">
                            {conv.lastMessage || "Sin mensajes"}
                          </p>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[conv.status]}`} />
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}

        {activeTab === "campanas" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            <p className="text-[#8696a0] text-xs">Funcionalidad disponible próximamente.</p>
          </div>
        )}

        {activeTab === "perfil" && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <p className="text-[#8696a0] text-xs leading-relaxed">
              Configura la foto y los datos que ven tus clientes en WhatsApp.
            </p>
          </div>
        )}
      </aside>

      {/* ── MAIN CONTENT ── */}
      {activeTab === "campanas" ? (
        <CampanasView />
      ) : activeTab === "perfil" ? (
        <ProfileView />
      ) : (
        <main className="flex-1 flex flex-col min-w-0">
          {!selectedConv ? (
            <div className="flex-1 flex flex-col items-center justify-center" style={{ background: "#222e35" }}>
              <div className="w-20 h-20 rounded-full bg-[#2a3942] flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-[#aebac1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-[#e9edef] text-lg font-light mb-1">Conchita Plata Admin</h3>
              <p className="text-[#8696a0] text-sm text-center max-w-xs">
                Selecciona una conversación para ver los mensajes y gestionar la IA
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: "#202c33" }}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${avatarColor(selectedConv.customer_phone)} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
                    {getInitials(selectedConv.customer_name, selectedConv.customer_phone)}
                  </div>
                  <div>
                    <p className="text-[#e9edef] text-sm font-medium leading-tight">
                      {selectedConv.customer_name ?? "Cliente"}
                    </p>
                    <p className="text-[#8696a0] text-xs">{selectedConv.customer_phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    selectedConv.status === "ai_active"
                      ? "bg-emerald-900/50 text-emerald-400"
                      : selectedConv.status === "paused"
                      ? "bg-amber-900/50 text-amber-400"
                      : "bg-stone-700 text-stone-400"
                  }`}>
                    {STATUS_LABEL[selectedConv.status]}
                  </span>
                  <button
                    onClick={handleTogglePause}
                    disabled={updatingStatus}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                      selectedConv.status === "paused"
                        ? "bg-teal-600 hover:bg-teal-500 text-white"
                        : "bg-amber-600 hover:bg-amber-500 text-white"
                    }`}
                  >
                    {updatingStatus ? "..." : selectedConv.status === "paused" ? "▶ Reactivar IA" : "⏸ Pausar IA"}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1" style={{ background: "#0b141a" }}>
                {loadingMsgs ? (
                  <div className="flex justify-center pt-12">
                    <div className="w-5 h-5 border-2 border-[#aebac1] border-t-teal-500 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center pt-12">
                    <p className="text-[#8696a0] text-sm bg-[#182229] px-4 py-2 rounded-lg">Sin mensajes aún</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isCustomer = msg.sender === "customer";
                    const isAdmin = msg.sender === "admin";
                    const prevMsg = messages[i - 1];
                    const showDate =
                      !prevMsg ||
                      new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-3">
                            <span className="text-[#8696a0] text-xs bg-[#182229] px-3 py-1 rounded-lg">
                              {new Date(msg.created_at).toLocaleDateString("es-MX", {
                                weekday: "long", day: "numeric", month: "long",
                              })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isCustomer ? "justify-start" : "justify-end"} mb-0.5`}>
                          <div
                            className="max-w-[65%] rounded-lg px-3 py-2 text-sm relative"
                            style={{
                              background: isCustomer ? "#202c33" : "#005c4b",
                              borderRadius: isCustomer ? "0px 7.5px 7.5px 7.5px" : "7.5px 0px 7.5px 7.5px",
                            }}
                          >
                            {!isCustomer && (
                              <p className="text-xs font-medium mb-0.5" style={{ color: isAdmin ? "#53bdeb" : "#25d366" }}>
                                {isAdmin ? "Admin" : "✦ IA Conchita"}
                              </p>
                            )}
                            <p className="text-[#e9edef] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-[#8696a0] text-xs mt-1 text-right">
                              {new Date(msg.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              {selectedConv.status === "paused" ? (
                <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: "#202c33" }}>
                  <div className="flex-1 flex items-center gap-2 rounded-lg px-4 py-2.5" style={{ background: "#2a3942" }}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendManual(); } }}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSendManual}
                    disabled={!manualText.trim() || sendingMsg}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
                    style={{ background: manualText.trim() ? "#00a884" : "#2a3942" }}
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: "#202c33" }}>
                  <div className="flex-1 flex items-center justify-center rounded-lg px-4 py-2.5" style={{ background: "#2a3942" }}>
                    <p className="text-[#8696a0] text-sm">✦ La IA está respondiendo automáticamente</p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      )}
    </div>
  );
}
