"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReviewResult } from "@/lib/types";

interface KbEntry {
  id: string;
  campaignId: string;
  campaignName: string;
  review: ReviewResult;
  createdAt: string;
}

export default function KbPage() {
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/kb")
      .then((x) => x.json())
      .then((d) => setEntries(d.entries))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">复盘知识库</h1>
        <p className="mt-1 text-sm text-slate-500">
          每次 Campaign 的复盘自动沉淀于此，未来可作为 RAG 语料，供 Brief / 复盘生成调用，逐步累积可复制的多伦多本地方法论。
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">加载中…</p>
      ) : entries.length === 0 ? (
        <div className="card text-sm text-slate-400">
          暂无沉淀。在 <Link href="/campaigns" className="text-brand underline">Campaign 看板</Link> 中点击「生成复盘报告」即可沉淀首条方法论。
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div key={e.id} className="card">
              <div className="flex items-center justify-between">
                <Link
                  href={`/campaigns`}
                  className="font-semibold text-brand"
                >
                  {e.campaignName}
                </Link>
                <span className="text-xs text-slate-400">
                  {new Date(e.createdAt).toLocaleString("zh-CN")}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{e.review.summary}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3 text-sm">
                <div>
                  <div className="text-xs font-semibold text-emerald-700">亮点</div>
                  <ul className="list-disc pl-4 text-slate-600">
                    {e.review.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold text-rose-700">问题</div>
                  <ul className="list-disc pl-4 text-slate-600">
                    {e.review.issues.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold text-brand">下一轮建议</div>
                  <ul className="list-disc pl-4 text-slate-600">
                    {e.review.nextRound.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
