"use client";

import { useEffect, useState } from "react";
import { Creator, ContentResult } from "@/lib/types";

export default function ContentPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [creatorId, setCreatorId] = useState("");
  const [industry, setIndustry] = useState("医美");
  const [goal, setGoal] = useState("为多伦多医美诊所获取咨询");
  const [result, setResult] = useState<ContentResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/creators")
      .then((r) => r.json())
      .then((d) => {
        setCreators(d.creators);
        if (d.creators[0]) setCreatorId(d.creators[0].id);
      });
  }, []);

  async function gen(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const brief = {
      objective: `${industry}：${goal}`,
      audiencePackage: [],
      contentAngles: [],
      recommendedCreatorType: "",
      kpiBreakdown: [],
      notes: "",
    };
    const r = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId, brief }),
    });
    const d = await r.json();
    setResult(d.result);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">内容创作工作台</h1>
        <p className="mt-1 text-sm text-slate-500">
          选定博主与营销目标，AI 一键生成种草文案、英文本地化版本，并自动完成合规校验。
        </p>
      </div>

      <div className="card">
        <form onSubmit={gen} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">选择博主</label>
            <select
              className="input"
              value={creatorId}
              onChange={(e) => setCreatorId(e.target.value)}
            >
              {creators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.handle}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">行业</label>
            <input
              className="input"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">营销目标</label>
            <input
              className="input"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "生成中…" : "生成内容草稿"}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="card space-y-4">
          <h3 className="font-semibold">{result.title}</h3>
          <div>
            <div className="label">正文</div>
            <p className="whitespace-pre-wrap text-sm">{result.body}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {result.tags.map((t, i) => (
              <span key={i} className="tag">
                #{t}
              </span>
            ))}
          </div>
          <div>
            <div className="label">英文本地化</div>
            <p className="text-sm text-slate-500">{result.enVersion}</p>
          </div>
          <div>
            <div className="label">合规校验</div>
            {result.compliance.length === 0 ? (
              <p className="text-sm text-green-600">✓ 未发现违禁词，已含合作披露</p>
            ) : (
              <ul className="list-disc pl-5 text-sm text-amber-600">
                {result.compliance.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
