"use client";

import { useState } from "react";
import Link from "next/link";
import { StructuredBrief } from "@/lib/types";

export default function BriefPage() {
  const [form, setForm] = useState({
    industry: "医美",
    goal: "为多伦多医美诊所获取中文用户到店咨询",
    budget: 5000,
    audience: "多伦多华人女性 25-40",
    sellingPoints: "医生资质 + 中文服务 + 多伦多本地",
    kpi: "留资 30/月",
    duration: "1 个月",
  });
  const [brief, setBrief] = useState<StructuredBrief | null>(null);
  const [loading, setLoading] = useState(false);

  async function gen(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    setBrief(d.brief);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Brief 生成</h1>

      <div className="card">
        <form onSubmit={gen} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">行业</label>
            <input
              className="input"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </div>
          <div>
            <label className="label">预算 CAD</label>
            <input
              className="input"
              type="number"
              value={form.budget}
              onChange={(e) =>
                setForm({ ...form, budget: Number(e.target.value) })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">营销目标</label>
            <input
              className="input"
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
            />
          </div>
          <div>
            <label className="label">目标人群</label>
            <input
              className="input"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
            />
          </div>
          <div>
            <label className="label">核心卖点</label>
            <input
              className="input"
              value={form.sellingPoints}
              onChange={(e) =>
                setForm({ ...form, sellingPoints: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">KPI</label>
            <input
              className="input"
              value={form.kpi}
              onChange={(e) => setForm({ ...form, kpi: e.target.value })}
            />
          </div>
          <div>
            <label className="label">周期</label>
            <input
              className="input"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "生成中…" : "AI 生成 Brief"}
            </button>
          </div>
        </form>
      </div>

      {brief && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">结构化 Brief</h3>
            <Link href="/match" className="btn-ghost text-xs">
              去匹配博主 →
            </Link>
          </div>
          <div>
            <div className="label">目标</div>
            <p className="text-sm">{brief.objective}</p>
          </div>
          <div>
            <div className="label">人群包</div>
            <ul className="list-disc pl-5 text-sm">
              {brief.audiencePackage.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="label">内容角度</div>
            <ul className="list-disc pl-5 text-sm">
              {brief.contentAngles.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="label">推荐博主类型</div>
            <p className="text-sm">{brief.recommendedCreatorType}</p>
          </div>
          <div>
            <div className="label">KPI 拆分</div>
            <ul className="list-disc pl-5 text-sm">
              {brief.kpiBreakdown.map((k, i) => (
                <li key={i}>
                  {k.metric}：{k.target}
                </li>
              ))}
            </ul>
          </div>
          {brief.notes && (
            <p className="text-xs text-slate-400">{brief.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
