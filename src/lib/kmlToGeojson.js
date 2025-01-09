import { KmlToGeojson } from 'kml-to-geojson';
import * as fs from 'fs';

export async function kmlToGeojson(file) { 
    const kmlToGeojson = new KmlToGeojson();
    const buffer = Buffer.from(file); 
    const kmlContent = buffer.toString('utf-8'); 
    const { folders, geojson } = kmlToGeojson.parse(kmlContent);
    return geojson;
}