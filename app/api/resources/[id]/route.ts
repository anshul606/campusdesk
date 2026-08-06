import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const resource = await db.resource.findUnique({
    where: { id },
  });

  if (!resource || !resource.isActive) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  return NextResponse.json(resource);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const updated = await db.resource.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description && { description: body.description }),
        ...(body.location && { location: body.location }),
        ...(body.category && { category: body.category }),
        ...(body.openTime && { openTime: body.openTime }),
        ...(body.closeTime && { closeTime: body.closeTime }),
        ...(typeof body.isActive === "boolean" && { isActive: body.isActive }),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Resource not found or update failed" }, { status: 404 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const softDeleted = await db.resource.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Resource soft deleted successfully", resource: softDeleted });
  } catch {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }
}
