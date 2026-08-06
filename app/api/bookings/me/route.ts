import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { processAutomatedTasks } from "@/lib/reminders";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await processAutomatedTasks();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const skip = (page - 1) * limit;

  const whereClause: any = {
    userId: user.id,
  };

  if (status && status !== "all") {
    whereClause.status = status;
  }

  const [data, total] = await Promise.all([
    db.booking.findMany({
      where: whereClause,
      include: {
        resource: true,
      },
      skip,
      take: limit,
      orderBy: { startTime: "desc" },
    }),
    db.booking.count({ where: whereClause }),
  ]);

  return NextResponse.json({
    data,
    page,
    limit,
    total,
  });
}
