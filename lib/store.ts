import { prisma } from "./prisma";
import { normalizeCreatorRow } from "./importCreators";
import { generateBrief } from "./ai";
import type { Creator, Merchant, Campaign, Metric, ReviewResult, StructuredBrief, BriefInput } from "./types";

// 生产数据存储：Prisma + Postgres（异步）。
// 所有读写经此模块，便于后续切换数据库或加缓存。

// ---------------- 博主 ----------------
export async function listCreators(): Promise<Creator[]> {
  return (await prisma.creator.findMany({ orderBy: { createdAt: "desc" } })) as unknown as Creator[];
}

export async function getCreator(id: string): Promise<Creator | null> {
  return (await prisma.creator.findUnique({ where: { id } })) as unknown as Creator | null;
}

export async function addCreator(c: Omit<Creator, "id">): Promise<Creator> {
  const nc = await prisma.creator.create({
    data: { ...c, handle: c.handle.replace(/^@/, "").trim(), embedding: [] },
  });
  return nc as unknown as Creator;
}

export async function updateCreator(
  id: string,
  patch: Partial<Creator>
): Promise<Creator | null> {
  const nc = await prisma.creator.update({ where: { id }, data: patch as any });
  return nc as unknown as Creator;
}

// 批量导入：解析后的行 → 归一化 → 按 handle 去重（库存 + 批内）→ 入库
export async function importCreators(rows: Record<string, string>[]): Promise<{
  added: Creator[];
  skipped: string[];
  errors: { row: number; reason: string }[];
}> {
  const added: Creator[] = [];
  const skipped: string[] = [];
  const errors: { row: number; reason: string }[] = [];
  const norm = (h: string) => h.replace(/^@/, "").trim().toLowerCase();
  const existing = await prisma.creator.findMany({ select: { handle: true } });
  const seen = new Set(existing.map((c) => norm(c.handle)));
  for (let i = 0; i < rows.length; i++) {
    const { creator, error } = normalizeCreatorRow(rows[i]);
    if (error || !creator) {
      errors.push({ row: i + 1, reason: error || "未知错误" });
      continue;
    }
    const key = creator.handle.toLowerCase();
    if (seen.has(key)) {
      skipped.push(creator.handle);
      continue;
    }
    seen.add(key);
    const nc = await prisma.creator.create({ data: { ...creator, embedding: [] } });
    added.push(nc as unknown as Creator);
  }
  return { added, skipped, errors };
}

// ---------------- 商户 ----------------
export async function listMerchants(): Promise<Merchant[]> {
  return (await prisma.merchant.findMany()) as unknown as Merchant[];
}

export async function getMerchant(id: string): Promise<Merchant | null> {
  return (await prisma.merchant.findUnique({ where: { id } })) as unknown as Merchant | null;
}

export async function getMerchantByUserId(userId: string): Promise<Merchant | null> {
  return (await prisma.merchant.findFirst({ where: { userId } })) as unknown as Merchant | null;
}

export async function addMerchant(m: Omit<Merchant, "id">): Promise<Merchant> {
  const nm = await prisma.merchant.create({ data: m as any });
  return nm as unknown as Merchant;
}

// ---------------- 商户需求（v1.0）----------------
export interface RequestInput {
  industry: string;
  goal: string;
  budget: number;
  audience: string;
  sellingPoints: string;
  kpi: string;
  duration: string;
}

export async function createRequest(
  merchantId: string,
  input: RequestInput
): Promise<{ requestId: string; campaignId: string; brief: StructuredBrief }> {
  const briefInput: BriefInput = {
    industry: input.industry,
    goal: input.goal,
    budget: input.budget,
    audience: input.audience,
    sellingPoints: input.sellingPoints,
    kpi: input.kpi,
    duration: input.duration,
  };
  const brief = await generateBrief(briefInput);
  const req = await prisma.merchantRequest.create({
    data: {
      merchantId,
      industry: input.industry,
      goal: input.goal,
      budget: input.budget,
      audience: input.audience,
      sellingPoints: input.sellingPoints,
      kpi: input.kpi,
      duration: input.duration,
      brief: brief as any,
    },
  });
  const campaign = await prisma.campaign.create({
    data: {
      name: `${input.industry} · ${new Date().toLocaleDateString("zh-CN")}`,
      merchantId,
      brief: brief as any,
      creatorIds: [],
      status: "brief_ready",
      budgetCAD: input.budget,
      requestId: req.id,
    },
  });
  return { requestId: req.id, campaignId: campaign.id, brief };
}

export async function listRequests(): Promise<any[]> {
  return prisma.merchantRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { merchant: true, campaign: true },
  });
}

export async function listRequestsByMerchant(merchantId: string): Promise<any[]> {
  return prisma.merchantRequest.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    include: { campaign: true },
  });
}

export async function getRequest(id: string): Promise<any | null> {
  return prisma.merchantRequest.findUnique({
    where: { id },
    include: { merchant: true, campaign: true },
  });
}

export async function acceptRequest(id: string): Promise<void> {
  await prisma.merchantRequest.update({
    where: { id },
    data: { status: "reviewed" },
  });
}

// ---------------- Campaign ----------------
export async function listCampaigns(merchantId?: string): Promise<Campaign[]> {
  return (await prisma.campaign.findMany({
    where: merchantId ? { merchantId } : {},
    orderBy: { createdAt: "desc" },
    include: { metrics: { orderBy: { date: "asc" } } },
  })) as unknown as Campaign[];
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  return (await prisma.campaign.findUnique({
    where: { id },
    include: { metrics: { orderBy: { date: "asc" } } },
  })) as unknown as Campaign | null;
}

export async function addCampaign(c: {
  name: string;
  brief: StructuredBrief;
  creatorIds: string[];
  budgetCAD: number;
  status?: string;
  merchantId?: string | null;
  requestId?: string | null;
}): Promise<Campaign> {
  const nc = await prisma.campaign.create({
    data: {
      name: c.name,
      brief: (c.brief ?? {}) as any,
      creatorIds: c.creatorIds,
      budgetCAD: c.budgetCAD,
      status: c.status || "draft",
      merchantId: c.merchantId ?? null,
      requestId: c.requestId ?? null,
    },
    include: { metrics: true },
  });
  return nc as unknown as Campaign;
}

export async function addMetric(id: string, metric: Metric): Promise<Campaign | null> {
  await prisma.metric.create({
    data: {
      campaignId: id,
      date: new Date(metric.date),
      impressions: metric.impressions,
      engagements: metric.engagements,
      clicks: metric.clicks,
      leads: metric.leads,
    },
  });
  return getCampaign(id);
}

export async function saveReview(id: string, review: ReviewResult): Promise<Campaign | null> {
  const nc = await prisma.campaign.update({
    where: { id },
    data: { review: review as any, status: "reviewed" },
    include: { metrics: true },
  });
  return nc as unknown as Campaign;
}

// ---------------- 用户 ----------------
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
  role: string;
}) {
  return prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role,
    },
  });
}
