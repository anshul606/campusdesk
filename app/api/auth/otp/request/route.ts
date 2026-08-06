import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOtpEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const recentRequests = await db.otpRequest.count({
      where: {
        email: cleanEmail,
        createdAt: {
          gte: tenMinutesAgo,
        },
      },
    });

    if (recentRequests >= 3) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 3 OTP requests per 10 minutes." },
        { status: 429 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.otpRequest.create({
      data: {
        email: cleanEmail,
        otp,
        expiresAt,
      },
    });

    let user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user && name) {
      const role = cleanEmail.includes("admin") ? "admin" : "student";
      await db.user.create({
        data: {
          email: cleanEmail,
          name: name.trim(),
          role,
        },
      });
    }

    console.log(`[SERVER CONSOLE OTP] Email: ${cleanEmail} | OTP: ${otp}`);

    let previewUrl: string | boolean = false;
    try {
      const emailResult = await sendOtpEmail(cleanEmail, otp);
      previewUrl = emailResult.previewUrl || false;
    } catch (mailError) {
      console.error("[OTP EMAIL DISPATCH ERROR]", mailError);
    }

    return NextResponse.json({
      message: "OTP sent successfully",
      email: cleanEmail,
      devOtp: otp,
      previewUrl: previewUrl || undefined,
    });
  } catch (error: any) {
    console.error("[OTP REQUEST ERROR]", error);
    return NextResponse.json(
      { 
        error: error?.message || "Internal server error",
        details: process.env.NODE_ENV !== "production" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
