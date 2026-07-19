"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROLE_LABEL, useRole } from "@/lib/role";

const nav = [
  { href: "/", label: "平台概览" },
  { href: "/creators", label: "博主库" },
  { href: "/brief", label: "需求 Brief" },
  { href: "/match", label: "博主匹配" },
  { href: "/content", label: "内容工作台" },
  { href: "/campaigns", label: "Campaign" },
  { href: "/kb", label: "复盘知识库" },
];

export default function Header() {
  const { role, clearRole } = useRole();
  const router = useRouter();

  function logout() {
    clearRole();
    router.push("/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-brand">红多营运营平台</span>
        </Link>
        <div className="flex items-center gap-3">
          {role ? (
            <>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
                当前身份：{ROLE_LABEL[role]}
              </span>
              <button className="text-xs text-slate-400 hover:text-slate-600" onClick={logout}>
                退出
              </button>
            </>
          ) : (
            <Link href="/login" className="text-xs text-brand hover:underline">
              登录
            </Link>
          )}
        </div>
      </div>
      <nav className="flex gap-1 px-6 pb-2 text-sm">
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
    </header>
  );
}
