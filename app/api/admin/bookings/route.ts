import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { processAutomatedTasks } from "@/lib/reminders";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  await processAutomatedTasks();

  const { searchParams } = new URL(request.url);
  const resourceId = searchParams.get("resourceId");
  const status = searchParams.get("status");
  const dateStr = searchParams.get("date");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "15", 10);

  const skip = (page - 1) * limit;

  const whereClause: any = {};

  if (resourceId && resourceId !== "all") {
    whereClause.resourceId = resourceId;
  }

  if (status && status !== "all") {
    whereClause.status = status;
  }

  if (dateStr) {
    const startDate = new Date(`${dateStr}T00:00:00.000Z`);
    const endDate = new Date(`${dateStr}T23:59:59.999Z`);
    whereClause.startTime = { lte: endDate };
    whereClause.endTime = { gte: startDate };
  }

  const [data, total] = await Promise.all([
    db.booking.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
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
