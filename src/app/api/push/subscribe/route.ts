import { NextRequest, NextResponse } from "next/server";
import { CHAT_NAMES, type ChatName } from "@/lib/chat";
import { saveSubscription } from "@/lib/push";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  const subscription = body?.subscription;

  if (!CHAT_NAMES.includes(name as ChatName) || !subscription?.endpoint) {
    return NextResponse.json({ error: "valid name and subscription required" }, { status: 400 });
  }

  await saveSubscription(name, subscription);
  return NextResponse.json({ ok: true });
}
