import { prisma } from "./prisma";
import { ReviewResult } from "./types";

// 复盘报告知识库（持久化到 Postgres，供后续 RAG 检索）。
export interface KbEntry {
  id: string;
  campaignId: string;
  campaignName: string;
  review: ReviewResult;
  createdAt: string;
  text: string;
}

function toText(e: { campaignName: string; review: ReviewResult }): string {
  const r = e.review;
  return [
    `Campaign「${e.campaignName}」复盘：`,
    r.summary,
    "亮点：" + r.highlights.join("；"),
    "问题：" + r.issues.join("；"),
    "下一轮建议：" + r.nextRound.join("；"),
  ].join("\n");
}

export async function addReview(entry: {
  campaignId: string;
  campaignName: string;
  review: ReviewResult;
}): Promise<KbEntry> {
  const text = toText(entry);
  const row = await prisma.knowledgeEntry.create({
    data: {
      campaignId: entry.campaignId,
      campaignName: entry.campaignName,
      review: entry.review as any,
      text,
    },
  });
  return {
    id: row.id,
    campaignId: row.campaignId,
    campaignName: row.campaignName,
    review: row.review as unknown as ReviewResult,
    createdAt: row.createdAt.toISOString(),
    text: row.text,
  };
}

export async function listReviews(): Promise<KbEntry[]> {
  const rows = await prisma.knowledgeEntry.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((r) => ({
    id: r.id,
    campaignId: r.campaignId,
    campaignName: r.campaignName,
    review: r.review as unknown as ReviewResult,
    createdAt: r.createdAt.toISOString(),
    text: r.text,
  }));
}

export async function getReviewByCampaign(campaignId: string): Promise<KbEntry | null> {
  const r = await prisma.knowledgeEntry.findFirst({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
  });
  if (!r) return null;
  return {
    id: r.id,
    campaignId: r.campaignId,
    campaignName: r.campaignName,
    review: r.review as unknown as ReviewResult,
    createdAt: r.createdAt.toISOString(),
    text: r.text,
  };
}
