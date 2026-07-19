import { NextRequest, NextResponse } from "next/server";
import { listCreators } from "@/lib/store";
import { matchCreators } from "@/lib/match";
import { validateMatchInput } from "@/lib/validation";
import { auth } from "@/lib/auth";

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
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });

  const { ok, errors, value } = validateMatchInput(body);
  if (!ok) return NextResponse.json({ error: "参数校验失败", fields: errors }, { status: 422 });

  const niches: string[] =
    value.niches && value.niches.length ? value.niches : inferNiches(value.industry);
  const creators = await listCreators();
  const results = matchCreators({
    creators,
    niches,
    budget: value.budget,
    city: value.city,
  });
  return NextResponse.json({
    results: results.slice(0, value.topN),
  });
}
