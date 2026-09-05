import { NextResponse } from "next/server";
import { reviseBudget } from "@repo/core";
import { reviseBudgetSchema } from "@repo/validators";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try { const params = await context.params;
    const json = await req.json();
    const parsed = reviseBudgetSchema.parse(json);

    const newBudget = await reviseBudget(params.id, parsed.committedAmount);
    return NextResponse.json(newBudget);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
