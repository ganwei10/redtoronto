import { NextRequest, NextResponse } from "next/server";
import { generateBrief } from "@/lib/ai";
import { validateBriefInput } from "@/lib/validation";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });

  const { ok, errors, value } = validateBriefInput(body);
  if (!ok) return NextResponse.json({ error: "参数校验失败", fields: errors }, { status: 422 });

  const brief = await generateBrief(value);
  return NextResponse.json({ brief });
}
