import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GeometryType } from './geojson-types';
import { distance } from '@turf/turf';

interface ElevationProfileProps {
  geometry: {
    type: string;
    coordinates: number[][] | number[][][];
  };
  useResponsiveContainer?: boolean;
  width?: number;
  height?: number;
}

interface ChartDataPoint {
  distance: string;
  elevation: number;
}

const ElevationProfile: React.FC<ElevationProfileProps> = ({
  geometry,
  useResponsiveContainer = false,
  width = 220,
  height = 100
}) => {
  const isLineFeature = geometry?.type === GeometryType.LineString ||
    geometry?.type === GeometryType.MultiLineString;

  if (!isLineFeature) return null;

  // Extract coordinates based on geometry type
  let coordinates: number[][] = [];
  if (geometry.type === GeometryType.LineString) {
    coordinates = geometry.coordinates as number[][];
  } else if (geometry.type === GeometryType.MultiLineString) {
    // Flatten MultiLineString coordinates
    coordinates = (geometry.coordinates as number[][][]).flat();
  }

  // Check if coordinates have elevation data (z value)
  if (coordinates.length === 0 || coordinates[0].length < 3) {
    return null;
  }

  const elevations = coordinates.map(coord => coord[2]);
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);

  // Calculate cumulative distances
  let cumulativeDistances = [0];
  let totalDistance = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const prevCoord = coordinates[i - 1];
    const currCoord = coordinates[i];
    // Use the imported distance function from turf.js
    const segDistance = distance(
      [prevCoord[0], prevCoord[1]],
      [currCoord[0], currCoord[1]],
      { units: 'kilometers' }
    );
    totalDistance += segDistance;
    cumulativeDistances.push(totalDistance);
  }

  // Create data for the chart
  const chartData: ChartDataPoint[] = coordinates.map((coord, i) => ({
    distance: cumulativeDistances[i].toFixed(2),
    elevation: coord[2]
  }));

  // The chart component to render
  const elevationChart = (
    <LineChart
      width={width}
      height={height}
      data={chartData}
      margin={{ top: 5, right: 5, left: 5, bottom: 15 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="distance"
        label={{ value: 'Distance (km)', position: 'bottom', offset: 0, fontSize: 10 }}
        tick={{ fontSize: 9 }}
      />
      <YAxis
        domain={[minElevation - 50, maxElevation + 50]}
        tick={{ fontSize: 9 }}
        tickFormatter={(value) => `${Math.round(value)}m`}
      />
      <Tooltip
        formatter={(value: number) => [`${value}m`, 'Elevation']}
        labelFormatter={(label: string) => `Distance: ${label}km`}
      />
      <Line
        type="monotone"
        dataKey="elevation"
        stroke="#007bff"
        strokeWidth={2}
        dot={false}
        animationDuration={500}
      />
    </LineChart>
  );

  return (
    <div className="elevation-profile">
      <h4>Elevation Profile</h4>
      {useResponsiveContainer ? (
        <ResponsiveContainer width="100%" height={height}>
          {elevationChart}
        </ResponsiveContainer>
      ) : (
        elevationChart
      )}
      <div style={{ fontSize: '10px', textAlign: 'right' }}>
        Total Distance: {totalDistance.toFixed(2)}km | Elevation Gain: {(maxElevation - minElevation).toFixed(0)}m
      </div>
    </div>
  );
};

export default ElevationProfile;