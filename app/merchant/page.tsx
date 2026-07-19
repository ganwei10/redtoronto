import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMerchantByUserId, listRequestsByMerchant, listCampaigns } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MerchantDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "merchant") redirect("/");

  const merchant = await getMerchantByUserId(session.user.id);
  if (!merchant) redirect("/login");

  const requests = await listRequestsByMerchant(merchant.id);
  const campaigns = await listCampaigns(merchant.id);

  const totals = campaigns.reduce(
    (s, c) => {
      for (const m of c.metrics || []) {
        s.impressions += m.impressions;
        s.engagements += m.engagements;
        s.clicks += m.clicks;
        s.leads += m.leads;
      }
      return s;
    },
    { impressions: 0, engagements: 0, clicks: 0, leads: 0 }
  );

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">我的工作台</h1>
          <p className="mt-1 text-sm text-slate-500">
            {merchant.name}（{merchant.industry || "多伦多"}）· 欢迎回来
          </p>
        </div>
        <Link href="/merchant/requests/new" className="btn-primary">
          + 提交营销需求
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card">
          <div className="text-2xl font-bold text-brand">{campaigns.length}</div>
          <div className="mt-1 text-xs text-slate-500">进行中 Campaign</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-brand">{totals.impressions.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-500">累计曝光</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-brand">{totals.leads.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-500">累计留资</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-brand">{requests.length}</div>
          <div className="mt-1 text-xs text-slate-500">提交需求数</div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">我的营销需求</h2>
        {requests.length === 0 ? (
          <div className="card text-sm text-slate-500">
            暂无需求，点击「提交营销需求」开始你的第一个 Campaign。
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r: any) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{r.industry}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      r.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {r.status === "pending" ? "待运营审核" : "已采纳"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  预算 CAD {r.budget.toLocaleString()} · 目标：{r.goal || "—"}
                </p>
                {r.campaign && (
                  <Link
                    href="/merchant"
                    className="mt-2 inline-block text-xs text-brand hover:underline"
                  >
                    关联 Campaign：{r.campaign.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Campaign 效果</h2>
        {campaigns.length === 0 ? (
          <div className="card text-sm text-slate-500">暂无 Campaign 数据。</div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => {
              const imp = (c.metrics || []).reduce((s, m) => s + m.impressions, 0);
              const leads = (c.metrics || []).reduce((s, m) => s + m.leads, 0);
              return (
                <div key={c.id} className="card">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{c.name}</span>
                    <span className="text-xs text-slate-400">{c.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    曝光 {imp.toLocaleString()} · 留资 {leads.toLocaleString()} · 博主{" "}
                    {(c.creatorIds || []).length} 位
                  </p>
                  {c.review && (
                    <p className="mt-1 text-sm text-slate-600">📊 复盘：{c.review.summary}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
