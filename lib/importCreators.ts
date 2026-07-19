// 博主批量导入：CSV / JSON 解析 + 字段归一化（中英表头别名兼容）
import { Creator } from "./types";

// 表头别名映射（中文 + 英文），大小写不敏感
const FIELD_ALIASES: Record<string, string[]> = {
  handle: ["handle", "账号", "昵称", "username", "名称", "小红书号"],
  followers: ["followers", "粉丝", "粉丝量", "粉丝数"],
  engagementRate: ["engagementrate", "互动率", "engagement", "互动"],
  niche: ["niche", "赛道", "tags", "标签", "领域"],
  city: ["city", "城市"],
  rateCAD: ["ratecad", "报价", "rate", "价格", "费用"],
  availability: ["availability", "可接单", "接单"],
  note: ["note", "备注", "备注信息"],
  platformId: ["platformid", "平台id", "xhsid", "小红书id"],
  pastCases: ["pastcases", "案例", "cases", "过往案例"],
};

function pick(row: Record<string, string>, field: string): string {
  const aliases = FIELD_ALIASES[field] || [field];
  for (const a of aliases) {
    const key = Object.keys(row).find(
      (k) => k.trim().toLowerCase() === a.toLowerCase()
    );
    if (key !== undefined && row[key] != null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  return "";
}

// 12.3k / 1.2w / 1.2万 / 12,300 → 非负整数（拦截负数）
function parseCount(s: string, max = 50_000_000): number {
  const t = s.trim().toLowerCase().replace(/,/g, "");
  let n = 0;
  if (t.endsWith("k")) n = parseFloat(t) * 1000;
  else if (t.endsWith("w") || t.endsWith("万")) n = parseFloat(t) * 10000;
  else n = parseFloat(t);
  if (!isFinite(n) || n < 0) return 0; // 负数/非法值归零，避免脏数据入库
  return Math.min(Math.round(n), max);
}

// 单行 CSV 解析（支持引号转义）
function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function objToRow(item: Record<string, unknown>): Record<string, string> {
  const row: Record<string, string> = {};
  for (const [k, v] of Object.entries(item)) {
    row[k] =
      v == null ? "" : Array.isArray(v) ? v.join(",") : String(v);
  }
  return row;
}

// 自动识别 JSON 数组 / JSON 对象(creators) / CSV
export function parseImportPayload(text: string): Record<string, string>[] {
  const t = text.trim();
  if (!t) return [];
  if (t.startsWith("[")) {
    try {
      const arr = JSON.parse(t);
      if (Array.isArray(arr))
        return arr.map((it) => objToRow(it as Record<string, unknown>));
    } catch {
      /* fall through to CSV */
    }
  }
  if (t.startsWith("{")) {
    try {
      const obj = JSON.parse(t);
      if (Array.isArray(obj.creators))
        return obj.creators.map((it: Record<string, unknown>) => objToRow(it));
    } catch {
      /* fall through to CSV */
    }
  }
  return parseCSV(t);
}

// 归一化为 Creator（无 id）；缺账号则返回 error
export function normalizeCreatorRow(
  row: Record<string, string>
): { creator?: Omit<Creator, "id">; error?: string } {
  const handleRaw = pick(row, "handle");
  const handle = handleRaw.replace(/^@/, "").trim();
  if (!handle) return { error: "缺少账号(handle)" };

  let er = Number(pick(row, "engagementRate")) || 0;
  if (!isFinite(er) || er < 0) er = 0;
  if (er >= 1) er = Math.min(er / 100, 1); // 百分比 → 小数，上限 1
  er = Math.max(0, Math.min(er, 1));

  const nicheRaw = pick(row, "niche");
  const niche = nicheRaw
    ? nicheRaw.split(/[,，、/|]/).map((s) => s.trim()).filter(Boolean)
    : [];

  const availRaw = pick(row, "availability").toLowerCase();
  const availability = !(
    availRaw === "no" ||
    availRaw === "false" ||
    availRaw === "0" ||
    availRaw === "否" ||
    availRaw === "档期紧"
  );

  const pastRaw = pick(row, "pastCases");
  const pastCases = pastRaw
    ? pastRaw.split(/[,，、/|]/).map((s) => s.trim()).filter(Boolean)
    : [];

  const platformIdRaw = pick(row, "platformId");
  const creator: Omit<Creator, "id"> = {
    handle,
    followers: parseCount(pick(row, "followers")),
    engagementRate: er,
    niche,
    city: pick(row, "city") || "多伦多",
    rateCAD: parseCount(pick(row, "rateCAD")),
    availability,
    pastCases,
    note: pick(row, "note") || "",
  };
  if (platformIdRaw) creator.platformId = platformIdRaw;
  return { creator };
}
