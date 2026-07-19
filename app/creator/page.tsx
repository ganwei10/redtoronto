import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CreatorPortal() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "creator") redirect("/");

  return (
    <div className="space-y-6 py-6">
      <h1 className="text-2xl font-bold text-slate-900">博主门户</h1>
      <div className="card space-y-2 text-sm text-slate-500">
        <p>博主门户（FR9）将在后续版本开放：维护个人主页与报价、接收派单、提交内容稿与查看收益。</p>
        <p>当前版本已支持：博主库管理（运营方）与博主匹配。博主账号体系已就绪，门户页面建设中。</p>
      </div>
    </div>
  );
}
