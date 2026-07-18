import { NextRequest, NextResponse } from "next/server";
import { listCreators, addCreator } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ creators: listCreators() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const toArr = (v: unknown) =>
    Array.isArray(v)
      ? v
      : String(v || "")
          .split(/[,，\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
  const c = addCreator({
    handle: body.handle || "未命名",
    followers: Number(body.followers) || 0,
    engagementRate: Number(body.engagementRate) || 0,
    niche: toArr(body.niche),
    city: body.city || "多伦多",
    rateCAD: Number(body.rateCAD) || 0,
    availability: body.availability !== false,
    pastCases: toArr(body.pastCases),
    note: body.note || "",
  });
  return NextResponse.json({ creator: c });
}
