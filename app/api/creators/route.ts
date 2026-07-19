import { NextRequest, NextResponse } from "next/server";
import { listCreators, addCreator } from "@/lib/store";
import { validateCreatorInput } from "@/lib/validation";
import { auth } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ creators: await listCreators() });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });

  const { ok, errors, value } = validateCreatorInput(body);
  if (!ok) return NextResponse.json({ error: "参数校验失败", fields: errors }, { status: 422 });

  const c = await addCreator(value);
  return NextResponse.json({ creator: c }, { status: 201 });
}
