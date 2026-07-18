"use client";

import { useEffect, useState } from "react";
import { Campaign, Creator, ReviewResult } from "@/lib/types";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [form, setForm] = useState({
    name: "",
    budgetCAD: 5000,
    creatorIds: [] as string[],
    industry: "医美",
    goal: "获取咨询",
  });
  const [loading, setLoading] = useState(true);
  const [reviewMap, setReviewMap] = useState<Record<string, ReviewResult | null>>({});
  const [reviewing, setReviewing] = useState<string | null>(null);

  async function genReview(id: string) {
    setReviewing(id);
    const res = await fetch(`/api/campaigns/${id}/review`, { method: "POST" });
    const data = await res.json();
    setReviewMap((m) => ({ ...m, [id]: data.review }));
    setReviewing(null);
  }
  async function loadReview(id: string) {
    const res = await fetch(`/api/campaigns/${id}/review`);
    const data = await res.json();
    if (data.review) setReviewMap((m) => ({ ...m, [id]: data.review }));
  }
  useEffect(() => {
    // 进入页面时拉取已有复盘（知识库沉淀）
    campaigns.forEach((c) => c.review && loadReview(c.id));
  }, [campaigns]);

  async function load() {
    const [c, r] = await Promise.all([
      fetch("/api/campaigns").then((x) => x.json()),
      fetch("/api/creators").then((x) => x.json()),
    ]);
    setCampaigns(c.campaigns);
    setCreators(r.creators);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function toggleCreator(id: string) {
    setForm((f) => ({
      ...f,
      creatorIds: f.creatorIds.includes(id)
        ? f.creatorIds.filter((x) => x !== id)
        : [...f.creatorIds, id],
    }));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const brief = {
      objective: `${form.industry}：${form.goal}`,
      audiencePackage: [],
      contentAngles: [],
      recommendedCreatorType: "",
      kpiBreakdown: [],
      notes: "",
    };
    await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        budgetCAD: Number(form.budgetCAD),
        creatorIds: form.creatorIds,
        brief,
      }),
    });
    setForm({ ...form, name: "", creatorIds: [] });
    load();
  }

  async function addMetric(id: string) {
    const impressions = prompt("曝光量?");
    if (impressions === null) return;
    const engagements = prompt("互动量?") ?? "0";
    const clicks = prompt("点击量?") ?? "0";
    const leads = prompt("留资量?") ?? "0";
    await fetch(`/api/campaigns/${id}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        impressions: Number(impressions) || 0,
        engagements: Number(engagements) || 0,
        clicks: Number(clicks) || 0,
        leads: Number(leads) || 0,
      }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Campaign 与看板</h1>

      <div className="card">
        <h3 className="mb-3 font-semibold">新建 Campaign</h3>
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">名称</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">预算 CAD</label>
            <input
              className="input"
              type="number"
              value={form.budgetCAD}
              onChange={(e) =>
                setForm({ ...form, budgetCAD: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="label">行业</label>
            <input
              className="input"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </div>
          <div>
            <label className="label">目标</label>
            <input
              className="input"
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">选择博主</label>
            <div className="flex flex-wrap gap-2">
              {creators.map((c) => (
                <label key={c.id} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={form.creatorIds.includes(c.id)}
                    onChange={() => toggleCreator(c.id)}
                  />
                  {c.handle}
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary" type="submit">
              创建 Campaign
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-slate-400">加载中…</p>
        ) : (
          campaigns.map((cmp) => {
            const total = cmp.metrics.reduce(
              (s, m) => ({
                impressions: s.impressions + m.impressions,
                engagements: s.engagements + m.engagements,
                clicks: s.clicks + m.clicks,
                leads: s.leads + m.leads,
              }),
              { impressions: 0, engagements: 0, clicks: 0, leads: 0 }
            );
            const roi =
              cmp.budgetCAD > 0
                ? ((total.leads / cmp.budgetCAD) * 1000).toFixed(1)
                : "0";
            return (
              <div key={cmp.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{cmp.name}</div>
                  <span className="text-xs text-slate-400">
                    预算 CAD {cmp.budgetCAD} · {cmp.creatorIds.length} 博主
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{cmp.brief.objective}</p>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="font-bold">{total.impressions}</div>
                    <div className="text-xs text-slate-400">曝光</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="font-bold">{total.engagements}</div>
                    <div className="text-xs text-slate-400">互动</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="font-bold">{total.leads}</div>
                    <div className="text-xs text-slate-400">留资</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="font-bold">{roi}</div>
                    <div className="text-xs text-slate-400">留资/千元</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="btn-ghost text-xs"
                    onClick={() => addMetric(cmp.id)}
                  >
                    + 录入当日指标
                  </button>
                  <button
                    className="btn-primary text-xs"
                    onClick={() => genReview(cmp.id)}
                    disabled={reviewing === cmp.id}
                  >
                    {reviewing === cmp.id
                      ? "生成中…"
                      : cmp.review
                      ? "重新生成复盘"
                      : "生成复盘报告"}
                  </button>
                </div>
                {reviewMap[cmp.id] && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-semibold text-slate-800">
                      {reviewMap[cmp.id]!.summary}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <div>
                        <div className="mb-1 text-xs font-semibold text-emerald-700">
                          亮点
                        </div>
                        <ul className="list-disc space-y-1 pl-4 text-slate-600">
                          {reviewMap[cmp.id]!.highlights.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="mb-1 text-xs font-semibold text-rose-700">
                          问题
                        </div>
                        <ul className="list-disc space-y-1 pl-4 text-slate-600">
                          {reviewMap[cmp.id]!.issues.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="mb-1 text-xs font-semibold text-brand">
                          下一轮建议
                        </div>
                        <ul className="list-disc space-y-1 pl-4 text-slate-600">
                          {reviewMap[cmp.id]!.nextRound.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        {!loading && campaigns.length === 0 && (
          <p className="text-sm text-slate-400">
            创建第一个 Campaign 开始积累效果数据。
          </p>
        )}
      </div>
    </div>
  );
}
