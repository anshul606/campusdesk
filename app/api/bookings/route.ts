import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { processAutomatedTasks } from "@/lib/reminders";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  if (user.role === "admin") {
    return NextResponse.json(
      { error: "Administrators cannot create bookings. Reservations are reserved for students." },
      { status: 403 }
    );
  }

  await processAutomatedTasks();

  try {
    const body = await request.json();
    const { resourceId, startTime: startStr, endTime: endStr, purpose } = body;

    const errors: Record<string, string> = {};

    if (!resourceId) errors.resourceId = "Resource selection is required";
    if (!startStr) errors.startTime = "Start time is required";
    if (!endStr) errors.endTime = "End time is required";
    if (!purpose || !purpose.trim()) errors.purpose = "Booking purpose is required";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const start = new Date(startStr);
    const end = new Date(endStr);
    const now = new Date();

    if (isNaN(start.getTime())) errors.startTime = "Invalid start time format";
    if (isNaN(end.getTime())) errors.endTime = "Invalid end time format";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    if (start <= now) {
      errors.startTime = "Start time must be in the future";
    }

    if (end <= now) {
      errors.endTime = "End time must be in the future";
    }

    if (end <= start) {
      errors.endTime = "End time must be after start time";
    }

    const durationMs = end.getTime() - start.getTime();
    const minMs = 30 * 60 * 1000;
    const maxMs = 4 * 60 * 60 * 1000;

    if (durationMs < minMs || durationMs > maxMs) {
      errors.endTime = "Booking duration must be between 30 minutes and 4 hours";
    }

    const resource = await db.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource || !resource.isActive) {
      return NextResponse.json({ error: "Resource not found or inactive" }, { status: 404 });
    }

    const startHHMM = start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
    const endHHMM = end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });

    if (startHHMM < resource.openTime || endHHMM > resource.closeTime) {
      errors.startTime = `Slot must be within resource opening hours (${resource.openTime} - ${resource.closeTime})`;
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const userUpcomingCount = await db.booking.count({
      where: {
        userId: user.id,
        resourceId: resourceId,
        status: "confirmed",
        endTime: { gt: now },
      },
    });

    if (user.role === "student" && userUpcomingCount >= 2) {
      return NextResponse.json(
        { error: "You can hold at most 2 upcoming confirmed bookings per resource" },
        { status: 400 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      const conflictingBooking = await tx.booking.findFirst({
        where: {
          resourceId: resourceId,
          status: "confirmed",
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });

      if (conflictingBooking) {
        throw {
          isConflict: true,
          clashingSlot: {
            startTime: conflictingBooking.startTime,
            endTime: conflictingBooking.endTime,
          },
        };
      }

      return await tx.booking.create({
        data: {
          userId: user.id,
          resourceId,
          startTime: start,
          endTime: end,
          purpose: purpose.trim(),
          status: "confirmed",
        },
        include: {
          resource: true,
        },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err && err.isConflict) {
      return NextResponse.json(
        {
          error: "Booking clashes with an existing reservation",
          clashingSlot: err.clashingSlot,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
