export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getBusinessProfile,
  updateBusinessProfile,
  uploadProfilePicture,
} from "@/lib/whatsapp/profile";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("photo");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibió ninguna imagen" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes JPG o PNG" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "La imagen debe pesar menos de 5 MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const handle = await uploadProfilePicture(buffer, file.type);
    await updateBusinessProfile({ profilePictureHandle: handle });

    const profile = await getBusinessProfile();
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
