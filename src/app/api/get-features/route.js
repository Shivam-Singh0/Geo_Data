import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SavedFeature from "@/models/SavedFeature";

export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const savedFeatureDoc = await SavedFeature.findOne({ userId });

    if (!savedFeatureDoc) {
      return NextResponse.json({ error: "No features found for this user" }, { status: 404 });
    }

    return NextResponse.json(savedFeatureDoc.savedFeatures, { status: 200 });
  } catch (error) {
    console.error("Error fetching features:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
