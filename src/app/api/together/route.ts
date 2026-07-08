import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ since: process.env.TOGETHER_SINCE ?? null });
}
