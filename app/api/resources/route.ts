import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { getCache, setCache, clearCache } from "@/lib/cache";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized access" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const cacheKey = `resources:${search.trim().toLowerCase()}:${category}:${page}:${limit}`;
  const cached = getCache<{ data: any[]; page: number; limit: number; total: number }>(cacheKey);

  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=60",
        "X-Cache": "HIT",
      },
    });
  }

  const skip = (page - 1) * limit;

  const whereClause: any = {
    isActive: true,
  };

  if (category && category !== "all") {
    whereClause.category = category;
  }

  if (search.trim()) {
    whereClause.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
      { location: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    db.resource.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.resource.count({ where: whereClause }),
  ]);

  const responsePayload = {
    data,
    page,
    limit,
    total,
  };

  setCache(cacheKey, responsePayload, 30);

  return NextResponse.json(responsePayload, {
    headers: {
      "Cache-Control": "private, max-age=10, stale-while-revalidate=60",
      "X-Cache": "MISS",
    },
  });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized access" },
      { status: 401 }
    );
  }

  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Admin role required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, description, location, category, openTime, closeTime } = body;

    if (!name || !description || !location || !category) {
      return NextResponse.json(
        { error: "Name, description, location, and category are required" },
        { status: 400 }
      );
    }

    const resource = await db.resource.create({
      data: {
        name,
        description,
        location,
        category,
        openTime: openTime || "09:00",
        closeTime: closeTime || "21:00",
        isActive: true,
      },
    });

    clearCache("resources");
    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}
