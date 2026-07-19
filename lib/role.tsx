"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Role = "merchant" | "operator" | "creator";

export const ROLE_LABEL: Record<Role, string> = {
  merchant: "商户",
  operator: "运营方",
  creator: "博主",
};

export const ROLE_DESC: Record<Role, string> = {
  merchant: "提交营销需求、查看博主匹配推荐与 Campaign 效果",
  operator: "平台运营方，统筹博主库、匹配、内容、活动与数据看板",
  creator: "维护个人主页与报价、接收派单、提交内容稿与查看收益",
};

interface RoleCtx {
  role: Role | null;
  setRole: (r: Role) => void;
  clearRole: () => void;
}

const Ctx = createContext<RoleCtx>({
  role: null,
  setRole: () => {},
  clearRole: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setR] = useState<Role | null>(null);
  useEffect(() => {
    const s = localStorage.getItem("hdy_role") as Role | null;
    if (s) setR(s);
  }, []);
  const setRole = (r: Role) => {
    localStorage.setItem("hdy_role", r);
    setR(r);
  };
  const clearRole = () => {
    localStorage.removeItem("hdy_role");
    setR(null);
  };
  return <Ctx.Provider value={{ role, setRole, clearRole }}>{children}</Ctx.Provider>;
}

export const useRole = () => useContext(Ctx);
