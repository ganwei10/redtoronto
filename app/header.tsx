"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const OPERATOR_NAV = [
  { href: "/", label: "平台概览" },
  { href: "/creators", label: "博主库" },
  { href: "/brief", label: "需求 Brief" },
  { href: "/match", label: "博主匹配" },
  { href: "/content", label: "内容工作台" },
  { href: "/campaigns", label: "Campaign" },
  { href: "/requests", label: "商户需求" },
  { href: "/kb", label: "复盘知识库" },
];

const MERCHANT_NAV = [
  { href: "/merchant", label: "我的工作台" },
  { href: "/merchant/requests/new", label: "提交营销需求" },
];

const ROLE_LABEL: Record<string, string> = {
  merchant: "商户",
  operator: "运营方",
  creator: "博主",
};

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const role = (session?.user as { role?: string } | undefined)?.role;
  const nav = role === "merchant" ? MERCHANT_NAV : role === "creator" ? [] : OPERATOR_NAV;

  function logout() {
    signOut({ callbackUrl: "/login" });
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-brand">红多营运营平台</span>
        </Link>
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <span className="text-xs text-slate-400">加载中…</span>
          ) : session?.user ? (
            <>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
                {ROLE_LABEL[role || "merchant"]}：{session.user.email}
              </span>
              <button
                className="text-xs text-slate-400 hover:text-slate-600"
                onClick={logout}
              >
                退出登录
              </button>
            </>
          ) : (
            <Link href="/login" className="text-xs text-brand hover:underline">
              登录
            </Link>
          )}
        </div>
      </div>
      {nav.length > 0 && (
        <nav className="flex flex-wrap gap-1 px-6 pb-2 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
