import { NextRequest, NextResponse } from "next/server";
import { addMetric } from "@/lib/store";
import { validateMetricInput } from "@/lib/validation";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });

  const { ok, errors, value } = validateMetricInput(body);
  if (!ok) return NextResponse.json({ error: "参数校验失败", fields: errors }, { status: 422 });

  const cmp = await addMetric(id, value);
  if (!cmp)
    return NextResponse.json({ error: "Campaign 不存在" }, { status: 404 });
  return NextResponse.json({ campaign: cmp });
}
