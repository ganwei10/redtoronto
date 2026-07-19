"use client";

import { useState } from "react";
import { MatchResult } from "@/lib/types";
import { validateMatchInput } from "@/lib/validation";

export default function MatchPage() {
  const [industry, setIndustry] = useState("医美");
  const [budget, setBudget] = useState(5000);
  const [topN, setTopN] = useState(5);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { ok, errors } = validateMatchInput({ industry, budget, topN });
    if (!ok) {
      setError(Object.values(errors)[0]);
      return;
    }
    setLoading(true);
    const r = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ industry, budget, topN }),
    });
    setLoading(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "匹配失败，请稍后重试");
      return;
    }
    const d = await r.json();
    setResults(d.results || []);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">博主智能匹配</h1>
        <p className="mt-1 text-sm text-slate-500">
          依据行业赛道、预算与城市，按赛道重合度、互动率、报价匹配度与接单状态综合打分，输出 Top-N 推荐及匹配理由。
        </p>
      </div>

      <div className="card">
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
        <form onSubmit={run} className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">行业 <span className="text-red-500">*</span></label>
            <input
              className="input"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>
          <div>
            <label className="label">预算（CAD）<span className="text-red-500">*</span></label>
            <input
              className="input"
              type="number"
              min={0}
              step={100}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">返回数量</label>
            <input
              className="input"
              type="number"
              min={1}
              max={50}
              step={1}
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
            />
          </div>
          <div className="sm:col-span-3">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "匹配中…" : "开始匹配"}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {results.map((r) => (
          <div key={r.creator.id} className="card">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{r.creator.handle}</div>
              <div className="text-sm text-brand">匹配分 {r.score}</div>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-brand"
                style={{ width: `${r.score}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {r.creator.niche.map((n) => (
                <span key={n} className="tag">
                  {n}
                </span>
              ))}
              <span className="tag">
                CAD {r.creator.rateCAD} · {(r.creator.engagementRate * 100).toFixed(1)}%
              </span>
            </div>
            <ul className="mt-2 list-disc pl-5 text-xs text-slate-500">
              {r.reasons.map((rs, i) => (
                <li key={i}>{rs}</li>
              ))}
            </ul>
          </div>
        ))}
        {!loading && results.length === 0 && (
          <p className="text-sm text-slate-400">
            填写行业与预算后点击「开始匹配」，系统将推荐最合适的博主。
          </p>
        )}
      </div>
    </div>
  );
}
