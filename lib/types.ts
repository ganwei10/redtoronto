export interface Creator {
  id: string;
  handle: string;
  platformId?: string;
  followers: number;
  engagementRate: number; // 0-1
  niche: string[];
  city: string;
  rateCAD: number;
  availability: boolean;
  pastCases: string[];
  note?: string;
}

export interface Merchant {
  id: string;
  name: string;
  industry: string;
  contact: string;
  email?: string;
  userId?: string;
}

export interface BriefInput {
  industry: string;
  goal: string;
  budget: number; // CAD
  audience: string;
  sellingPoints: string;
  kpi: string;
  duration: string;
}

export interface StructuredBrief {
  objective: string;
  audiencePackage: string[];
  contentAngles: string[];
  recommendedCreatorType: string;
  kpiBreakdown: { metric: string; target: string }[];
  notes: string;
}

export interface MatchResult {
  creator: Creator;
  score: number; // 0-100
  reasons: string[];
}

export interface Metric {
  date: string;
  impressions: number;
  engagements: number;
  clicks: number;
  leads: number;
}

export interface Campaign {
  id: string;
  name: string;
  brief: StructuredBrief;
  creatorIds: string[];
  status: string;
  budgetCAD: number;
  metrics: Metric[];
  review?: ReviewResult; // FR6 复盘报告（v0.4）
}

export interface ReviewResult {
  summary: string; // 一句话结论
  highlights: string[]; // 亮点
  issues: string[]; // 问题
  nextRound: string[]; // 下一轮建议
  metricsSummary?: {
    impressions: number;
    engagements: number;
    clicks: number;
    leads: number;
    avgEngagementRate: number; // 0-1
    costPerLead: number; // CAD
  };
}

export interface ContentResult {
  title: string;
  body: string;
  tags: string[];
  enVersion: string;
  compliance: string[];
}
