import { NextRequest, NextResponse } from "next/server";
import { twinStore } from "@/lib/twin-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentSlug: string }> }
) {
  const { studentSlug } = await params;
  const slug = (studentSlug || "alex").toLowerCase();
  const preferences = twinStore.getPreferences(slug);
  return NextResponse.json(preferences);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ studentSlug: string }> }
) {
  const { studentSlug } = await params;
  const slug = (studentSlug || "alex").toLowerCase();
  try {
    const body = await request.json();
    const updated = twinStore.updatePreferences(slug, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 400 });
  }
}
