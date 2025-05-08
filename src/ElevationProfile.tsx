import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GeometryType } from './geojson-types';
import { distance } from '@turf/turf';
import { Slider } from '@mui/material';

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
  index: number;
  coordinate: number[];
  distance: number;
  elevation: number;
  cumulativeGain: number; // Added cumulative elevation gain
}

const ElevationProfile: React.FC<ElevationProfileProps> = ({
  geometry,
  useResponsiveContainer = false,
  width = 220,
  height = 100
}) => {
  // Extract coordinates based on geometry type
  let coordinates: number[][] = [];
  if (geometry.type === GeometryType.LineString) {
    coordinates = geometry.coordinates as number[][];
  } else if (geometry.type === GeometryType.MultiLineString) {
    // Flatten MultiLineString coordinates
    coordinates = (geometry.coordinates as number[][][]).flat();
  }

  // Add slider state
  const [sliderValues, setSliderValues] = useState<number[]>([0, coordinates.length - 1]);

  const isLineFeature = geometry?.type === GeometryType.LineString ||
    geometry?.type === GeometryType.MultiLineString;

  if (!isLineFeature) return null;

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

  // Create data for the chart, including cumulative elevation gain
  const chartData: ChartDataPoint[] = [];
  let cumulativeGain = 0;

  for (let i = 0; i < coordinates.length; i++) {
    // Calculate elevation gain (only uphill portions)
    if (i > 0) {
      const elevationDifference = coordinates[i][2] - coordinates[i - 1][2];
      if (elevationDifference > 0) {
        cumulativeGain += elevationDifference;
      }
    }

    // Add point to chart data with distance, elevation, and cumulative gain
    chartData.push({
      index: i,
      coordinate: coordinates[i],
      distance: cumulativeDistances[i],
      elevation: coordinates[i][2],
      cumulativeGain: cumulativeGain
    });
  }

  // Calculate selected range metrics
  const selectedStartIndex = sliderValues[0];
  const selectedEndIndex = sliderValues[1];

  const selectedElevations = elevations.slice(selectedStartIndex, selectedEndIndex + 1);
  const selectedMinElevation = Math.min(...selectedElevations);
  const selectedMaxElevation = Math.max(...selectedElevations);
  const selectedElevationGain = selectedMaxElevation - selectedMinElevation;

  const selectedStartDistance = chartData[selectedStartIndex].distance;
  const selectedEndDistance = chartData[selectedEndIndex].distance;
  const selectedDistance = selectedEndDistance - selectedStartDistance;

  // Get cumulative elevation gain for the selection using pre-computed values
  const selectedCumulativeGain = chartData[selectedEndIndex].cumulativeGain -
    (selectedStartIndex > 0 ? chartData[selectedStartIndex - 1].cumulativeGain : 0);

  // Handle slider change
  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setSliderValues(newValue as number[]);
  };

  // The chart component to render
  const elevationChart = (
    <LineChart
      width={width}
      height={height}
      data={chartData}
      margin={{ top: 5, right: 5, left: 5, bottom: 15 }}
      onMouseDown={(data, event) => {
        event.preventDefault();
        console.log({ data, event })
        setSliderValues([data.activePayload?.[0].payload.index ?? 0, 0] as number[]); // Set slider to clicked point
      }}
      onMouseUp={(data, event) => {
        event.preventDefault();
        console.log({ data, event })
        setSliderValues([sliderValues[0], data.activePayload?.[0].payload.index ?? 0] as number[]); // Set slider to clicked point
      }}
      onMouseMove={(data, event) => {
        event.stopPropagation();
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="distance"
        label={{ value: 'Distance (km)', position: 'bottom', offset: 0, fontSize: 10 }}
        tick={{ fontSize: 9 }}
        tickFormatter={(value) => `${value.toFixed(2)}km`}
        domain={[0, totalDistance]}
        scale="linear"
        type="number"
      />
      <YAxis
        domain={[minElevation - 50, maxElevation + 50]}
        tick={{ fontSize: 9 }}
        tickFormatter={(value) => `${Math.round(value)}m`}
      />
      <Tooltip
        formatter={(value: number, name: string) => {
          if (name === 'elevation') return [`${value.toFixed(0)}m`, 'Elevation'];
          return [value, name];
        }}
        labelFormatter={(label: number) => `Distance: ${label.toFixed(2)}km`}
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0" x2="100%" y2="0">
          <stop offset="0%" stopColor="#f80" />
          <stop offset={`${selectedStartDistance / totalDistance * 100}%`} stopColor="#f80" />
          <stop offset={`${selectedStartDistance / totalDistance * 100}%`} stopColor="#08f" />
          <stop offset={`${selectedEndDistance / totalDistance * 100}%`} stopColor="#08f" />
          <stop offset={`${selectedEndDistance / totalDistance * 100}%`} stopColor="#f80" />
          <stop offset={`${100}%`} stopColor="#f80" />
        </linearGradient>
      </defs>
      <Line
        type="monotone"
        dataKey="elevation"
        stroke="url(#gradient)"
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
      <div style={{ padding: '15px 10px 5px 10px' }}>
        <Slider
          value={sliderValues}
          onChange={handleSliderChange}
          valueLabelDisplay="auto"
          min={0}
          max={coordinates.length - 1}
          valueLabelFormat={(index) => `${chartData[index].distance}km`}
        />
      </div>
      <div style={{ fontSize: '10px', textAlign: 'right' }}>
        Total Distance: {totalDistance.toFixed(2)}km | Elevation Gain: {(maxElevation - minElevation).toFixed(0)}m
        <br />
        Selection: {selectedDistance.toFixed(2)}km | Elevation Gain: {selectedElevationGain.toFixed(0)}m | Cumulative Gain: {selectedCumulativeGain.toFixed(0)}m
      </div>
    </div>
  );
};

export default ElevationProfile;