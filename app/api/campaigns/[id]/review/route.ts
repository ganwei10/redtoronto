import { NextRequest, NextResponse } from "next/server";
import { getCampaign, getCreator, saveReview } from "@/lib/store";
import { generateReview, ReviewInput } from "@/lib/ai";
import { addReview, getReviewByCampaign } from "@/lib/kb";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cmp = await getCampaign(id);
  if (!cmp) return NextResponse.json({ error: "campaign 不存在" }, { status: 404 });
  const kb = await getReviewByCampaign(id);
  return NextResponse.json({ review: cmp.review || kb?.review || null });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const cmp = await getCampaign(id);
  if (!cmp) return NextResponse.json({ error: "campaign 不存在" }, { status: 404 });

  const total = (cmp.metrics || []).reduce(
    (s, m) => ({
      impressions: s.impressions + m.impressions,
      engagements: s.engagements + m.engagements,
      clicks: s.clicks + m.clicks,
      leads: s.leads + m.leads,
    }),
    { impressions: 0, engagements: 0, clicks: 0, leads: 0 }
  );

  const creatorObjs = await Promise.all(
    (cmp.creatorIds || []).map((cid) => getCreator(cid))
  );
  const creators = creatorObjs
    .filter(Boolean)
    .map((c) => ({
      handle: c!.handle,
      niche: c!.niche,
      followers: c!.followers,
    }));

  const input: ReviewInput = {
    name: cmp.name,
    objective: (cmp.brief as any)?.objective ?? "",
    budgetCAD: cmp.budgetCAD,
    total,
    creators,
  };

  const review = await generateReview(input);

  await saveReview(id, review);
  await addReview({ campaignId: id, campaignName: cmp.name, review });

  return NextResponse.json({ review });
}
