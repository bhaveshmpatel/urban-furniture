import { NextResponse } from "next/server";
import { computeDashboard } from "@repo/core";

export async function GET() {
  try {
    const data = await computeDashboard();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
