import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { processAutomatedTasks } from "@/lib/reminders";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await processAutomatedTasks();

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");

  if (!dateStr) {
    return NextResponse.json({ error: "Date parameter (?date=YYYY-MM-DD) is required" }, { status: 400 });
  }

  const startDate = new Date(`${dateStr}T00:00:00.000Z`);
  const endDate = new Date(`${dateStr}T23:59:59.999Z`);

  const bookings = await db.booking.findMany({
    where: {
      resourceId: id,
      status: "confirmed",
      startTime: { lte: endDate },
      endTime: { gte: startDate },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(bookings);
}
