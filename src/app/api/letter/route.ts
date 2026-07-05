import { NextResponse } from "next/server";

export async function GET() {
  const text = process.env.LETTER_TEXT ?? "";
  return NextResponse.json({ text });
}
