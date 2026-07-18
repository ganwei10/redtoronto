import { NextRequest, NextResponse } from "next/server";
import { addMetric } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const cmp = addMetric(id, {
    date: body.date || new Date().toISOString().slice(0, 10),
    impressions: Number(body.impressions) || 0,
    engagements: Number(body.engagements) || 0,
    clicks: Number(body.clicks) || 0,
    leads: Number(body.leads) || 0,
  });
  if (!cmp)
    return NextResponse.json({ error: "campaign 不存在" }, { status: 404 });
  return NextResponse.json({ campaign: cmp });
}
