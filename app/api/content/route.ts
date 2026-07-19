import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/ai";
import { getCreator } from "@/lib/store";
import { StructuredBrief } from "@/lib/types";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !body.creatorId)
    return NextResponse.json({ error: "缺少 creatorId" }, { status: 400 });
  try {
    const creator = await getCreator(body.creatorId);
    if (!creator)
      return NextResponse.json({ error: "博主不存在" }, { status: 404 });
    const brief: StructuredBrief = body.brief;
    const result = await generateContent({
      creatorHandle: creator.handle,
      niche: creator.niche,
      brief,
    });
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
