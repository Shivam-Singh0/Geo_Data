import mongoose from "mongoose";

export default async function dbConnect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("database connected succesfully")
  } catch (error) {
    console.log(error)
  }
}