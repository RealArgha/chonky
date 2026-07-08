import { NextRequest, NextResponse } from "next/server";
import { ACTION_TARGETS, ActionKey } from "@/lib/chonky";
import { applyAction, DEFAULT_PET_STATE, PET_KEY, PetState, resolvePetState } from "@/lib/petState";
import { redis } from "@/lib/redis";

const VALID_ACTIONS = new Set(Object.keys(ACTION_TARGETS));

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const action = body?.action as ActionKey | undefined;

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
  }

  return NextResponse.json(next);
}
