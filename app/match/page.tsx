"use client";

import { useState } from "react";
import { MatchResult } from "@/lib/types";

export default function MatchPage() {
  const [industry, setIndustry] = useState("医美");
  const [budget, setBudget] = useState(5000);
  const [topN, setTopN] = useState(5);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ industry, budget, topN }),
    });
    const d = await r.json();
    setResults(d.results || []);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">博主匹配</h1>

      <div className="card">
        <form onSubmit={run} className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">行业</label>
            <input
              className="input"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>
          <div>
            <label className="label">预算 CAD</label>
            <input
              className="input"
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">返回数量</label>
            <input
              className="input"
              type="number"
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
            填写行业与预算后点击「开始匹配」。
          </p>
        )}
      </div>
    </div>
  );
}
