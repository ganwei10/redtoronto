"use client";

import { useEffect, useState } from "react";
import { Creator } from "@/lib/types";

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    handle: "",
    followers: "",
    engagementRate: "",
    niche: "",
    city: "多伦多",
    rateCAD: "",
    availability: true,
    note: "",
  });

  async function load() {
    const r = await fetch("/api/creators");
    const d = await r.json();
    setCreators(d.creators);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/creators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        followers: Number(form.followers),
        engagementRate: Number(form.engagementRate) / 100,
        rateCAD: Number(form.rateCAD),
      }),
    });
    setForm({
      handle: "",
      followers: "",
      engagementRate: "",
      niche: "",
      city: "多伦多",
      rateCAD: "",
      availability: true,
      note: "",
    });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">博主库</h1>

      <div className="card">
        <h3 className="mb-3 font-semibold">新增博主</h3>
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">账号</label>
            <input
              className="input"
              value={form.handle}
              onChange={(e) => setForm({ ...form, handle: e.target.value })}
              placeholder="@昵称"
              required
            />
          </div>
          <div>
            <label className="label">粉丝量</label>
            <input
              className="input"
              type="number"
              value={form.followers}
              onChange={(e) => setForm({ ...form, followers: e.target.value })}
            />
          </div>
          <div>
            <label className="label">互动率(%)</label>
            <input
              className="input"
              type="number"
              step="0.1"
              value={form.engagementRate}
              onChange={(e) =>
                setForm({ ...form, engagementRate: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">赛道(逗号分隔)</label>
            <input
              className="input"
              value={form.niche}
              onChange={(e) => setForm({ ...form, niche: e.target.value })}
              placeholder="医美,护肤"
            />
          </div>
          <div>
            <label className="label">城市</label>
            <input
              className="input"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div>
            <label className="label">报价 CAD</label>
            <input
              className="input"
              type="number"
              value={form.rateCAD}
              onChange={(e) => setForm({ ...form, rateCAD: e.target.value })}
            />
          </div>
          <div className="sm:col-span-3">
            <label className="label">备注</label>
            <input
              className="input"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <div className="sm:col-span-3">
            <button className="btn-primary" type="submit">
              添加博主
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="mb-3 font-semibold">博主列表（{creators.length}）</h3>
        {loading ? (
          <p className="text-sm text-slate-400">加载中…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2">账号</th>
                  <th>粉丝</th>
                  <th>互动率</th>
                  <th>赛道</th>
                  <th>城市</th>
                  <th>报价</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="py-2 font-medium">{c.handle}</td>
                    <td>{(c.followers / 1000).toFixed(1)}k</td>
                    <td>{(c.engagementRate * 100).toFixed(1)}%</td>
                    <td>
                      {c.niche.map((n) => (
                        <span key={n} className="tag mr-1">
                          {n}
                        </span>
                      ))}
                    </td>
                    <td>{c.city}</td>
                    <td>CAD {c.rateCAD}</td>
                    <td>
                      {c.availability ? (
                        <span className="text-green-600">可接单</span>
                      ) : (
                        <span className="text-slate-400">档期紧</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
