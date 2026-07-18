import Anthropic from "@anthropic-ai/sdk";
import { BriefInput, StructuredBrief, ContentResult, ReviewResult } from "./types";
import { checkCompliance } from "./compliance";

const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
const client = apiKey ? new Anthropic({ apiKey }) : null;

export function aiEnabled(): boolean {
  return !!client;
}

function extractJson(text: string): any | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function inferNiches(industry: string): string[] {
  const map: Record<string, string[]> = {
    地产: ["地产"],
    医美: ["医美", "护肤"],
    餐饮: ["餐饮", "美食"],
    母婴: ["母婴", "育儿"],
    留学: ["留学", "语言培训"],
    移民: ["移民"],
    保险: ["保险", "理财"],
    理财: ["理财", "保险"],
    旅游: ["旅游"],
  };
  for (const k of Object.keys(map)) {
    if (industry.includes(k)) return map[k];
  }
  return [industry || "生活方式"];
}

function heuristicBrief(input: BriefInput): StructuredBrief {
  const niches = inferNiches(input.industry);
  return {
    objective: `为「${input.industry}」商户在小红书达成：${input.goal}`,
    audiencePackage: [
      input.audience || "多伦多华人",
      "新移民 / 留学生家庭",
      "有本地生活消费需求的用户",
    ],
    contentAngles: [
      `痛点切入：用「${input.sellingPoints}」解决用户真实问题`,
      "场景种草：多伦多本地生活场景展示",
      "信任背书：真实体验 + 数据 / 案例",
    ],
    recommendedCreatorType: `优先选择「${niches.join(
      "、"
    )}」赛道的腰部 KOC（1w–10w 粉丝），性价比高且本地调性强`,
    kpiBreakdown: [
      { metric: "曝光", target: "5k–20k / 篇" },
      { metric: "互动率", target: "≥ 5%" },
      { metric: "留资", target: "依预算与转化路径设定" },
    ],
    notes: "（当前为规则生成；配置 ANTHROPIC_API_KEY 后切换为 AI 生成）",
  };
}

export async function generateBrief(input: BriefInput): Promise<StructuredBrief> {
  if (!client) return heuristicBrief(input);
  try {
    const prompt = `你是小红书营销专家。根据以下商户需求，生成结构化的 Campaign Brief，只输出 JSON（不要代码块）：
{
  "objective": "一句话目标",
  "audiencePackage": ["人群包1","人群包2"],
  "contentAngles": ["内容角度1","内容角度2","内容角度3"],
  "recommendedCreatorType": "推荐博主类型描述",
  "kpiBreakdown": [{"metric":"曝光","target":"目标值"}],
  "notes": "补充建议"
}
商户需求：行业=${input.industry}，目标=${input.goal}，预算CAD=${input.budget}，目标人群=${input.audience}，卖点=${input.sellingPoints}，KPI=${input.kpi}，周期=${input.duration}`;

    const msg = await client.messages.create({
      model,
      max_tokens: 1200,
      system: "你是资深小红书营销策划，输出简洁、可执行的简体中文方案。",
      messages: [{ role: "user", content: prompt }],
    });
    const text =
      msg.content[0]?.type === "text" ? msg.content[0].text : "";
    const parsed = extractJson(text);
    if (!parsed) return heuristicBrief(input);
    return {
      objective: parsed.objective || heuristicBrief(input).objective,
      audiencePackage: parsed.audiencePackage || [],
      contentAngles: parsed.contentAngles || [],
      recommendedCreatorType:
        parsed.recommendedCreatorType || heuristicBrief(input).recommendedCreatorType,
      kpiBreakdown: parsed.kpiBreakdown || [],
      notes: parsed.notes || "",
    };
  } catch {
    return heuristicBrief(input);
  }
}

function heuristicContent(opts: {
  creatorHandle: string;
  niche: string[];
  brief: StructuredBrief;
}): ContentResult {
  const body = `多伦多本地真实体验分享📍\n\n最近被问爆的${opts.niche.join(
    "/"
  )}话题，今天一次说清。\n\n${opts.brief.objective}\n\n#合作 #多伦多生活 #${opts.niche[0] || "本地"}`;
  return {
    title: `${opts.creatorHandle} 的多伦多种草笔记`,
    body,
    tags: ["多伦多生活", "合作", ...opts.niche],
    enVersion: `[Sponsored] Toronto local experience: ${opts.brief.objective}`,
    compliance: checkCompliance(body),
  };
}

export async function generateContent(opts: {
  creatorHandle: string;
  niche: string[];
  brief: StructuredBrief;
}): Promise<ContentResult> {
  const fallback = heuristicContent(opts);
  if (!client) return fallback;
  try {
    const prompt = `为小红书博主${opts.creatorHandle}（赛道：${opts.niche.join(
      "、"
    )}）生成一篇种草笔记，结合以下 Brief。只输出 JSON：
{
  "title": "标题",
  "body": "正文（含换行，结尾带 #合作 与赛道标签）",
  "tags": ["标签1","标签2"],
  "enVersion": "英文本地化版本一句"
}
Brief：${JSON.stringify(opts.brief)}`;

    const msg = await client.messages.create({
      model,
      max_tokens: 1000,
      system:
        "你是小红书种草文案高手，语气真实、口语化、带多伦多本地感，合规标注合作。",
      messages: [{ role: "user", content: prompt }],
    });
    const text =
      msg.content[0]?.type === "text" ? msg.content[0].text : "";
    const parsed = extractJson(text);
    if (!parsed) return fallback;
    return {
      title: parsed.title || fallback.title,
      body: parsed.body || fallback.body,
      tags: parsed.tags || fallback.tags,
      enVersion: parsed.enVersion || fallback.enVersion,
      compliance: checkCompliance(parsed.body || ""),
    };
  } catch {
    return fallback;
  }
}

// ============ FR6 · 复盘报告（v0.4）============

export interface ReviewInput {
  name: string;
  objective: string;
  budgetCAD: number;
  total: { impressions: number; engagements: number; clicks: number; leads: number };
  creators: { handle: string; niche: string[]; followers: number }[];
}

function heuristicReview(input: ReviewInput): ReviewResult {
  const { total, budgetCAD } = input;
  const avgEngagementRate =
    total.impressions > 0 ? total.engagements / total.impressions : 0;
  const costPerLead = total.leads > 0 ? budgetCAD / total.leads : 0;
  const clickRate = total.impressions > 0 ? total.clicks / total.impressions : 0;
  const leadRate = total.clicks > 0 ? total.leads / total.clicks : 0;

  const highlights: string[] = [];
  const issues: string[] = [];
  const nextRound: string[] = [];

  if (total.impressions > 0)
    highlights.push(`累计曝光 ${total.impressions.toLocaleString()}，触达基本达成。`);
  if (avgEngagementRate >= 0.05)
    highlights.push(`平均互动率 ${(avgEngagementRate * 100).toFixed(1)}%，高于 5% 基准，内容本地化较成功。`);
  else if (avgEngagementRate > 0)
    highlights.push(`平均互动率 ${(avgEngagementRate * 100).toFixed(1)}%，有优化空间但已起量。`);

  if (total.leads > 0)
    highlights.push(`获取留资 ${total.leads}，单留资成本约 CAD ${costPerLead.toFixed(0)}。`);
  else issues.push("暂无留资数据，转化路径（表单/微信/到店）需尽快打通。");

  if (avgEngagementRate > 0 && avgEngagementRate < 0.05)
    issues.push("互动率低于 5%，建议加强多伦多本地场景与真实体验感，弱化硬广语气。");
  if (clickRate < 0.01 && total.impressions > 0)
    issues.push("点击率偏低，标题与封面需做 A/B 测试。");
  if (leadRate < 0.1 && total.clicks > 0)
    issues.push("留资转化弱，落地页/优惠钩子（如到店礼）待强化。");
  if (input.creators.length <= 1)
    issues.push("本次博主数量少，样本有限，结论仅供参考，建议下一轮扩到 3–5 位 KOC 交叉验证。");

  nextRound.push(
    `优先复投表现最好的博主（${input.creators.map((c) => c.handle).join("、") || "待补充"}），预算向高 ROI 内容倾斜。`
  );
  nextRound.push(
    avgEngagementRate < 0.05
      ? "下一轮聚焦 2–3 个强场景选题，强化「多伦多本地」标签与真实测评口吻。"
      : "固化已验证的内容角度，拓展 1–2 个相邻赛道做增量。"
  );
  nextRound.push("沉淀本次方法论到知识库，供后续 Campaign 的 RAG 调用，减少重复试错。");

  const summary = `本 Campaign 曝光 ${total.impressions.toLocaleString()}、留资 ${total.leads}、单留资成本 CAD ${costPerLead.toFixed(0)}，整体${
    avgEngagementRate >= 0.05 ? "达成预期" : "需优化内容"
  }。`;

  return {
    summary,
    highlights,
    issues,
    nextRound,
    metricsSummary: {
      impressions: total.impressions,
      engagements: total.engagements,
      clicks: total.clicks,
      leads: total.leads,
      avgEngagementRate,
      costPerLead,
    },
  };
}

export async function generateReview(input: ReviewInput): Promise<ReviewResult> {
  const fallback = heuristicReview(input);
  if (!client) return fallback;
  try {
    const prompt = `你是小红书营销复盘专家。基于以下 Campaign 数据，生成结构化复盘，只输出 JSON（不要代码块）：
{
  "summary": "一句话结论",
  "highlights": ["亮点1","亮点2"],
  "issues": ["问题1","问题2"],
  "nextRound": ["下一轮建议1","下一轮建议2"]
}
Campaign：${JSON.stringify(input)}`;

    const msg = await client.messages.create({
      model,
      max_tokens: 1100,
      system: "你是资深小红书投放复盘分析师，结论要量化、可执行，简体中文。",
      messages: [{ role: "user", content: prompt }],
    });
    const text =
      msg.content[0]?.type === "text" ? msg.content[0].text : "";
    const parsed = extractJson(text);
    if (!parsed) return fallback;
    return {
      ...fallback,
      summary: parsed.summary || fallback.summary,
      highlights: parsed.highlights?.length ? parsed.highlights : fallback.highlights,
      issues: parsed.issues?.length ? parsed.issues : fallback.issues,
      nextRound: parsed.nextRound?.length ? parsed.nextRound : fallback.nextRound,
    };
  } catch {
    return fallback;
  }
}
