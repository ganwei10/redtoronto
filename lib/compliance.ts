const BANNED = [
  "最",
  "第一",
  "国家级",
  "顶级",
  "绝对",
  "100%有效",
  " guaranteed",
  "最好",
  "最佳",
  "唯一",
];

const DISCLOSURE = ["合作", "赞助", "sponsored", "ad", "#ad", "赞助内容"];

// 小红书/广告法极限词 + 加拿大合作披露（material connection）校验
export function checkCompliance(text: string): string[] {
  const flags: string[] = [];
  for (const w of BANNED) {
    if (text.includes(w)) flags.push(`含极限/违禁词：「${w.trim()}」，建议修改`);
  }
  const hasDisclosure = DISCLOSURE.some((d) =>
    text.toLowerCase().includes(d.toLowerCase())
  );
  if (!hasDisclosure)
    flags.push("未标注合作披露（material connection），加拿大法规要求标明，建议加 #合作 / Sponsored");
  return flags;
}
