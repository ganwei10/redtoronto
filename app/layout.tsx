import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { RoleProvider } from "@/lib/role";
import Header from "./header";

export const metadata: Metadata = {
  title: "红多营运营平台 · 多伦多小红书智能营销运营平台",
  description:
    "面向多伦多华人商户的小红书智能营销运营平台：博主匹配、Brief 生成、内容工作台与效果看板，AI 驱动。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <RoleProvider>
          <div className="mx-auto flex min-h-screen max-w-6xl flex-col">
            <Header />
            <main className="flex-1 px-6 py-8">{children}</main>
            <footer className="border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-400">
              红多营运营平台 · 多伦多小红书智能营销运营平台 · AI 驱动
            </footer>
          </div>
        </RoleProvider>
      </body>
    </html>
  );
}
