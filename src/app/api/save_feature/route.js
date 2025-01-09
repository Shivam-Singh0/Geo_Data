import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SavedFeature from "@/models/SavedFeature";

export async function POST(req) {
  await dbConnect();

  try {
    const { userId, features } = await req.json();

    if (!userId || !features || !Array.isArray(features)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    let savedFeatureDoc = await SavedFeature.findOne({ userId });

    if (!savedFeatureDoc) {
      // Create a new document if it doesn't exist
      savedFeatureDoc = new SavedFeature({
        userId,
        savedFeatures: features,
      });
    } else {
      // Update the existing document
      savedFeatureDoc.savedFeatures = features;
    }

    await savedFeatureDoc.save();
    return NextResponse.json({ message: "Features saved successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Error saving features:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
