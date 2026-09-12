import { NextRequest, NextResponse } from "next/server";
import { twinStore } from "@/lib/twin-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentSlug: string }> }
) {
  const { studentSlug } = await params;
  const slug = (studentSlug || "alex").toLowerCase();
  try {
    const body = await request.json();
    const updatedTwin = twinStore.recordActivity(slug, body);
    return NextResponse.json({ success: true, twin: updatedTwin });
  } catch (error) {
    return NextResponse.json({ error: "Invalid activity data" }, { status: 400 });
  }
}
