import { NextRequest, NextResponse } from "next/server";
import { generateBrief } from "@/lib/ai";
import { BriefInput } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input: BriefInput = {
      industry: body.industry || "",
      goal: body.goal || "",
      budget: Number(body.budget) || 0,
      audience: body.audience || "",
      sellingPoints: body.sellingPoints || "",
      kpi: body.kpi || "",
      duration: body.duration || "",
    };
    const brief = await generateBrief(input);
    return NextResponse.json({ brief });
  } catch {
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
