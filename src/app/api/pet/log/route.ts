import { NextResponse } from "next/server";
import { CHAT_NAMES, ChatName } from "@/lib/chat";
import { LogEntry, PET_LOG_KEY } from "@/lib/petState";
import { redis } from "@/lib/redis";

export async function GET() {
  if (!redis) return NextResponse.json({ entries: [] });
  const entries = await redis.lrange<LogEntry>(PET_LOG_KEY, 0, -1);
  const filtered = entries.filter((e) => CHAT_NAMES.includes(e.name as ChatName));
  return NextResponse.json({ entries: filtered });
}
