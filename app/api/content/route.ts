import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/ai";
import { getCreator } from "@/lib/store";
import { StructuredBrief } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const creator = getCreator(body.creatorId);
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
