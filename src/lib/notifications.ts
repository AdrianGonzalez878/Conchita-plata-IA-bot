export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function dispatchInAppAlert(detail: {
  title: string;
  body: string;
  conversationId?: string;
}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("dashboard-in-app-alert", { detail }));
}

export function showCustomerMessageNotification(options: {
  customerName: string;
  customerPhone: string;
  content: string;
  conversationId: string;
}) {
  const preview =
    options.content.length > 120 ? `${options.content.slice(0, 117)}...` : options.content;
  const title = `${options.customerName} respondió`;

  dispatchInAppAlert({
    title,
    body: preview,
    conversationId: options.conversationId,
  });

  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const notification = new Notification(title, {
      body: preview,
      tag: `chat-${options.conversationId}-${Date.now()}`,
    });

    notification.onclick = () => {
      window.focus();
      window.dispatchEvent(
        new CustomEvent("dashboard-select-conversation", {
          detail: { id: options.conversationId },
        })
      );
      notification.close();
    };
  } catch (error) {
    console.error("Browser notification failed:", error);
  }
}
