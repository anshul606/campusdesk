import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const otpRecord = await db.otpRequest.findFirst({
      where: {
        email: cleanEmail,
        otp: cleanOtp,
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP code" },
        { status: 400 }
      );
    }

    let user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      const defaultName = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ");
      const role = cleanEmail.includes("admin") ? "admin" : "student";
      user = await db.user.create({
        data: {
          email: cleanEmail,
          name: defaultName,
          role,
        },
      });
    }

    await db.otpRequest.deleteMany({
      where: { email: cleanEmail },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
