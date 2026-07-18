import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "红多营 RedToronto · 多伦多小红书营销服务商平台",
  description:
    "面向多伦多华人商户的小红书营销服务商平台：博主匹配、Brief 生成、内容工作台与效果看板，AI 驱动。",
};

const nav = [
  { href: "/", label: "概览" },
  { href: "/creators", label: "博主库" },
  { href: "/brief", label: "Brief" },
  { href: "/match", label: "匹配" },
  { href: "/content", label: "内容工作台" },
  { href: "/campaigns", label: "Campaign" },
  { href: "/kb", label: "知识库" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-brand">红多营</span>
                <span className="text-sm text-slate-400">RedToronto</span>
              </Link>
              <span className="text-xs text-slate-400">
                多伦多小红书营销服务商平台 · MVP
              </span>
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
          <main className="flex-1 px-6 py-8">{children}</main>
          <footer className="border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-400">
            红多营 RedToronto · 代理商本地化服务商 · AI 驱动 MVP
          </footer>
        </div>
      </body>
    </html>
  );
}
