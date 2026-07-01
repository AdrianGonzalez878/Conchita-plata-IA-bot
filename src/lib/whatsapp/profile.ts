const WHATSAPP_API_URL = "https://graph.facebook.com/v20.0";

export interface WhatsAppBusinessProfile {
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  profile_picture_url?: string;
  websites?: string[];
  vertical?: string;
  verified_name?: string;
  display_phone_number?: string;
}

export interface UpdateBusinessProfileInput {
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  websites?: string[];
  vertical?: string;
  profilePictureHandle?: string;
}

const PROFILE_FIELDS =
  "about,address,description,email,profile_picture_url,websites,vertical";

async function whatsappFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${WHATSAPP_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      ...init?.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`WhatsApp API error: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function getBusinessProfile(): Promise<WhatsAppBusinessProfile> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;

  const [profileRes, phoneRes] = await Promise.all([
    whatsappFetch(
      `/${phoneNumberId}/whatsapp_business_profile?fields=${PROFILE_FIELDS}`
    ),
    whatsappFetch(
      `/${phoneNumberId}?fields=verified_name,display_phone_number`
    ),
  ]);

  const profile = profileRes.data?.[0] ?? {};

  return {
    about: profile.about ?? "",
    address: profile.address ?? "",
    description: profile.description ?? "",
    email: profile.email ?? "",
    profile_picture_url: profile.profile_picture_url ?? "",
    websites: profile.websites ?? [],
    vertical: profile.vertical ?? "",
    verified_name: phoneRes.verified_name ?? "",
    display_phone_number: phoneRes.display_phone_number ?? "",
  };
}

export async function updateBusinessProfile(input: UpdateBusinessProfileInput) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
  };

  if (input.about !== undefined) body.about = input.about;
  if (input.address !== undefined) body.address = input.address;
  if (input.description !== undefined) body.description = input.description;
  if (input.email !== undefined) body.email = input.email;
  if (input.vertical !== undefined) body.vertical = input.vertical;
  if (input.websites !== undefined) {
    body.websites = input.websites.filter(Boolean);
  }
  if (input.profilePictureHandle) {
    body.profile_picture_handle = input.profilePictureHandle;
  }

  return whatsappFetch(`/${phoneNumberId}/whatsapp_business_profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function uploadProfilePicture(
  file: Buffer,
  mimeType: string
): Promise<string> {
  const appId = process.env.WHATSAPP_APP_ID;
  if (!appId) {
    throw new Error("WHATSAPP_APP_ID no está configurado");
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN!;

  const sessionRes = await fetch(
    `${WHATSAPP_API_URL}/${appId}/uploads?file_length=${file.length}&file_type=${encodeURIComponent(mimeType)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const session = await sessionRes.json();
  if (!sessionRes.ok) {
    const hint =
      session.error?.code === 100
        ? " Verifica que WHATSAPP_APP_ID sea el ID completo de tu app en Meta → Configuración → Básica."
        : "";
    throw new Error(`WhatsApp API error: ${JSON.stringify(session)}.${hint}`);
  }

  const uploadRes = await fetch(`${WHATSAPP_API_URL}/${session.id}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      file_offset: "0",
      "Content-Type": mimeType,
    },
    body: new Uint8Array(file),
  });
  const upload = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(`WhatsApp API error: ${JSON.stringify(upload)}`);
  }

  if (!upload.h) {
    throw new Error("No se pudo obtener el handle de la imagen");
  }

  return upload.h as string;
}
