import { NextResponse } from "next/server";
import { processAutomatedTasks } from "@/lib/reminders";

export async function GET() {
  const result = await processAutomatedTasks();
  return NextResponse.json(result);
}

export async function POST() {
  const result = await processAutomatedTasks();
  return NextResponse.json(result);
}
