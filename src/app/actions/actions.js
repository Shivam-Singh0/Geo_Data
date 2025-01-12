"use server"
import dbConnect from "@/lib/mongodb";
import SavedFeatures from "@/models/SavedFeatures";

export async function saveFeatures(features, userId) {
    await dbConnect();
  console.log(userId)
  try {
    let savedFeature = await SavedFeatures.findOne({userId});
    if (savedFeature) {
        savedFeature.savedFeatures.push(...features);
        await savedFeature.save();
    }else {
       savedFeature = await SavedFeatures.create({userId, savedFeatures: features})
    }
   return "Added"
  } catch (error) {
   console.log(error)
    return error
  }
}

export  async function fetchData(userId) {
        try {
          const response = await SavedFeatures.findOne({userId})
          if (response?.savedFeatures) {
            return response.savedFeatures
          }
          return [];
        } catch (error) {
          console.log(error);
          
        }
}