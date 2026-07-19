import { NextRequest, NextResponse } from "next/server";
import { createUser, addMerchant, getUserByEmail } from "@/lib/store";
import { hashPassword } from "@/lib/password";
import { validateRegisterInput } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });

  const { ok, errors, value } = validateRegisterInput(body);
  if (!ok) return NextResponse.json({ error: "参数校验失败", fields: errors }, { status: 422 });

  const existing = await getUserByEmail(value.email);
  if (existing)
    return NextResponse.json({ error: "该邮箱已注册", fields: { email: "邮箱已存在" } }, { status: 409 });

  const passwordHash = await hashPassword(value.password);
  const user = await createUser({
    email: value.email,
    name: value.name,
    passwordHash,
    role: value.role,
  });

  if (value.role === "merchant") {
    await addMerchant({
      name: value.company,
      industry: value.industry || "",
      contact: value.email,
      email: value.email,
      userId: user.id,
    });
  }

  return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
}
