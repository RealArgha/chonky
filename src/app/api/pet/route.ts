import { NextResponse } from "next/server";
import { DEFAULT_PET_STATE, PET_KEY, PetState, resolvePetState } from "@/lib/petState";
import { redis } from "@/lib/redis";

export async function GET() {
  const raw = redis ? ((await redis.get<PetState>(PET_KEY)) ?? DEFAULT_PET_STATE) : DEFAULT_PET_STATE;
  const resolved = resolvePetState(raw, Date.now());
  return NextResponse.json(resolved);
}
