// 统一输入校验（前后端共用，纯 TS，无外部依赖）
// 目标：拦截负数、NaN、越界、必填缺失，保证入库数据合理。

export type FieldErrors = Record<string, string>;

export interface ValidationResult<T> {
  ok: boolean;
  errors: FieldErrors;
  value: T;
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v ?? "").trim());
  return isNaN(n) ? NaN : n;
}

// 整数且 ≥ 0
function nonNegInt(v: unknown, max = 50_000_000): number | null {
  const n = toNum(v);
  if (!isFinite(n) || n < 0) return null;
  return Math.min(Math.round(n), max);
}

function nonNegNum(v: unknown, max = 100_000_000): number | null {
  const n = toNum(v);
  if (!isFinite(n) || n < 0) return null;
  return Math.min(n, max);
}

function reqStr(v: unknown): string {
  return String(v ?? "").trim();
}

// 可选非负整数：留空/NaN → 0；负数 → 报错；越界 → 截断
function optNonNegInt(v: unknown, max = 50_000_000): { value: number; error?: string } {
  const n = toNum(v);
  if (!isFinite(n)) return { value: 0 };
  if (n < 0) return { value: 0, error: "须为不小于 0 的整数" };
  return { value: Math.min(Math.round(n), max) };
}

// 可选非负小数：留空/NaN → 0；负数 → 报错；越界 → 截断
function optNonNegNum(v: unknown, max = 100_000_000): { value: number; error?: string } {
  const n = toNum(v);
  if (!isFinite(n)) return { value: 0 };
  if (n < 0) return { value: 0, error: "须为不小于 0 的数值" };
  return { value: Math.min(n, max) };
}

// 博主（单条录入 / 编辑）
export function validateCreatorInput(body: any): ValidationResult<any> {
  const errors: FieldErrors = {};
  const rawHandle = reqStr(body?.handle);
  const handle = rawHandle.replace(/^@/, "");
  if (!handle) errors.handle = "账号（小红书号）为必填项";

  const fRes = optNonNegInt(body?.followers);
  if (fRes.error) errors.followers = `粉丝量${fRes.error}`;
  const followers = fRes.value;

  let er = toNum(body?.engagementRate);
  if (!isFinite(er)) er = 0;
  if (er < 0 || er > 100) errors.engagementRate = "互动率须为 0–100（百分比）";

  const rRes = optNonNegNum(body?.rateCAD);
  if (rRes.error) errors.rateCAD = `报价${rRes.error}`;
  const rateCAD = rRes.value;

  const city = reqStr(body?.city) || "多伦多";
  const nicheRaw = body?.niche;
  const niche =
    Array.isArray(nicheRaw) && nicheRaw.length
      ? nicheRaw.map((s: any) => String(s).trim()).filter(Boolean)
      : reqStr(nicheRaw)
          .split(/[,，、/|]/)
          .map((s) => s.trim())
          .filter(Boolean);

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      handle,
      followers,
      engagementRate: er / 100,
      niche,
      city,
      rateCAD,
      availability: body?.availability !== false,
      pastCases: Array.isArray(body?.pastCases)
        ? body.pastCases
        : reqStr(body?.pastCases)
            .split(/[,，、/|]/)
            .map((s: string) => s.trim())
            .filter(Boolean),
      note: reqStr(body?.note),
    },
  };
}

// Brief 录入
export function validateBriefInput(body: any): ValidationResult<any> {
  const errors: FieldErrors = {};
  const industry = reqStr(body?.industry);
  if (!industry) errors.industry = "行业为必填项";
  const budget = nonNegNum(body?.budget);
  if (budget === null) errors.budget = "预算须为不小于 0 的数值";
  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      industry,
      goal: reqStr(body?.goal),
      budget: budget ?? 0,
      audience: reqStr(body?.audience),
      sellingPoints: reqStr(body?.sellingPoints),
      kpi: reqStr(body?.kpi),
      duration: reqStr(body?.duration),
    },
  };
}

// 匹配
export function validateMatchInput(body: any): ValidationResult<any> {
  const errors: FieldErrors = {};
  const industry = reqStr(body?.industry);
  const niches = Array.isArray(body?.niches) ? body.niches : [];
  if (!industry && niches.length === 0)
    errors.industry = "行业或赛道为必填项";
  const budget = nonNegNum(body?.budget);
  if (budget === null) errors.budget = "预算须为不小于 0 的数值";
  let topN = Math.round(toNum(body?.topN));
  if (!isFinite(topN)) topN = 5;
  if (topN < 1 || topN > 50) errors.topN = "返回数量须为 1–50";
  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      industry,
      niches,
      budget: budget ?? 0,
      city: reqStr(body?.city) || "多伦多",
      topN: Math.min(Math.max(topN, 1), 50),
    },
  };
}

// Campaign
export function validateCampaignInput(body: any): ValidationResult<any> {
  const errors: FieldErrors = {};
  const name = reqStr(body?.name);
  if (!name) errors.name = "Campaign 名称为必填项";
  const budgetCAD = nonNegNum(body?.budgetCAD);
  if (budgetCAD === null) errors.budgetCAD = "预算须为不小于 0 的数值";
  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      name,
      budgetCAD: budgetCAD ?? 0,
      creatorIds: Array.isArray(body?.creatorIds) ? body.creatorIds : [],
      brief: body?.brief ?? null,
      status: "draft",
    },
  };
}

// 效果指标
export function validateMetricInput(body: any): ValidationResult<any> {
  const errors: FieldErrors = {};
  const fields: [string, string][] = [
    ["impressions", "曝光量"],
    ["engagements", "互动量"],
    ["clicks", "点击量"],
    ["leads", "留资量"],
  ];
  const value: any = { date: reqStr(body?.date) || new Date().toISOString().slice(0, 10) };
  for (const [k, label] of fields) {
    const n = nonNegInt(body?.[k], 10_000_000_000);
    if (n === null) errors[k] = `${label}须为不小于 0 的整数`;
    else value[k] = n;
  }
  return { ok: Object.keys(errors).length === 0, errors, value };
}
