import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id') || '63686531580af0887da0c25f';

    console.log('Testing queries for userId:', userId);

    // Test 1: Raw MongoDB query
    const db = mongoose.connection.db;
    const rawResult = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
    console.log('Raw MongoDB query result:', rawResult ? 'Found' : 'Not found');

    // Test 2: Check collection name
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections:', collectionNames);

    // Test 3: Count documents in users collection
    const userCount = await db.collection('users').countDocuments();
    console.log('Users collection count:', userCount);

    // Test 4: Find with string ID
    const rawResultString = await db.collection('users').findOne({ _id: userId });
    console.log('Raw query with string ID:', rawResultString ? 'Found' : 'Not found');

    // Test 5: Mongoose model query
    const modelResult = await User.findById(userId).lean();
    console.log('Mongoose model query:', modelResult ? 'Found' : 'Not found');

    // Test 6: Check what collection Mongoose is using
    console.log('Mongoose model collection name:', User.collection.name);

    return NextResponse.json({
      userId,
      tests: {
        rawObjectId: rawResult ? 'Found' : 'Not found',
        rawString: rawResultString ? 'Found' : 'Not found',
        mongooseModel: modelResult ? 'Found' : 'Not found',
        mongooseCollection: User.collection.name,
        availableCollections: collectionNames,
        userCount
      }
    });
  } catch (error) {
    console.error("Debug query error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}