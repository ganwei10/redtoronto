"use client";

import { useEffect, useState } from "react";
import { Campaign, Creator, ReviewResult } from "@/lib/types";
import { validateCampaignInput, validateMetricInput } from "@/lib/validation";

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
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewMap, setReviewMap] = useState<Record<string, ReviewResult | null>>({});
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [metricFor, setMetricFor] = useState<string | null>(null);
  const [metricForm, setMetricForm] = useState({ impressions: "", engagements: "", clicks: "", leads: "" });
  const [metricError, setMetricError] = useState<string | null>(null);

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
    setFormError(null);
    const { ok, errors, value } = validateCampaignInput(form);
    if (!ok) {
      setFormError(Object.values(errors)[0]);
      return;
    }
    await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    setForm({ ...form, name: "", creatorIds: [] });
    load();
  }

  function openMetric(id: string) {
    setMetricFor(id);
    setMetricForm({ impressions: "", engagements: "", clicks: "", leads: "" });
    setMetricError(null);
  }

  async function submitMetric(id: string) {
    setMetricError(null);
    const { ok, errors, value } = validateMetricInput({
      impressions: metricForm.impressions === "" ? NaN : Number(metricForm.impressions),
      engagements: metricForm.engagements === "" ? NaN : Number(metricForm.engagements),
      clicks: metricForm.clicks === "" ? NaN : Number(metricForm.clicks),
      leads: metricForm.leads === "" ? NaN : Number(metricForm.leads),
    });
    if (!ok) {
      setMetricError(Object.values(errors)[0]);
      return;
    }
    const res = await fetch(`/api/campaigns/${id}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMetricError(d.error || "提交失败");
      return;
    }
    setMetricFor(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Campaign 与效果看板</h1>
        <p className="mt-1 text-sm text-slate-500">
          创建营销活动、绑定博主与 Brief，录入每日效果数据，系统自动计算曝光、互动、留资与单留资成本等核心指标。
        </p>
      </div>

      <div className="card">
        <h3 className="mb-3 font-semibold">新建 Campaign</h3>
        {formError && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {formError}
          </div>
        )}
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">活动名称 <span className="text-red-500">*</span></label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例如：多伦多医美春季种草"
              required
            />
          </div>
          <div>
            <label className="label">预算（CAD）<span className="text-red-500">*</span></label>
            <input
              className="input"
              type="number"
              min={0}
              step={100}
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
            <label className="label">营销目标</label>
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
                    预算 CAD {cmp.budgetCAD} · {cmp.creatorIds.length} 位博主
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
                    <div className="text-xs text-slate-400">留资 / 千元</div>
                  </div>
                </div>

                {metricFor === cmp.id ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    {metricError && (
                      <div className="mb-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600">
                        {metricError}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(["impressions", "engagements", "clicks", "leads"] as const).map((k) => (
                        <div key={k}>
                          <label className="label">{LABEL[k]}</label>
                          <input
                            className="input"
                            type="number"
                            min={0}
                            step={1}
                            value={(metricForm as any)[k]}
                            onChange={(e) => setMetricForm({ ...metricForm, [k]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button className="btn-primary text-xs" onClick={() => submitMetric(cmp.id)}>
                        保存数据
                      </button>
                      <button className="btn-ghost text-xs" onClick={() => setMetricFor(null)}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button className="btn-ghost text-xs" onClick={() => openMetric(cmp.id)}>
                      + 录入效果数据
                    </button>
                    <button
                      className="btn-primary text-xs"
                      onClick={() => genReview(cmp.id)}
                      disabled={reviewing === cmp.id}
                    >
                      {reviewing === cmp.id ? "生成中…" : cmp.review ? "重新生成复盘" : "生成复盘报告"}
                    </button>
                  </div>
                )}

                {reviewMap[cmp.id] && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-semibold text-slate-800">
                      {reviewMap[cmp.id]!.summary}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <div>
                        <div className="mb-1 text-xs font-semibold text-emerald-700">亮点</div>
                        <ul className="list-disc space-y-1 pl-4 text-slate-600">
                          {reviewMap[cmp.id]!.highlights.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="mb-1 text-xs font-semibold text-rose-700">问题</div>
                        <ul className="list-disc space-y-1 pl-4 text-slate-600">
                          {reviewMap[cmp.id]!.issues.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="mb-1 text-xs font-semibold text-brand">下一轮建议</div>
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
            创建首个 Campaign，开始积累效果数据与复盘方法论。
          </p>
        )}
      </div>
    </div>
  );
}

const LABEL: Record<string, string> = {
  impressions: "曝光量",
  engagements: "互动量",
  clicks: "点击量",
  leads: "留资量",
};
