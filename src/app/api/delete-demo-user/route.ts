import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";

export async function DELETE() {
  try {
    await dbConnect();

    const result = await User.deleteOne({ email: "demo@noteclub.com" });

    return NextResponse.json({
      deleted: result.deletedCount > 0,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
