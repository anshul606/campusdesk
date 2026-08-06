import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { id } = await params;
  const booking = await db.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isOwner = booking.userId === user.id;
  const isAdmin = user.role === "admin";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden. You can only cancel your own booking." }, { status: 403 });
  }

  if (isOwner && !isAdmin) {
    if (new Date() >= new Date(booking.startTime)) {
      return NextResponse.json(
        { error: "Bookings can only be cancelled prior to their start time" },
        { status: 400 }
      );
    }
  }

  const updatedBooking = await db.booking.update({
    where: { id },
    data: { status: "cancelled" },
    include: { resource: true },
  });

  return NextResponse.json(updatedBooking);
}
