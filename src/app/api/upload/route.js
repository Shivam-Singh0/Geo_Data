import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SavedFeatures from '@/models/SavedFeatures';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator
import { tiffToGeoJSON } from '@/lib/tiffToGeojson';
import { kmlToGeojson } from '@/lib/kmlToGeojson';

export async function POST(req) {
    
  try {
    await dbConnect();

     const formData = await req.formData()
    const file = formData.get('file')
      if (!file) {
          console.log("no file");
          return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

    const userId = formData.get('userId');
    const type = formData.get('type');
    const buffer = await file.arrayBuffer()
    const originalname = file.name
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
      if (!type) {
          return NextResponse.json({ error: 'type is required' }, { status: 400 });
      }


    let data;
    if (type === 'geojson') {
        try {
            const geojson = JSON.parse(Buffer.from(buffer).toString());
            data = geojson.features;
        } catch (error) {
          console.log("error parsing")
            return NextResponse.json({ error: 'Error parsing geojson' }, { status: 400 });
        }
    } else if (type === 'kml') {
       
        let geojson = await kmlToGeojson(buffer);
        data = geojson.features;
        
    } else if (type === 'tiff') {
      try {
        let geojson = await tiffToGeoJSON(buffer);
        data = geojson.features

    } catch (error){
        console.log("Error converting tiff to geojson", error)
        return NextResponse.json({error: "Error converting tiff to geojson"}, {status: 500})
    }
    } else {
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    let savedFeatures = await SavedFeatures.findOne({ userId });
    if (savedFeatures) {
        savedFeatures.savedFeatures.push(...data);
        await savedFeatures.save();
    } else {
        savedFeatures = new SavedFeatures({
            userId,
            savedFeatures: data,
        });
        await savedFeatures.save();
    }
      console.log("success")
    return NextResponse.json({ message: 'File uploaded successfully', file: savedFeatures }, { status: 201 });

  } catch (error) {
      console.log("error", error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  try {
    const data = await SavedFeatures.findOne({userId});
   return NextResponse.json(data, {status: 200})
  } catch (error) {
    console.log(error)
    return NextResponse.json(error, {status: 400})
  }
}
