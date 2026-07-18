import { NextResponse } from "next/server";
import { listReviews } from "@/lib/kb";

export async function GET() {
  return NextResponse.json({ entries: listReviews() });
}
