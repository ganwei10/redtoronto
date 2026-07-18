"use client";

import { useEffect, useRef, useState } from "react";
import { Creator } from "@/lib/types";

type ImportResult = {
  total: number;
  added: number;
  skipped: string[];
  errors: { row: number; reason: string }[];
};

const SAMPLE_CSV = `handle,followers,engagementRate,niche,city,rateCAD,availability,note
@多伦多小鹿,23500,5.8,医美|护肤,多伦多,480,是,本地探店KOC
@TorontoEats,51200,4.2,餐饮|探店,多伦多,650,是,美食号
@留学姐在多大,8900,7.1,留学|移民,多伦多,300,否,粉丝精准`;

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

  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function runImport() {
    if (!importText.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const r = await fetch("/api/creators/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: importText }),
      });
      const d = await r.json();
      setImportResult(d);
      load();
    } finally {
      setImporting(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result || ""));
    reader.readAsText(f);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">博主库</h1>

      <div className="card">
        <h3 className="mb-1 font-semibold">批量导入</h3>
        <p className="mb-3 text-xs text-slate-500">
          支持粘贴 CSV / JSON（数组）。表头兼容中英文：账号/昵称、粉丝/粉丝量、互动率、
          赛道/标签、城市、报价、可接单、备注。赛道与案例用
          <code className="mx-1 rounded bg-slate-100 px-1">|</code>或逗号分隔；互动率填百分比（如 5.8）。
          按账号自动去重。
        </p>
        <textarea
          className="input h-40 w-full font-mono text-xs"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={'handle,followers,engagementRate,niche,city,rateCAD,availability\n@多伦多小鹿,23500,5.8,医美|护肤,多伦多,480,是'}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            className="btn-primary"
            onClick={runImport}
            disabled={importing || !importText.trim()}
          >
            {importing ? "导入中…" : "导入"}
          </button>
          <button
            className="btn-ghost text-xs"
            onClick={() => setImportText(SAMPLE_CSV)}
          >
            填入示例
          </button>
          <button
            className="btn-ghost text-xs"
            onClick={() => fileRef.current?.click()}
          >
            上传文件
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="hidden"
            onChange={onFile}
          />
          <span className="text-xs text-slate-400">CSV 或 JSON 文件</span>
        </div>

        {importResult && (
          <div className="mt-3 space-y-1 text-sm">
            <p className="text-green-600">
              成功导入 {importResult.added} 个（共解析 {importResult.total} 行）
            </p>
            {importResult.skipped.length > 0 && (
              <p className="text-amber-600">
                跳过重复 {importResult.skipped.length} 个：
                {importResult.skipped.join("、")}
              </p>
            )}
            {importResult.errors.length > 0 && (
              <p className="text-red-600">
                失败 {importResult.errors.length} 行：
                {importResult.errors
                  .map((e) => `第${e.row}行 ${e.reason}`)
                  .join("；")}
              </p>
            )}
          </div>
        )}
      </div>

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
