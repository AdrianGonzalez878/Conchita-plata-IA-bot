export function buildAIMessageHistory(
  history: Array<{ role: string; content: string }>,
  currentUserMessage: string
): Array<{ role: "user" | "assistant"; content: string }> {
  const trimmedCurrent = currentUserMessage.trim();

  const msgs = history
    .filter((m) => m.content?.trim() && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content.trim(),
    }));

  if (msgs.length === 0) {
    return [{ role: "user", content: trimmedCurrent }];
  }

  const last = msgs[msgs.length - 1];

  if (last.role === "user" && last.content === trimmedCurrent) {
    return msgs;
  }

  if (last.role === "assistant") {
    msgs.push({ role: "user", content: trimmedCurrent });
    return msgs;
  }

  // Replace stale trailing user turn with the webhook payload (source of truth)
  msgs[msgs.length - 1] = { role: "user", content: trimmedCurrent };
  return msgs;
}
