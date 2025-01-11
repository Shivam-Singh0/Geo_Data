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


  React.useEffect(() => {
    if (fetchedFeatures) {
      for (let feature of fetchedFeatures) {
        if (feature.geometry.type === "Point" ) {
          setMarkerPositions((prev) => [...prev, {coordinates: feature.geometry.coordinates, name: feature.properties.name || "Not Named", description : feature.properties.description || ""  }])
        }
        
      }
    }
  }, [fetchedFeatures])


  const geojson = {
    "type": "FeatureCollection",
    "features": [
    
      ...fetchedFeatures
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
          description: properties?.description || "No desc" ,
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
          left: e.point.x + 60,
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
        {markerPositions.map((marker, idx) => (
          <Marker
            key={marker.id || idx}
            longitude={marker.coordinates[0]}
            latitude={marker.coordinates[1]}
            anchor="bottom"
          >
           <Tooltip content={`coordinates:[${marker.coordinates[0]}, ${marker.coordinates[1]}]
           name: ${marker.name}`}
            className="whitespace-pre-line"
           >

           <img
                  src="https://www.freeiconspng.com/uploads/pin-png-28.png"
                  width="20"
                  alt=" Pin"
                />
           </Tooltip>
          </Marker>
        ))}
        <DrawControl
          position="top-left"
          displayControlsDefault={false}
          controls={{
            point: true,
            polygon: true,
            trash: true,
            line_string: true
          }}
          defaultMode="draw_polygon"
          onCreate={onUpdate}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
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
           <>
            <p>
              <strong>Coordinates:</strong> Lat: {hoveredFeature.coordinates[1]},
              Lng: {hoveredFeature.coordinates[0]}
            </p>
             <p>
             <strong>name:</strong> {hoveredFeature.name} 
           </p>
           <p>
             <strong>desc:</strong> {hoveredFeature.description} 
           </p>
           </>
          )}
          {hoveredFeature.type === "Polygon" && (
          <>
            <p>
              <strong>Area:</strong> {hoveredFeature.area / 1000000} KM²
            </p>
             <p>
             <strong>name:</strong> {hoveredFeature.name} 
           </p>
           <p>
             <strong>desc:</strong> {hoveredFeature.description} 
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
            <p>
             <strong>desc:</strong> {hoveredFeature.description} 
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
            <p>
             <strong>desc:</strong> {hoveredFeature.description} 
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