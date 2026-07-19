import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { acceptRequest, getRequest } from "@/lib/store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "operator")
    return NextResponse.json({ error: "仅运营方可审核需求" }, { status: 403 });

  const { id } = await params;
  const req = await getRequest(id);
  if (!req) return NextResponse.json({ error: "需求不存在" }, { status: 404 });

  await acceptRequest(id);
  return NextResponse.json({ ok: true });
}
