"use client";

import { useRouter } from "next/navigation";
import { Role, ROLE_LABEL, ROLE_DESC, useRole } from "@/lib/role";

const ROLES: Role[] = ["merchant", "operator", "creator"];

const HOME: Record<Role, string> = {
  merchant: "/brief",
  operator: "/",
  creator: "/content",
};

export default function LoginPage() {
  const router = useRouter();
  const { setRole } = useRole();

  function enter(r: Role) {
    setRole(r);
    router.push(HOME[r]);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">红多营运营平台 · 用户登录</h1>
        <p className="mt-2 text-sm text-slate-500">
          请选择您的身份入口。不同角色拥有独立的操作台与数据权限。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => enter(r)}
            className="card space-y-2 text-left transition hover:border-brand hover:shadow-md"
          >
            <div className="text-lg font-semibold text-brand">{ROLE_LABEL[r]}</div>
            <p className="text-sm text-slate-500">{ROLE_DESC[r]}</p>
            <span className="inline-block text-xs font-medium text-brand">进入 →</span>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400">
        本登录为 MVP 演示入口（前端角色态），生产环境将于 v1.1 接入统一身份认证与权限（NextAuth / JWT + 数据库）。
      </p>
    </div>
  );
}
