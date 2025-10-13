import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

/**
 * Check if the current user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return false;
    }

    await dbConnect();

    const db = mongoose.connection.db;
    const usersCollection = db?.collection('users');

    // Find user by email and check role
    const user = await usersCollection?.findOne({ email: session.user.email });

    return user?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if the current user has moderator or admin role
 */
export async function isModerator(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return false;
    }

    await dbConnect();

    const db = mongoose.connection.db;
    const usersCollection = db?.collection('users');

    const user = await usersCollection?.findOne({ email: session.user.email });

    return user?.role === 'admin' || user?.role === 'moderator';
  } catch (error) {
    console.error('Error checking moderator status:', error);
    return false;
  }
}

/**
 * Get the current user's role
 */
export async function getUserRole(): Promise<'admin' | 'moderator' | 'member' | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return null;
    }

    await dbConnect();

    const db = mongoose.connection.db;
    const usersCollection = db?.collection('users');

    const user = await usersCollection?.findOne({ email: session.user.email });

    return user?.role || 'member';
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if user is a group admin
 */
export async function isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
  try {
    await dbConnect();

    const db = mongoose.connection.db;
    const groupsCollection = db?.collection('groups');

    const group = await groupsCollection?.findOne({
      $or: [
        { _id: groupId },
        { _id: new mongoose.Types.ObjectId(groupId) }
      ]
    });

    if (!group) {
      return false;
    }

    const adminIds = (group.admins || []).map((id: any) =>
      typeof id === 'string' ? id : id.toString()
    );

    return adminIds.includes(userId.toString());
  } catch (error) {
    console.error('Error checking group admin status:', error);
    return false;
  }
}
