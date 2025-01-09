import mongoose from "mongoose";

const savedFeaturesSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // User ID as a string
      required: true,
    },
    savedFeatures: [
    
    ],
  },
  { timestamps: true }
);

export default mongoose.models.SavedFeatures || mongoose.model("SavedFeatures", savedFeaturesSchema);
