import { Creator, Merchant, Campaign, Metric, ReviewResult } from "./types";
import creatorsSeed from "@/data/creators.json";
import merchantsSeed from "@/data/merchants.json";

// 内存数据存储（MVP demo 用，零外部依赖即可运行）。
// 生产环境可平滑替换为 Prisma + Postgres（见 prisma/schema.prisma 与 README）。
let creators: Creator[] = (creatorsSeed as Creator[]).map((c, i) => ({
  ...c,
  id: c.id || `c${i + 1}`,
}));

let merchants: Merchant[] = (merchantsSeed as Merchant[]).map((m, i) => ({
  ...m,
  id: m.id || `m${i + 1}`,
}));

let campaigns: Campaign[] = [];

export function listCreators(): Creator[] {
  return creators;
}

export function getCreator(id: string): Creator | undefined {
  return creators.find((c) => c.id === id);
}

export function addCreator(c: Omit<Creator, "id">): Creator {
  const nc: Creator = { ...c, id: `c${Date.now()}` };
  creators = [...creators, nc];
  return nc;
}

export function updateCreator(
  id: string,
  patch: Partial<Creator>
): Creator | undefined {
  creators = creators.map((c) => (c.id === id ? { ...c, ...patch } : c));
  return getCreator(id);
}

export function listMerchants(): Merchant[] {
  return merchants;
}

export function addMerchant(m: Omit<Merchant, "id">): Merchant {
  const nm: Merchant = { ...m, id: `m${Date.now()}` };
  merchants = [...merchants, nm];
  return nm;
}

export function listCampaigns(): Campaign[] {
  return campaigns;
}

export function getCampaign(id: string): Campaign | undefined {
  return campaigns.find((c) => c.id === id);
}

export function addCampaign(
  c: Omit<Campaign, "id" | "metrics">
): Campaign {
  const nc: Campaign = { ...c, id: `cmp${Date.now()}`, metrics: [] };
  campaigns = [...campaigns, nc];
  return nc;
}

export function addMetric(id: string, metric: Metric): Campaign | undefined {
  campaigns = campaigns.map((c) =>
    c.id === id ? { ...c, metrics: [...c.metrics, metric] } : c
  );
  return getCampaign(id);
}

export function saveReview(id: string, review: ReviewResult): Campaign | undefined {
  campaigns = campaigns.map((c) => (c.id === id ? { ...c, review } : c));
  return getCampaign(id);
}
