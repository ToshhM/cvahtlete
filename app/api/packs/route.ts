import { NextResponse } from "next/server";
import { PACKS } from "@/utils/packs";

export async function GET() {
  return NextResponse.json({ packs: PACKS });
}
