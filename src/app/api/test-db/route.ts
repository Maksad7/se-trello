// src/app/api/test-db/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ ok: true, message: "Connected to MongoDB successfully" });
  } catch (error: any) {
    console.error("DB connection error:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to connect to MongoDB", error: error?.message },
      { status: 500 }
    );
  }
}
