import { NextRequest, NextResponse } from "next/server";
import { listCampaigns, addCampaign } from "@/lib/store";
import { validateCampaignInput } from "@/lib/validation";
import { auth } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ campaigns: await listCampaigns() });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });

  const { ok, errors, value } = validateCampaignInput(body);
  if (!ok) return NextResponse.json({ error: "参数校验失败", fields: errors }, { status: 422 });

  const cmp = await addCampaign(value);
  return NextResponse.json({ campaign: cmp }, { status: 201 });
}
