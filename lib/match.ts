import { Creator, MatchResult } from "./types";

// 启发式匹配：赛道重叠 + 城市 + 互动率 + 报价匹配 + 可接单。
// 生产环境可升级为 embedding 余弦相似度 + 业务权重（见架构文档）。
export function matchCreators(params: {
  creators: Creator[];
  niches: string[];
  budget: number;
  city?: string;
}): MatchResult[] {
  const { creators, niches, budget, city } = params;

  const results = creators.map((c) => {
    const reasons: string[] = [];
    let score = 0;

    // 1) 赛道重叠（权重 45）
    const overlap = c.niche.filter((n) =>
      niches.some((ni) => ni.includes(n) || n.includes(ni))
    );
    const nicheScore = niches.length ? Math.min(1, overlap.length / niches.length) : 0.3;
    score += nicheScore * 45;
    if (overlap.length) reasons.push(`赛道匹配：${overlap.join("、")}`);

    // 2) 城市（权重 10）
    if (city && c.city === city) {
      score += 10;
      reasons.push(`城市匹配（${c.city}）`);
    }

    // 3) 互动率（权重 20，8% 视为满分）
    const engScore = Math.min(1, c.engagementRate / 0.08);
    score += engScore * 20;
    reasons.push(`互动率 ${(c.engagementRate * 100).toFixed(1)}%`);

    // 4) 报价匹配（权重 15，报价 ≤ 预算一半视为满分）
    const fit = budget > 0 ? Math.max(0, 1 - c.rateCAD / (budget * 0.5)) : 0.5;
    score += fit * 15;
    if (budget > 0 && c.rateCAD <= budget)
      reasons.push(`报价 CAD ${c.rateCAD} 在预算内`);

    // 5) 可接单（权重 10）
    if (c.availability) score += 10;
    else {
      score -= 5;
      reasons.push("当前不可接单");
    }

    return {
      creator: c,
      score: Math.round(Math.max(0, Math.min(100, score))),
      reasons,
    };
  });

  return results.sort((a, b) => b.score - a.score);
}
