import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const CHAT_KEY = "chonky:chat:messages";
const MAX_MESSAGES = 200;

type ChatMessage = {
  name: string;
  text: string;
  ts: number;
};

export async function GET() {
  if (!redis) return NextResponse.json({ messages: [] });
  const raw = await redis.lrange<ChatMessage>(CHAT_KEY, 0, -1);
  return NextResponse.json({ messages: raw });
}

export async function POST(req: NextRequest) {
  if (!redis) return NextResponse.json({ error: "Chat storage not configured" }, { status: 503 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 30) : "";
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 1000) : "";

  if (!name || !text) {
    return NextResponse.json({ error: "name and text are required" }, { status: 400 });
  }

  const message: ChatMessage = { name, text, ts: Date.now() };
  await redis.rpush(CHAT_KEY, message);
  await redis.ltrim(CHAT_KEY, -MAX_MESSAGES, -1);

  return NextResponse.json({ ok: true });
}
