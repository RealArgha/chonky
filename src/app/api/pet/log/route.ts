import { NextResponse } from "next/server";
import { LogEntry, PET_LOG_KEY } from "@/lib/petState";
import { redis } from "@/lib/redis";

export async function GET() {
  if (!redis) return NextResponse.json({ entries: [] });
  const entries = await redis.lrange<LogEntry>(PET_LOG_KEY, 0, -1);
  return NextResponse.json({ entries });
}
