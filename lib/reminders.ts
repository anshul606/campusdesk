import { db } from "./db";
import { sendReminderEmail } from "./mailer";

declare global {
  var automatedTasksInterval: NodeJS.Timeout | undefined;
}

export async function processAutomatedTasks() {
  try {
    const now = new Date();

    await db.booking.updateMany({
      where: {
        status: "confirmed",
        endTime: {
          lte: now,
        },
      },
      data: {
        status: "completed",
      },
    });

    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingBookings = await db.booking.findMany({
      where: {
        status: "confirmed",
        reminded: false,
        startTime: {
          gte: now,
          lte: oneHourFromNow,
        },
      },
      include: {
        user: true,
        resource: true,
      },
    });

    for (const booking of upcomingBookings) {
      console.log(
        `[CRON REMINDER EMAIL] Sending reminder to ${booking.user.email} for booking of ${booking.resource.name} at ${booking.startTime.toISOString()}`
      );
      await sendReminderEmail(
        booking.user.email,
        booking.user.name,
        booking.resource.name,
        booking.startTime,
        booking.endTime
      );
      await db.booking.update({
        where: { id: booking.id },
        data: { reminded: true },
      });
    }

    return {
      remindersSent: upcomingBookings.length,
      timestamp: now.toISOString(),
    };
  } catch (error) {
    console.error("Failed to process automated tasks:", error);
    return { error: "Failed to process automated tasks" };
  }
}

if (typeof window === "undefined" && !globalThis.automatedTasksInterval) {
  globalThis.automatedTasksInterval = setInterval(() => {
    processAutomatedTasks().catch((err) => {
      console.error("Background task runner error:", err);
    });
  }, 30000);
}

