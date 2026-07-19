"use client";

import { useEffect, useRef, useState } from "react";
import { Creator } from "@/lib/types";
import { validateCreatorInput } from "@/lib/validation";

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
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    setFormError(null);
    const { ok, errors } = validateCreatorInput({
      ...form,
      followers: form.followers === "" ? NaN : Number(form.followers),
      engagementRate: form.engagementRate === "" ? NaN : Number(form.engagementRate),
      rateCAD: form.rateCAD === "" ? NaN : Number(form.rateCAD),
    });
    if (!ok) {
      setFormError(Object.values(errors)[0]);
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/creators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        followers: Number(form.followers),
        engagementRate: Number(form.engagementRate) / 100,
        rateCAD: Number(form.rateCAD),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setFormError(d.error || "提交失败，请检查输入");
      return;
    }
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">博主库</h1>
        <p className="mt-1 text-sm text-slate-500">
          管理多伦多本地博主资源：维护账号、粉丝规模、互动率、报价与接单状态，支持批量导入与智能匹配。
        </p>
      </div>

      <div className="card">
        <h3 className="mb-1 font-semibold">批量导入博主</h3>
        <p className="mb-3 text-xs text-slate-500">
          支持粘贴 CSV / JSON（数组）。表头兼容中英文：账号/昵称、粉丝/粉丝量、互动率、
          赛道/标签、城市、报价、可接单、备注。赛道与案例用
          <code className="mx-1 rounded bg-slate-100 px-1">|</code>或逗号分隔；互动率填百分比（如 5.8）。
          系统将自动按账号去重，并拦截负值等非法数据。
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
            {importing ? "导入中…" : "开始导入"}
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
          <span className="text-xs text-slate-400">支持 CSV 或 JSON 文件</span>
        </div>

        {importResult && (
          <div className="mt-3 space-y-1 text-sm">
            <p className="text-green-600">
              成功导入 {importResult.added} 位（共解析 {importResult.total} 行）
            </p>
            {importResult.skipped.length > 0 && (
              <p className="text-amber-600">
                跳过重复 {importResult.skipped.length} 位：
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
        {formError && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {formError}
          </div>
        )}
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">小红书账号 <span className="text-red-500">*</span></label>
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
              min={0}
              step={1}
              value={form.followers}
              onChange={(e) => setForm({ ...form, followers: e.target.value })}
            />
          </div>
          <div>
            <label className="label">互动率（%）</label>
            <input
              className="input"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={form.engagementRate}
              onChange={(e) =>
                setForm({ ...form, engagementRate: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">赛道（逗号分隔）</label>
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
            <label className="label">报价（CAD）</label>
            <input
              className="input"
              type="number"
              min={0}
              step={1}
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
              placeholder="选填，例如：本地探店 KOC、粉丝精准"
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.availability}
                onChange={(e) => setForm({ ...form, availability: e.target.checked })}
              />
              当前可接单
            </label>
          </div>
          <div className="sm:col-span-3">
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "提交中…" : "保存博主"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="mb-3 font-semibold">博主列表（共 {creators.length} 位）</h3>
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
