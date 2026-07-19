"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const HOME: Record<string, string> = {
  merchant: "/merchant",
  operator: "/",
  creator: "/creator",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (!res || res.error) {
      setError("邮箱或密码错误，请重试");
      setLoading(false);
      return;
    }
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role as string | undefined;
    router.push(HOME[role || "operator"] || "/");
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">红多营运营平台 · 登录</h1>
        <p className="mt-2 text-sm text-slate-500">
          请使用注册账号登录。不同角色拥有独立的操作台与数据权限。
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-3">
        <div>
          <label className="label">邮箱</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label">密码</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="请输入密码"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "登录中…" : "登录"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        还没有账号？
        <Link href="/register" className="text-brand hover:underline">
          立即注册
        </Link>
      </p>
    </div>
  );
}
