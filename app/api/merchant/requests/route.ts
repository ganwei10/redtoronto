import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMerchantByUserId, createRequest } from "@/lib/store";
import { validateMerchantRequestInput } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "merchant")
    return NextResponse.json({ error: "仅商户可提交需求" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });

  const { ok, errors, value } = validateMerchantRequestInput(body);
  if (!ok) return NextResponse.json({ error: "参数校验失败", fields: errors }, { status: 422 });

  const merchant = await getMerchantByUserId(session.user.id);
  if (!merchant) return NextResponse.json({ error: "商户档案不存在" }, { status: 404 });

  const res = await createRequest(merchant.id, value);
  return NextResponse.json(
    { requestId: res.requestId, campaignId: res.campaignId, brief: res.brief },
    { status: 201 }
  );
}
