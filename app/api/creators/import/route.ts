import { NextRequest, NextResponse } from "next/server";
import { importCreators } from "@/lib/store";
import { parseImportPayload } from "@/lib/importCreators";

export async function POST(req: NextRequest) {
  let text = "";
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = await req.json();
    if (typeof body.text === "string") text = body.text;
    else if (Array.isArray(body.creators)) text = JSON.stringify(body.creators);
    else if (Array.isArray(body)) text = JSON.stringify(body);
  } else {
    text = await req.text();
  }

  const rows = parseImportPayload(text);
  const result = importCreators(rows);
  return NextResponse.json({
    total: rows.length,
    added: result.added.length,
    skipped: result.skipped,
    errors: result.errors,
  });
}
