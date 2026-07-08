import { NextRequest, NextResponse } from "next/server";
import { ACTION_TARGETS, ActionKey } from "@/lib/chonky";
import { checkLowStats } from "@/lib/petNotify";
import {
  applyAction,
  DEFAULT_PET_STATE,
  MAX_LOG_ENTRIES,
  PET_KEY,
  PET_LOG_KEY,
  PetState,
  resolvePetState,
} from "@/lib/petState";
import { redis } from "@/lib/redis";

const VALID_ACTIONS = new Set(Object.keys(ACTION_TARGETS));

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const action = body?.action as ActionKey | undefined;
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim().slice(0, 30) : "Someone";

  if (!action || !VALID_ACTIONS.has(action)) {
    return NextResponse.json({ error: "valid action is required" }, { status: 400 });
  }

  if (!redis) {
    return NextResponse.json({ error: "Pet storage not configured" }, { status: 503 });
  }

  const now = Date.now();
  const raw = (await redis.get<PetState>(PET_KEY)) ?? DEFAULT_PET_STATE;
  const live = resolvePetState(raw, now);
  const next = applyAction(live, action, now);

  if (next !== live) {
    await redis.set(PET_KEY, next);
    await redis.rpush(PET_LOG_KEY, { name, action, ts: now });
    await redis.ltrim(PET_LOG_KEY, -MAX_LOG_ENTRIES, -1);
  }

  await checkLowStats(next.stats).catch(() => {});

  return NextResponse.json(next);
}
