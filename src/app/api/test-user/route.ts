import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await dbConnect();

    // Find user with password explicitly included
    const user = await User.findOne({ email: "demo@noteclub.com" }).select(
      "+password"
    );

    if (!user) {
      return NextResponse.json({ userExists: false });
    }

    console.log("Password from DB:", user.password);
    console.log("Testing password: demo123");
    console.log("Password field type:", typeof user.password);
    console.log("Password defined?", user.password !== undefined);

    if (!user.password) {
      return NextResponse.json({
        userExists: true,
        hasPassword: false,
        error: "Password field is undefined or null",
      });
    }

    // Test password
    const isValidPassword = await bcrypt.compare("demo123", user.password);
    console.log(
      "Test with known hash:",
      await bcrypt.compare(
        "demo123",
        "$2b$12$Ons718t0Hgd0F4nsxUxGp.vd8K8fWaanBv2Z403M3XwE1/brkRN8C"
      )
    );
    console.log("Password valid:", isValidPassword);

    return NextResponse.json({
      userExists: true,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      passwordValid: isValidPassword,
      testResult: await bcrypt.compare(
        "demo123",
        "$2b$12$Ons718t0Hgd0F4nsxUxGp.vd8K8fWaanBv2Z403M3XwE1/brkRN8C"
      ),
    });
  } catch (error) {
    console.error("Test user error:", error);
    return NextResponse.json({ error: "Failed to test user" }, { status: 500 });
  }
}
