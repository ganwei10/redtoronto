"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ROLES = [
  { value: "merchant", label: "商户", desc: "提交营销需求、查看匹配推荐与 Campaign 效果" },
  { value: "operator", label: "运营方", desc: "平台运营，统筹博主库、匹配、内容与数据看板" },
  { value: "creator", label: "博主", desc: "维护个人主页与报价、接收派单、提交内容稿" },
] as const;

const HOME: Record<string, string> = {
  merchant: "/merchant",
  operator: "/",
  creator: "/creator",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "merchant",
    company: "",
    industry: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "注册失败");
      if (data.fields) {
        const first = Object.values(data.fields as Record<string, string>)[0];
        if (first) setError(first);
      }
      setLoading(false);
      return;
    }
    // 注册成功后自动登录
    const login = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    if (!login || login.error) {
      router.push("/login");
      return;
    }
    router.push(HOME[form.role] || "/");
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">红多营运营平台 · 注册</h1>
        <p className="mt-2 text-sm text-slate-500">创建账号以使用对应角色的操作台。</p>
      </div>

      <form onSubmit={submit} className="card space-y-3">
        <div>
          <label className="label">姓名 / 联系人</label>
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div>
          <label className="label">邮箱</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">密码（至少 6 位）</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="label">注册身份</label>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
                  form.role === r.value ? "border-brand bg-brand-soft" : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={form.role === r.value}
                  onChange={() => set("role", r.value)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium text-slate-900">{r.label}</span>
                  <span className="block text-xs text-slate-500">{r.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        {form.role === "merchant" && (
          <>
            <div>
              <label className="label">商户名称</label>
              <input
                className="input"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">所属行业</label>
              <input
                className="input"
                value={form.industry}
                onChange={(e) => set("industry", e.target.value)}
                placeholder="如：餐饮 / 留学 / 地产"
              />
            </div>
          </>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "提交中…" : "注册并登录"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        已有账号？
        <Link href="/login" className="text-brand hover:underline">
          返回登录
        </Link>
      </p>
    </div>
  );
}
