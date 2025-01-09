import { fromArrayBuffer } from 'geotiff';
import { polygon } from '@turf/turf';

export async function tiffToGeoJSON(buffer) {
    try {
        const tiff = await fromArrayBuffer(buffer);
        const image = await tiff.getImage();
        const width = image.getWidth();
        const height = image.getHeight();
        const bbox = image.getBoundingBox();

        const geoJSONPolygon = polygon([
            [
                [bbox[0], bbox[1]], // Bottom-left
                [bbox[2], bbox[1]], // Bottom-right
                [bbox[2], bbox[3]], // Top-right
                [bbox[0], bbox[3]], // Top-left
                [bbox[0], bbox[1]]  // Close the polygon
            ]
        ]);

        return {
            type: 'FeatureCollection',
            features: [
              geoJSONPolygon
            ]
        }


    } catch (error) {
        console.error("Error converting TIFF to GeoJSON:", error);
      throw new Error("Error converting TIFF to GeoJSON")
    }
}