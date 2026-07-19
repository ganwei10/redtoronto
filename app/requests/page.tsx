import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listRequests } from "@/lib/store";
import RequestAcceptButton from "./RequestAcceptButton";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "operator") redirect("/");

  const requests = await listRequests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">商户需求审核</h1>
        <p className="mt-1 text-sm text-slate-500">
          来自商户门户的营销需求，审核通过后将进入博主匹配与投放流程。
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="card text-sm text-slate-500">暂无商户需求。</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r: any) => (
            <div key={r.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">
                  {r.merchant?.name || "未知商户"} · {r.industry}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    r.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {r.status === "pending" ? "待审核" : "已采纳"}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                预算 CAD {r.budget.toLocaleString()} · 目标：{r.goal || "—"} · 联系人：
                {r.merchant?.contact || "—"}
              </p>
              {r.brief?.objective && (
                <p className="text-sm text-slate-600">📋 Brief：{r.brief.objective}</p>
              )}
              {r.status === "pending" && <RequestAcceptButton requestId={r.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
