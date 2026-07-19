"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRequestPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    industry: "",
    goal: "",
    budget: "",
    audience: "",
    sellingPoints: "",
    kpi: "",
    duration: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<any>(null);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/merchant/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, budget: Number(form.budget) || 0 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "提交失败");
      if (data.fields) {
        const first = Object.values(data.fields as Record<string, string>)[0];
        if (first) setError(first);
      }
      setLoading(false);
      return;
    }
    setBrief(data.brief);
    setLoading(false);
  }

  if (brief) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900">需求已提交，Brief 已生成</h1>
        <div className="card space-y-3 text-sm">
          <div>
            <div className="label">营销目标</div>
            <p className="text-slate-700">{brief.objective}</p>
          </div>
          <div>
            <div className="label">推荐人群包</div>
            <ul className="list-disc pl-5 text-slate-700">
              {brief.audiencePackage?.map((a: string, i: number) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="label">内容角度</div>
            <ul className="list-disc pl-5 text-slate-700">
              {brief.contentAngles?.map((a: string, i: number) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="label">推荐博主类型</div>
            <p className="text-slate-700">{brief.recommendedCreatorType}</p>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          运营方审核后将为你匹配博主并启动投放，进度可在「我的工作台」查看。
        </p>
        <div className="flex gap-3">
          <button className="btn-primary" onClick={() => router.push("/merchant")}>
            返回我的工作台
          </button>
          <button className="btn-ghost" onClick={() => router.push("/merchant/requests/new")}>
            再提交一个
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">提交营销需求</h1>
        <p className="mt-1 text-sm text-slate-500">
          填写你的业务信息，系统将自动生成结构化 Campaign Brief 并创建 Campaign 草稿。
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-3">
        <div>
          <label className="label">行业 / 品类 *</label>
          <input
            className="input"
            value={form.industry}
            onChange={(e) => set("industry", e.target.value)}
            required
            placeholder="如：餐饮 / 留学 / 地产 / 医美"
          />
        </div>
        <div>
          <label className="label">营销目标</label>
          <input
            className="input"
            value={form.goal}
            onChange={(e) => set("goal", e.target.value)}
            placeholder="如：提升多伦多门店到店量"
          />
        </div>
        <div>
          <label className="label">预算（CAD）</label>
          <input
            className="input"
            type="number"
            min={0}
            value={form.budget}
            onChange={(e) => set("budget", e.target.value)}
            placeholder="如：5000"
          />
        </div>
        <div>
          <label className="label">目标人群</label>
          <input
            className="input"
            value={form.audience}
            onChange={(e) => set("audience", e.target.value)}
            placeholder="如：多伦多新移民家庭"
          />
        </div>
        <div>
          <label className="label">核心卖点</label>
          <input
            className="input"
            value={form.sellingPoints}
            onChange={(e) => set("sellingPoints", e.target.value)}
            placeholder="如：正宗川味、免费配送"
          />
        </div>
        <div>
          <label className="label">KPI 期望</label>
          <input
            className="input"
            value={form.kpi}
            onChange={(e) => set("kpi", e.target.value)}
            placeholder="如：留资 50+、曝光 5w"
          />
        </div>
        <div>
          <label className="label">投放周期</label>
          <input
            className="input"
            value={form.duration}
            onChange={(e) => set("duration", e.target.value)}
            placeholder="如：4 周"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "提交中…" : "提交需求并生成 Brief"}
        </button>
      </form>
    </div>
  );
}
