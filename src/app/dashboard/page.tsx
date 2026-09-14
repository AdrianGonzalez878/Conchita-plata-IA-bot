"use client";

import { useState, useEffect, useCallback, useRef, type ComponentType } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProfileView } from "@/components/dashboard/ProfileView";
import { BusinessAvatar } from "@/components/dashboard/BusinessAvatar";
import {
  requestNotificationPermission,
  showCustomerMessageNotification,
} from "@/lib/notifications";
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

function NavIconChats({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10.5h8M8 14h5m-1 6.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17z"
      />
    </svg>
  );
}

function NavIconCampanas({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 5.882V19.24a1.76 1.76 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 01-1.564-.317z"
      />
    </svg>
  );
}

function NavIconPerfil({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

const MOBILE_NAV_ICONS: Record<Tab, ComponentType<{ className?: string }>> = {
  chats: NavIconChats,
  campanas: NavIconCampanas,
  perfil: NavIconPerfil,
};

function MobileBottomNav({
  activeTab,
  onTabChange,
  totalUnread,
  visible,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  totalUnread: number;
  visible: boolean;
}) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "chats", label: "Chats" },
    { id: "campanas", label: "Campañas" },
    { id: "perfil", label: "Perfil" },
  ];

  if (!visible) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#e9edef]"
      style={{ background: "#ffffff", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex h-[52px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = MOBILE_NAV_ICONS[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative touch-manipulation transition-colors ${
                isActive ? "text-[#00a884]" : "text-[#667781]"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className={`text-[10px] leading-none ${isActive ? "font-semibold" : "font-medium"}`}>
                {tab.label}
              </span>
              {tab.id === "chats" && totalUnread > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-26px)] min-w-[16px] h-4 px-1 rounded-full bg-[#00a884] text-white text-[9px] font-bold flex items-center justify-center">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
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
    <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto bg-[#f0f2f5]">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#e9edef] bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-[#111b21] text-lg font-semibold">Campañas de difusión</h2>
            <p className="text-[#667781] text-sm mt-0.5">
              Envía mensajes masivos a tus clientes en fechas especiales
            </p>
          </div>
          <button
            disabled
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed w-full sm:w-auto"
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
      <div className="mx-4 sm:mx-6 mt-4 sm:mt-5 rounded-xl px-4 sm:px-5 py-4 flex items-start gap-4 bg-white border border-[#d1f4ea]">
        <span className="text-2xl shrink-0 mt-0.5">🚀</span>
        <div>
          <p className="text-[#00a884] font-medium text-sm">Próximamente disponible</p>
          <p className="text-[#667781] text-xs mt-1 leading-relaxed">
            Esta sección te permitirá enviar mensajes de WhatsApp a todos tus clientes anteriores
            para informarles de promociones, nuevas colecciones y fechas especiales.
            Requiere configurar plantillas aprobadas por Meta y un método de pago.
          </p>
        </div>
      </div>

      {/* Requirements */}
      <div className="mx-4 sm:mx-6 mt-4 rounded-xl px-4 sm:px-5 py-4 bg-white">
        <p className="text-[#667781] text-xs font-semibold uppercase tracking-wider mb-3">Requisitos para activar</p>
        <div className="space-y-2.5">
          {[
            { done: true,  label: "App de Meta publicada" },
            { done: true,  label: "Número de WhatsApp registrado en la API" },
            { done: false, label: "Plantillas de mensaje aprobadas por Meta" },
            { done: false, label: "Método de pago configurado en Meta Business" },
          ].map((req) => (
            <div key={req.label} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${req.done ? "bg-[#25d366]" : "bg-[#e9edef]"}`}>
                {req.done
                  ? <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  : <svg className="w-3 h-3 text-[#667781]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                }
              </div>
              <span className={`text-sm ${req.done ? "text-[#111b21]" : "text-[#667781]"}`}>{req.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign ideas */}
      <div className="mx-4 sm:mx-6 mt-4 sm:mt-5 mb-6">
        <p className="text-[#667781] text-xs font-semibold uppercase tracking-wider mb-3">Ideas de campañas</p>
        <div className="grid grid-cols-1 gap-3">
          {campaigns.map((c) => (
            <div key={c.name} className="flex items-start gap-4 rounded-xl px-4 py-3.5 bg-white">
              <span className="text-2xl shrink-0">{c.icon}</span>
              <div>
                <p className="text-[#111b21] text-sm font-medium">{c.name}</p>
                <p className="text-[#667781] text-xs mt-0.5 leading-relaxed">{c.desc}</p>
              </div>
              <span className="ml-auto text-xs text-[#667781] bg-[#f0f2f5] px-2 py-1 rounded-full shrink-0 self-center">
                Próximamente
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function dedupeMessages(msgs: Message[]): Message[] {
  const seen = new Set<string>();
  return msgs.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
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
  const [photoRefreshKey, setPhotoRefreshKey] = useState(0);
  const [inAppAlert, setInAppAlert] = useState<{
    title: string;
    body: string;
    conversationId?: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedIdRef = useRef<string | null>(null);
  const activeTabRef = useRef<Tab>("chats");

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  const markConversationRead = useCallback(async (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
    );
    await supabase.from("conversations").update({ unread_count: 0 }).eq("id", convId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markConversationReadRef = useRef(markConversationRead);
  markConversationReadRef.current = markConversationRead;

  selectedIdRef.current = selectedId;
  activeTabRef.current = activeTab;

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
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(dedupeMessages(data as Message[]));
    }
    setLoadingMsgs(false);
    return data as Message[] | null;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    const channels: ReturnType<typeof supabase.channel>[] = [];

    const setupRealtime = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }
      if (cancelled) return;

      await fetchConversations();

      const convChannel = supabase
        .channel("rt-conversations")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "conversations" },
          (payload) => {
            const updated = payload.new as Conversation;
            const viewingChat =
              activeTabRef.current === "chats" &&
              selectedIdRef.current === updated.id &&
              document.visibilityState === "visible";

            setConversations((prev) =>
              prev.map((c) =>
                c.id === updated.id
                  ? {
                      ...c,
                      ...updated,
                      unread_count: viewingChat
                        ? 0
                        : (updated.unread_count ?? c.unread_count),
                      lastMessage: c.lastMessage,
                    }
                  : c
              )
            );

            if (viewingChat && (updated.unread_count ?? 0) > 0) {
              void markConversationReadRef.current(updated.id);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "conversations" },
          () => fetchConversations()
        )
        .subscribe();

      const messageChannel = supabase
        .channel("rt-incoming-messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            const msg = payload.new as Message;

            setConversations((prev) => {
              const conv = prev.find((c) => c.id === msg.conversation_id);
              if (!conv) return prev;

              const previewUpdate = {
                lastMessage: msg.content,
                last_message_at: msg.created_at,
              };

              if (msg.sender !== "customer") {
                return prev.map((c) =>
                  c.id === msg.conversation_id ? { ...c, ...previewUpdate } : c
                );
              }

              if (conv.status !== "paused" && conv.status !== "ai_active") {
                return prev.map((c) =>
                  c.id === msg.conversation_id ? { ...c, ...previewUpdate } : c
                );
              }

              const viewingChat =
                activeTabRef.current === "chats" &&
                selectedIdRef.current === msg.conversation_id &&
                document.visibilityState === "visible";

              if (viewingChat) {
                void markConversationReadRef.current(msg.conversation_id);
              } else {
                showCustomerMessageNotification({
                  customerName: conv.customer_name ?? conv.customer_phone,
                  customerPhone: conv.customer_phone,
                  content: msg.content,
                  conversationId: conv.id,
                });
              }

              return prev.map((c) => {
                if (c.id !== msg.conversation_id) return c;
                return { ...c, ...previewUpdate };
              });
            });

            if (
              selectedIdRef.current === msg.conversation_id &&
              activeTabRef.current === "chats"
            ) {
              setMessages((prev) =>
                dedupeMessages(prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
              );
            }
          }
        )
        .subscribe();

      channels.push(convChannel, messageChannel);
    };

    void setupRealtime();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await supabase.realtime.setAuth(session?.access_token ?? "");
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [fetchConversations]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      void requestNotificationPermission();
    }
  }, []);

  useEffect(() => {
    document.title =
      totalUnread > 0 ? `(${totalUnread}) Conchita Plata` : "Conchita Plata · Panel";
  }, [totalUnread]);

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail.id;
      setActiveTab("chats");
      setSelectedId(id);
      void markConversationRead(id);
    };
    window.addEventListener("dashboard-select-conversation", handler);
    return () => window.removeEventListener("dashboard-select-conversation", handler);
  }, [markConversationRead]);

  useEffect(() => {
    const onAlert = (e: Event) => {
      const detail = (e as CustomEvent<{
        title: string;
        body: string;
        conversationId?: string;
      }>).detail;
      setInAppAlert(detail);
      window.setTimeout(() => setInAppAlert(null), 6000);
    };

    window.addEventListener("dashboard-in-app-alert", onAlert);
    return () => window.removeEventListener("dashboard-in-app-alert", onAlert);
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;
    setLoadingMsgs(true);

    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", selectedId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Error fetching messages:", error);
        } else {
          setMessages(dedupeMessages(data as Message[]));
        }
        setLoadingMsgs(false);
      });

    const ch = supabase
      .channel(`rt-messages-${selectedId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedId}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) =>
            dedupeMessages(prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming])
          );
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const optimisticId = crypto.randomUUID();
    const optimisticMsg: Message = {
      id: optimisticId,
      conversation_id: selectedConv.id,
      role: "assistant",
      sender: "admin",
      content: text,
      media_url: null,
      whatsapp_message_id: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/admin/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedConv.customer_phone,
          message: text,
          conversationId: selectedConv.id,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        console.error("Send message failed:", data.error);
        return;
      }

      if (data.message) {
        const saved = data.message as Message;
        setMessages((prev) => {
          const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
          if (withoutOptimistic.some((m) => m.id === saved.id)) {
            return withoutOptimistic;
          }
          return [...withoutOptimistic, saved];
        });
      } else {
        await fetchMessages(selectedConv.id);
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? { ...c, lastMessage: text, last_message_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      console.error("Send message error:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  const filteredConvs = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.customer_name?.toLowerCase().includes(q) || c.customer_phone.includes(q);
  });

  const showMobileList = activeTab === "chats" && !selectedId;
  const showMobileChat = activeTab === "chats" && !!selectedId;
  const showMobileBottomNav = !showMobileChat;

  const handleMobileTabChange = (tab: Tab) => {
    if (tab === "chats" && activeTab === "chats" && selectedId) {
      setSelectedId(null);
      return;
    }
    setActiveTab(tab);
    if (tab !== "chats") setSelectedId(null);
  };

  return (
    <div
      className={`h-full flex relative overflow-hidden min-h-0 ${
        showMobileBottomNav
          ? "pb-[calc(52px+env(safe-area-inset-bottom,0px))] md:pb-0"
          : ""
      }`}
      style={{ background: "#ffffff" }}
    >
      {inAppAlert && (
        <button
          type="button"
          onClick={() => {
            if (inAppAlert.conversationId) {
              window.dispatchEvent(
                new CustomEvent("dashboard-select-conversation", {
                  detail: { id: inAppAlert.conversationId },
                })
              );
            }
            setInAppAlert(null);
          }}
          className="fixed top-14 md:top-16 inset-x-3 md:inset-x-auto md:right-4 z-50 md:max-w-sm md:w-[320px] text-left rounded-xl shadow-lg px-4 py-3 border border-[#d1f4ea] bg-white"
        >
          <p className="text-[#00a884] text-xs font-semibold mb-1">{inAppAlert.title}</p>
          <p className="text-[#111b21] text-sm leading-relaxed">{inAppAlert.body}</p>
          <p className="text-[#667781] text-[11px] mt-2">
            {inAppAlert.conversationId ? "Clic para abrir el chat" : "Alerta de prueba dentro del panel"}
          </p>
        </button>
      )}
      {/* ── SIDEBAR ── */}
      <aside
        className={`${showMobileList ? "flex" : "hidden md:flex"} w-full md:w-[360px] shrink-0 flex-col border-r border-[#e9edef] min-h-0 h-full bg-white`}
      >

        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 gap-2 bg-[#f0f2f5]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <BusinessAvatar size="sm" refreshKey={photoRefreshKey} />
            <span className="text-[#111b21] font-medium text-sm truncate">Conchita Plata</span>
          </div>
          <div className="flex items-center gap-1 text-[#667781] shrink-0">
            {totalUnread > 0 && (
              <span className="text-[10px] sm:text-xs bg-[#25d366] text-white px-1.5 sm:px-2 py-1 rounded-full font-semibold">
                {totalUnread} sin leer
              </span>
            )}
            <span className="hidden sm:inline text-xs bg-white text-[#667781] px-2 py-1 rounded-full">
              {conversations.filter((c) => c.status === "ai_active").length} activas
            </span>
            <span className="hidden sm:inline text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
              {conversations.filter((c) => c.status === "paused").length} pausadas
            </span>
          </div>
        </div>

        {/* Tabs — desktop only (mobile uses bottom nav) */}
        <div className="hidden md:flex border-b border-[#e9edef] bg-white">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "chats"
                ? "text-[#00a884] border-b-2 border-[#00a884]"
                : "text-[#667781] hover:text-[#111b21]"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab("campanas")}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "campanas"
                ? "text-[#00a884] border-b-2 border-[#00a884]"
                : "text-[#667781] hover:text-[#111b21]"
            }`}
          >
            Campañas
          </button>
          <button
            onClick={() => setActiveTab("perfil")}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "perfil"
                ? "text-[#00a884] border-b-2 border-[#00a884]"
                : "text-[#667781] hover:text-[#111b21]"
            }`}
          >
            Perfil
          </button>
        </div>

        {activeTab === "chats" && (
          <>
            {/* Search */}
            <div className="px-3 py-2 bg-white">
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-[#f0f2f5]">
                <svg className="w-4 h-4 text-[#667781] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar conversación"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-[#111b21] placeholder-[#667781] focus:outline-none w-full"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex justify-center pt-12">
                  <div className="w-5 h-5 border-2 border-[#e9edef] border-t-[#00a884] rounded-full animate-spin" />
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-[#667781] text-sm">Sin conversaciones</p>
                </div>
              ) : (
                filteredConvs.map((conv) => {
                  const name = conv.customer_name ?? conv.customer_phone;
                  const isSelected = selectedId === conv.id;
                  const unread = conv.unread_count ?? 0;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedId(conv.id);
                        if (unread > 0) void markConversationRead(conv.id);
                      }}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors border-b border-[#f0f2f5]"
                      style={{ background: isSelected ? "#f0f2f5" : "transparent" }}
                      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#f5f6f6"; }}
                      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div className={`w-12 h-12 rounded-full ${avatarColor(conv.customer_phone)} flex items-center justify-center text-white font-semibold text-base shrink-0`}>
                        {getInitials(conv.customer_name, conv.customer_phone)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm truncate ${unread > 0 ? "text-[#111b21] font-semibold" : "text-[#111b21] font-medium"}`}>
                            {name}
                          </span>
                          <span className={`text-xs shrink-0 ml-2 ${unread > 0 ? "text-[#25d366] font-semibold" : "text-[#667781]"}`}>
                            {conv.last_message_at ? formatTime(conv.last_message_at) : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs truncate leading-relaxed flex-1 ${unread > 0 ? "text-[#111b21] font-medium" : "text-[#667781]"}`}>
                            {conv.lastMessage || "Sin mensajes"}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {unread > 0 && (
                              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#25d366] text-white text-[11px] font-bold flex items-center justify-center">
                                {unread > 99 ? "99+" : unread}
                              </span>
                            )}
                            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[conv.status]}`} />
                          </div>
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
            <p className="text-[#667781] text-xs">Funcionalidad disponible próximamente.</p>
          </div>
        )}

        {activeTab === "perfil" && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <p className="text-[#667781] text-xs leading-relaxed">
              Configura la foto y los datos que ven tus clientes en WhatsApp.
            </p>
          </div>
        )}
      </aside>

      {/* ── MAIN CONTENT ── */}
      {activeTab === "campanas" ? (
        <div className="flex flex-1 flex-col min-w-0 min-h-0 w-full">
          <CampanasView />
        </div>
      ) : activeTab === "perfil" ? (
        <div className="flex flex-1 flex-col min-w-0 min-h-0 w-full">
          <ProfileView onPhotoUpdated={() => setPhotoRefreshKey((k) => k + 1)} />
        </div>
      ) : (
        <main className={`${showMobileChat ? "flex w-full" : "hidden md:flex"} flex-1 flex-col min-w-0 min-h-0`}>
          {!selectedConv ? (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center wa-chat-bg">
              <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-[#00a884]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-[#41525d] text-lg font-light mb-1">Conchita Plata Admin</h3>
              <p className="text-[#667781] text-sm text-center max-w-xs">
                Selecciona una conversación para ver los mensajes y gestionar la IA
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-2 sm:px-4 py-2 gap-2 shrink-0 bg-[#f0f2f5] border-b border-[#e9edef]">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="md:hidden shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-[#54656f] hover:bg-[#e9edef]"
                    aria-label="Volver a conversaciones"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${avatarColor(selectedConv.customer_phone)} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
                    {getInitials(selectedConv.customer_name, selectedConv.customer_phone)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#111b21] text-sm font-medium leading-tight truncate">
                      {selectedConv.customer_name ?? "Cliente"}
                    </p>
                    <p className="text-[#667781] text-xs truncate">{selectedConv.customer_phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`hidden sm:inline text-xs px-2 py-1 rounded-full font-medium ${
                    selectedConv.status === "ai_active"
                      ? "bg-emerald-50 text-emerald-700"
                      : selectedConv.status === "paused"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-stone-100 text-stone-500"
                  }`}>
                    {STATUS_LABEL[selectedConv.status]}
                  </span>
                  <button
                    onClick={handleTogglePause}
                    disabled={updatingStatus}
                    className={`text-[11px] sm:text-xs font-medium px-2 sm:px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap ${
                      selectedConv.status === "paused"
                        ? "bg-teal-600 hover:bg-teal-500 text-white"
                        : "bg-amber-600 hover:bg-amber-500 text-white"
                    }`}
                  >
                    {updatingStatus
                      ? "..."
                      : selectedConv.status === "paused"
                      ? "▶ IA"
                      : "⏸ IA"}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 wa-chat-bg">
                {loadingMsgs ? (
                  <div className="flex justify-center pt-12">
                    <div className="w-5 h-5 border-2 border-[#d1d7db] border-t-[#00a884] rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center pt-12">
                    <p className="text-[#667781] text-sm bg-white px-4 py-2 rounded-lg shadow-sm">Sin mensajes aún</p>
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
                            <span className="text-[#54656f] text-xs bg-white px-3 py-1 rounded-lg shadow-sm">
                              {new Date(msg.created_at).toLocaleDateString("es-MX", {
                                weekday: "long", day: "numeric", month: "long",
                              })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isCustomer ? "justify-start" : "justify-end"} mb-0.5`}>
                          <div
                            className="max-w-[88%] sm:max-w-[80%] md:max-w-[65%] rounded-lg px-3 py-2 text-sm relative shadow-sm"
                            style={{
                              background: isCustomer ? "#ffffff" : "#d9fdd3",
                              borderRadius: isCustomer ? "0px 7.5px 7.5px 7.5px" : "7.5px 0px 7.5px 7.5px",
                            }}
                          >
                            {!isCustomer && (
                              <p className="text-xs font-medium mb-0.5" style={{ color: isAdmin ? "#027eb5" : "#00a884" }}>
                                {isAdmin ? "Admin" : "✦ ARGI"}
                              </p>
                            )}
                            {msg.media_url ? (
                              <div className="space-y-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={msg.media_url}
                                  alt={msg.content.split("\n")[0] ?? "Producto"}
                                  className="rounded-md max-w-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                {msg.content && (
                                  <p className="text-[#111b21] leading-relaxed whitespace-pre-wrap text-xs">
                                    {msg.content}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-[#111b21] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            )}
                            <p className="text-[#667781] text-[11px] mt-1 text-right">
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
                <div
                  className="px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3 shrink-0 bg-[#f0f2f5]"
                  style={{
                    paddingBottom: showMobileChat
                      ? "max(0.75rem, env(safe-area-inset-bottom, 0px))"
                      : undefined,
                  }}
                >
                  <div className="flex-1 flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2.5 min-w-0 bg-white">
                    <input
                      ref={inputRef}
                      type="text"
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendManual(); } }}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 bg-transparent text-sm text-[#111b21] placeholder-[#667781] focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSendManual}
                    disabled={!manualText.trim() || sendingMsg}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
                    style={{ background: manualText.trim() ? "#00a884" : "#d1d7db" }}
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  className="px-3 sm:px-4 py-3 flex items-center gap-3 shrink-0 bg-[#f0f2f5]"
                  style={{
                    paddingBottom: showMobileChat
                      ? "max(0.75rem, env(safe-area-inset-bottom, 0px))"
                      : undefined,
                  }}
                >
                  <div className="flex-1 flex items-center justify-center rounded-lg px-3 sm:px-4 py-2.5 bg-white">
                    <p className="text-[#667781] text-xs sm:text-sm text-center">✦ ARGI está respondiendo automáticamente</p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      )}

      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={handleMobileTabChange}
        totalUnread={totalUnread}
        visible={showMobileBottomNav}
      />
    </div>
  );
}
