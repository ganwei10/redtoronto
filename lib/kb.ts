import { ReviewResult } from "./types";

// 复盘报告知识库（MVP demo 用内存存储）。
// 沉淀每次 Campaign 的复盘，供后续 Brief / 复盘通过 RAG 调用，
// 逐步累积可复制的多伦多本地方法论。
export interface KbEntry {
  id: string;
  campaignId: string;
  campaignName: string;
  review: ReviewResult;
  createdAt: string;
  // 用于 RAG 检索的纯文本片段
  text: string;
}

let entries: KbEntry[] = [];

function toText(e: Omit<KbEntry, "id" | "text" | "createdAt">): string {
  const r = e.review;
  return [
    `Campaign「${e.campaignName}」复盘：`,
    r.summary,
    "亮点：" + r.highlights.join("；"),
    "问题：" + r.issues.join("；"),
    "下一轮建议：" + r.nextRound.join("；"),
  ].join("\n");
}

export function addReview(entry: {
  campaignId: string;
  campaignName: string;
  review: ReviewResult;
}): KbEntry {
  const full: KbEntry = {
    ...entry,
    id: `kb${Date.now()}`,
    createdAt: new Date().toISOString(),
    text: "",
  };
  full.text = toText(entry);
  entries = [full, ...entries];
  return full;
}

export function listReviews(): KbEntry[] {
  return entries;
}

export function getReviewByCampaign(campaignId: string): KbEntry | undefined {
  return entries.find((e) => e.campaignId === campaignId);
}

// 返回知识库全部文本，供 RAG（未来接向量检索）使用
export function getKnowledgeBaseText(): string {
  return entries.map((e) => e.text).join("\n\n---\n\n");
}
