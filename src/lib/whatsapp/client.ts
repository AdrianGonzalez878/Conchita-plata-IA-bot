const WHATSAPP_API_URL = "https://graph.facebook.com/v20.0";

interface SendTextMessageParams {
  to: string;
  message: string;
}

interface SendTemplateMessageParams {
  to: string;
  templateName: string;
  languageCode?: string;
}

async function callWhatsAppAPI(endpoint: string, body: object) {
  const response = await fetch(
    `${WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}${endpoint}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function sendTextMessage({ to, message }: SendTextMessageParams) {
  return callWhatsAppAPI("/messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { body: message },
  });
}

export async function sendTemplateMessage({
  to,
  templateName,
  languageCode = "es_MX",
}: SendTemplateMessageParams) {
  return callWhatsAppAPI("/messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
    },
  });
}

export async function markMessageAsRead(messageId: string) {
  return callWhatsAppAPI("/messages", {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}
