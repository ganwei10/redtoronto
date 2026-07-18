import { NextRequest, NextResponse } from "next/server";
import { listCreators } from "@/lib/store";
import { matchCreators } from "@/lib/match";

function inferNiches(industry: string): string[] {
  const map: Record<string, string[]> = {
    地产: ["地产"],
    医美: ["医美", "护肤"],
    餐饮: ["餐饮", "美食"],
    母婴: ["母婴", "育儿"],
    留学: ["留学", "语言培训"],
    移民: ["移民"],
    保险: ["保险", "理财"],
    理财: ["理财", "保险"],
    旅游: ["旅游"],
  };
  for (const k of Object.keys(map)) {
    if (industry.includes(k)) return map[k];
  }
  return [industry || "生活方式"];
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const niches: string[] =
    body.niches && body.niches.length
      ? body.niches
      : inferNiches(body.industry || "");
  const budget = Number(body.budget) || 0;
  const city = body.city || "多伦多";
  const results = matchCreators({ creators: listCreators(), niches, budget, city });
  return NextResponse.json({
    results: results.slice(0, Number(body.topN) || 5),
  });
}
