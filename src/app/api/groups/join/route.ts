import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Group } from "@/models/Group";

// POST /api/groups/join - Join group by invite code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteCode } = await request.json();

    if (!inviteCode || inviteCode.trim().length === 0) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const group = await Group.findOne({ 
      inviteCode: inviteCode.toUpperCase().trim() 
    });

    if (!group) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    try {
      await group.addMember(session.user.id);
      
      // Populate the updated group data
      await group.populate("members", "name username image");
      await group.populate("currentTurnUser", "name username image");
      await group.populate("nextTurnUser", "name username image");

      return NextResponse.json({ 
        group,
        message: `Successfully joined ${group.name}!`
      });
    } catch (memberError: any) {
      return NextResponse.json(
        { error: memberError.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Join group error:", error);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
}