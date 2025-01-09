import * as React from "react";
import area from "@turf/area";

function ControlPanel(props) {
  let polygonArea = 0;
  for (const polygon of props.polygons) {
    if (polygon.geometry.type === "Polygon") {
      polygonArea += area(polygon);
    }
  }

  return (
    <div className="control-panel">
      <h3>Draw Polygon</h3>
      {polygonArea > 0 && (
        <p>
          {Math.round(polygonArea * 100) / 100} <br />
          square meters
        </p>
      )}
      <h3>Marker Positions</h3>
      {props.markers.length > 0 ? (
        <ul>
          {props.markers.map((marker, idx) => (
            <li key={idx}>
              Lat: {marker.coordinates[1]}, Lng: {marker.coordinates[0]}
            </li>
          ))}
        </ul>
      ) : (
        <p>No markers added</p>
      )}
     
    </div>
  );
}

export default React.memo(ControlPanel);
