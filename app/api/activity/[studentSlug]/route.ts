import { NextRequest, NextResponse } from "next/server";
import { twinStore } from "@/lib/twin-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentSlug: string }> }
) {
  const { studentSlug } = await params;
  const slug = (studentSlug || "alex").toLowerCase();
  const activities = twinStore.getActivities(slug);
  return NextResponse.json(activities);
}
