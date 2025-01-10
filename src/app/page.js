"use client";
import * as React from "react";
import { useState, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import Map, { Marker, NavigationControl, Layer, Source,  } from "react-map-gl";
import DrawControl from "@/app/components/DrawControl";
import ControlPanel from "@/app/components/ControlPanel";
import * as turf from "@turf/turf";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { Tooltip } from "@material-tailwind/react";


const TOKEN = process.env.NEXT_PUBLIC_mapboxgl_accessToken;

export default function App() {
 

  const { userId } = useAuth();

  const [features, setFeatures] = useState({});
  const [fetchedFeatures, setFetchedFetures] = useState([]);
  const [markerPositions, setMarkerPositions] = useState([]);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const geojson = {
    "type": "FeatureCollection",
    "features": [
    
      ...fetchedFeatures, {
        
          "type": "Feature",
          "properties": {
            "name": "Delhi"
          },
          "geometry": {
            "type": "MultiPolygon",
            "coordinates": [
              [
                [
                  [77.068899, 28.661897],
                  [77.112184, 28.654831],
                  [77.185843, 28.671632],
                  [77.241066, 28.745399],
                  [77.191925, 28.828181],
                  [77.092635, 28.867926],
                  [76.986056, 28.80859],
                  [76.977082, 28.720449],
                  [77.005786, 28.65388],
                  [77.068899, 28.661897]
                ]
              ],
              [
                [
                  [77.240837, 28.534845],
                  [77.293305, 28.529138],
                  [77.324726, 28.552294],
                  [77.279283, 28.601748],
                  [77.240837, 28.534845]
                ]
              ]
            ]
          }
        }
  ],
    
  }

  const layerStyle = {
    id: "polygon",
    type: "fill", // Use 'fill' for polygons
    paint: {
      "fill-color": "#007cbf",
      "fill-opacity": 0.8, // Optional opacity
      "fill-outline-color": "#000", // Optional outline
    },
  };

  const mapRef = useRef(null);

  React.useEffect(() => {
    if (userId) {
      async function fetchData(userId) {
        try {
          const response = await fetch(`/api/upload?userId=${userId}`, {
            method: "GET",
          });
          const data = await response.json();
          if (data && data.savedFeatures) {
            setFetchedFetures(data.savedFeatures);
          }
        } catch (error) {
          console.log(error);
        }
      }
      fetchData(userId);
    }
  }, [userId]);

  const onUpdate = useCallback((e) => {
    setFeatures((currFeatures) => {
      const newFeatures = { ...currFeatures };
      for (const f of e.features) {
        newFeatures[f.id] = f;

        if (f.geometry.type === "Point") {
          setMarkerPositions((prev) => {
            const existingMarker = prev.find((m) => m.id === f.id);
            if (!existingMarker) {
              return [...prev, { id: f.id, coordinates: f.geometry.coordinates }];
            }
            return prev.map((m) =>
              m.id === f.id ? { id: f.id, coordinates: f.geometry.coordinates } : m
            );
          });
        }
      }

      return newFeatures;
    });
  }, []);

  const onDelete = useCallback((e) => {
    setFeatures((currFeatures) => {
      const newFeatures = { ...currFeatures };
      for (const f of e.features) {
        delete newFeatures[f.id];
      }
      return newFeatures;
    });

    setMarkerPositions((prev) =>
      prev.filter((marker) => !e.features.some((f) => f.id === marker.id))
    );
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!mapRef.current) return;

    const featuresAtCursor = mapRef.current.queryRenderedFeatures(e.point);

    if (featuresAtCursor.length > 0) {
      const feature = featuresAtCursor.find((f) =>
        ["Point", "Polygon", "LineString", "MultiPolygon"].includes(f.geometry.type)
      );

      if (feature) {
        const geometry = feature.geometry;
        const properties = feature.properties;
        let additionalInfo = null;

        if (geometry.type === "Polygon") {
          const polygon = turf.polygon(geometry.coordinates);
          const area = turf.area(polygon);
          additionalInfo = { area: area.toFixed(2) };
        } else if (geometry.type === "LineString") {
          const line = turf.lineString(geometry.coordinates);
          const length = turf.length(line, { units: "kilometers" });
          additionalInfo = { length: length.toFixed(2) };
        }else if (geometry.type === "MultiPolygon"){
            const multipolygon = turf.multiPolygon(geometry.coordinates);
            const area = turf.area(multipolygon);
            additionalInfo = { area: area.toFixed(2) };
        }
        setHoveredFeature({
          type: geometry.type,
          coordinates: geometry.coordinates,
          id: feature.id,
          name : properties?.name || "No Name",
          ...additionalInfo,
        });
        let tooltipTop = e.point.y + 15;

        const featureBounds = mapRef.current.getMap().getBounds(feature.id);
        if (featureBounds) {
          const featurePixelTop = mapRef.current.project([
            featureBounds.getNorthEast().lng,
            featureBounds.getNorthEast().lat,
          ]).y;
          const featurePixelBottom = mapRef.current.project([
            featureBounds.getSouthWest().lng,
            featureBounds.getSouthWest().lat,
          ]).y;

          if (e.point.y >= featurePixelTop && e.point.y <= featurePixelBottom) {
            tooltipTop = featurePixelBottom + 15;
          }
        }

        setTooltipPosition({
          left: e.point.x + 10,
          top: tooltipTop,
        });
      } else {
        setHoveredFeature(null);
        setTooltipPosition(null);
      }
    } else {
      setHoveredFeature(null);
      setTooltipPosition(null);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredFeature(null);
    setTooltipPosition(null);
  }, []);

  if (!userId) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="p-10">
      <Map
        initialViewState={{
          longitude: -91.874,
          latitude: 42.76,
          zoom: 2,
        }}
        style={{ width: "100%", height: "70vh" }}
        mapStyle="mapbox://styles/mapbox/streets-v9"
        mapboxAccessToken={TOKEN}
        ref={mapRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        projection="globe"
      >
        <NavigationControl position="top-right" />
        {markerPositions.map((marker) => (
          <Marker
            key={marker.id}
            longitude={marker.coordinates[0]}
            latitude={marker.coordinates[1]}
            anchor="bottom"
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: "red",
                borderRadius: "50% 50% 0 50%",
                cursor: "pointer",
                transform: "rotate(45deg)",
                border: "1px solid black",
                position: "relative",
              }}
              title={`Marker ID: ${marker.id} at Lat:${marker.coordinates[1]} Lng:${marker.coordinates[0]}`}
            >
              <div
                style={{
                  position: "absolute",
                  top: "5px",
                  left: "7px",
                  backgroundColor: "black",
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  transform: "rotate(-45deg)",
                }}
              ></div>
            </div>
          </Marker>
        ))}
        <DrawControl
          position="top-left"
          displayControlsDefault={false}
          controls={{
            point: true,
            polygon: true,
            trash: true,
          }}
          defaultMode="draw_polygon"
          onCreate={onUpdate}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />

        {fetchedFeatures?.map((feature, idx) => (
          feature.geometry.type === "Point" && (
            <Marker
              longitude={feature.geometry.coordinates[0]}
              latitude={feature.geometry.coordinates[1]}
              anchor="bottom"
              key={feature.id || idx} // Use feature.id if available or index if not
            >
              <Tooltip
                className="text-white"
                content={
                  feature.properties?.name && feature.properties?.description
                    ? `${feature.properties.name}: ${feature.properties.description}`
                    : feature.properties?.name || "No name available"
                }
              >
                <img
                  src="https://www.freeiconspng.com/uploads/pin-png-28.png"
                  width="50"
                  alt=" Pin"
                />
              </Tooltip>
            </Marker>
          )
        ))}
  <Source type="geojson" data={geojson}>
        <Layer {...layerStyle} />
      </Source>
      </Map>
      {hoveredFeature && tooltipPosition && (
        <div
          className="tooltip"
          style={{
            position: "absolute",
            left: `${tooltipPosition.left}px`,
            top: `${tooltipPosition.top}px`,
            padding: "10px",
            backgroundColor: "#333",
            color: "#fff",
            borderRadius: "8px",
            pointerEvents: "none",
            zIndex: 10,
            fontSize: "14px",
            width: "200px",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
          }}
        >
          <h4>Hovered Feature</h4>
          <p>
            <strong>Type:</strong> {hoveredFeature.type}
          </p>
          {hoveredFeature.type === "Point" && (
            <p>
              <strong>Coordinates:</strong> Lat: {hoveredFeature.coordinates[1]},
              Lng: {hoveredFeature.coordinates[0]}
            </p>
          )}
          {hoveredFeature.type === "Polygon" && (
          <>
            <p>
              <strong>Area:</strong> {hoveredFeature.area / 1000000} KM²
            </p>
             <p>
             <strong>name:</strong> {hoveredFeature.name} 
           </p>
          </>
          )}
          {hoveredFeature.type === "LineString" && (
            <>
            <p>
              <strong>Length:</strong> {hoveredFeature.length} km
            </p>
            <p>
              <strong>name:</strong> {hoveredFeature.name} 
            </p>
            </>
          )}
          {hoveredFeature.type === "MultiPolygon" && (
            <>
            <p>
              <strong>Length:</strong> {hoveredFeature.area / 1000} KM²
            </p>
            <p>
              <strong>name:</strong> {hoveredFeature.name} 
            </p>
            </>
          )}
        </div>
      )}
      <ControlPanel polygons={Object.values(features)} markers={markerPositions} />
    </div>
  );
}

export function renderToDom(container) {
  createRoot(container).render(<App />);
}