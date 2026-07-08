import { NextResponse } from "next/server";
import { checkLowStats } from "@/lib/petNotify";
import { DEFAULT_PET_STATE, PET_KEY, PetState, resolvePetState } from "@/lib/petState";
import { redis } from "@/lib/redis";

export async function GET() {
  const raw = redis ? ((await redis.get<PetState>(PET_KEY)) ?? DEFAULT_PET_STATE) : DEFAULT_PET_STATE;
  const resolved = resolvePetState(raw, Date.now());
  await checkLowStats(resolved.stats).catch(() => {});
  return NextResponse.json(resolved);
}
