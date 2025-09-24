import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { subscription, preferences } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Find user by email
    const { User } = require('@/models/User');
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if subscription already exists
    let existingSubscription = await PushSubscription.findOne({
      endpoint: subscription.endpoint
    });

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.user = user._id;
      existingSubscription.keys = subscription.keys;
      existingSubscription.isActive = true;
      existingSubscription.lastUsed = new Date();
      
      if (preferences) {
        existingSubscription.preferences = { ...existingSubscription.preferences, ...preferences };
      }
      
      await existingSubscription.save();
    } else {
      // Create new subscription
      existingSubscription = new PushSubscription({
        user: user._id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        preferences: preferences || {
          turnReminders: true,
          newAlbums: true,
          comments: true,
          likes: false,
          groupInvites: true,
          themeChanges: true
        },
        userAgent: request.headers.get('user-agent') || undefined,
        isActive: true,
        lastUsed: new Date()
      });
      
      await existingSubscription.save();
    }

    return NextResponse.json({ 
      success: true,
      subscriptionId: existingSubscription._id 
    });

  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const { User } = require('@/models/User');
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete or deactivate subscription
    await PushSubscription.updateOne(
      { endpoint, user: user._id },
      { $set: { isActive: false } }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { endpoint, preferences } = body;

    if (!endpoint || !preferences) {
      return NextResponse.json(
        { error: "Endpoint and preferences are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const { User } = require('@/models/User');
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update subscription preferences
    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint, user: user._id },
      { $set: { preferences } },
      { new: true }
    );

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      preferences: subscription.preferences 
    });

  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}