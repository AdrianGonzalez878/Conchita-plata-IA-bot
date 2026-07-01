export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getBusinessProfile,
  updateBusinessProfile,
} from "@/lib/whatsapp/profile";

export async function GET() {
  try {
    const profile = await getBusinessProfile();
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching business profile:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await updateBusinessProfile({
      about: body.about,
      address: body.address,
      description: body.description,
      email: body.email,
      vertical: body.vertical,
      websites: body.websites,
      profilePictureHandle: body.profilePictureHandle,
    });

    const profile = await getBusinessProfile();
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating business profile:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
