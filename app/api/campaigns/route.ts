import { NextRequest, NextResponse } from "next/server";
import { listCampaigns, addCampaign } from "@/lib/store";
import { StructuredBrief } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ campaigns: listCampaigns() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const cmp = addCampaign({
    name: body.name || "未命名 Campaign",
    brief: body.brief as StructuredBrief,
    creatorIds: body.creatorIds || [],
    status: "draft",
    budgetCAD: Number(body.budgetCAD) || 0,
  });
  return NextResponse.json({ campaign: cmp });
}
