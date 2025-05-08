import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Label, ReferenceDot, ReferenceArea } from 'recharts';
import { GeometryType } from './geojson-types';
import { distance } from '@turf/turf';
import { Slider } from '@mui/material';
import { CategoricalChartState } from 'recharts/types/chart/types';

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
  cumulativeGain: number;
  cumulativeLoss: number;
}

interface Segment {
  from: ChartDataPoint;
  to: ChartDataPoint;
  distance: number;
  elevationDifference: number;
  grade: number;
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
  const [potentialSliderStart, setPotentialSliderStart] = useState<number>(0);

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

  // Create data for the chart, including cumulative elevation gain
  const chartData: ChartDataPoint[] = [];
  let totalDistance = 0;
  let cumulativeGain = 0;
  let cumulativeLoss = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const currCoord = coordinates[i];

    // Calculate distance from the previous point, cumulative gain and loss
    if (i > 0) {
      const prevCoord = coordinates[i - 1];

      const segDistance = distance(
        [prevCoord[0], prevCoord[1]],
        [currCoord[0], currCoord[1]],
        { units: 'kilometers' }
      );
      totalDistance += segDistance;

      const elevationDifference = currCoord[2] - prevCoord[2];
      if (elevationDifference > 0) {
        cumulativeGain += elevationDifference;
      } else {
        cumulativeLoss += elevationDifference;
      }
    }

    // Add point to chart data with distance, elevation, and cumulative gain
    chartData.push({
      index: i,
      coordinate: currCoord,
      elevation: currCoord[2],
      distance: totalDistance,
      cumulativeGain,
      cumulativeLoss,
    });
  }

  // Create a smoothed copy of the elevation chart using the douglas-peucker algorithm
  // where X is distance and Y is elevation
  // Keep only points that are necessary to represent the shape of the line
  const douglasPeucker = (
    coords: ChartDataPoint[],
    precisionMeters: number,
  ): ChartDataPoint[] => {
    if (coords.length < 2) return coords.slice();
    // find the point that is farthest from the line segment defined by the endpoints
    const lineSeg: [ChartDataPoint, ChartDataPoint] = [
      coords[0],
      coords[coords.length - 1],
    ];
    let maxDist = 0;
    let maxIndex = 0;
    for (let i: number = 0; i < coords.length; i++) {
      const slope = (lineSeg[1].elevation - lineSeg[0].elevation) / (lineSeg[1].distance - lineSeg[0].distance);
      const interpolation = lineSeg[0].elevation + slope * (coords[i].distance - lineSeg[0].distance);
      const dist = Math.abs(coords[i].elevation - interpolation);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }
    // if the farthest point is beyond the threshold, add it and recurse
    if (maxDist > precisionMeters) {
      return [
        ...douglasPeucker(coords.slice(0, maxIndex + 1), precisionMeters),
        ...douglasPeucker(coords.slice(maxIndex), precisionMeters).slice(1),
      ];
    }
    return lineSeg;
  }
  const smoothedChartData = douglasPeucker(chartData, 1.5 * cumulativeGain / 100);
  // identify peaks and valleys from the smoothed data
  let segments: Segment[] = [];
  for (let i = 1; i < smoothedChartData.length; i++) {
    const prevPoint = smoothedChartData[i - 1];
    const currPoint = smoothedChartData[i];
    const distance = currPoint.distance - prevPoint.distance;
    const elevationDifference = currPoint.elevation - prevPoint.elevation;
    const grade = elevationDifference / distance;
    segments.push({ from: prevPoint, to: currPoint, distance, elevationDifference, grade });
  }

  // Generate alternating colors for the inflection sections
  const inflectionColors = ['rgba(255, 200, 100, 0.2)', 'rgba(100, 200, 255, 0.2)'];

  // Calculate selected range metrics
  const selectedStartIndex = sliderValues[0];
  const selectedEndIndex = sliderValues[1];

  const selectedElevations = elevations.slice(selectedStartIndex, selectedEndIndex + 1);
  const selectedMinElevation = Math.min(...selectedElevations);
  const selectedMaxElevation = Math.max(...selectedElevations);

  const selectedStartDistance = chartData[selectedStartIndex].distance;
  const selectedEndDistance = chartData[selectedEndIndex].distance;
  const selectedDistance = selectedEndDistance - selectedStartDistance;

  // Get cumulative elevation gain for the selection using pre-computed values
  const selectedCumulativeGain = chartData[selectedEndIndex].cumulativeGain -
    (selectedStartIndex > 0 ? chartData[selectedStartIndex].cumulativeGain : 0);
  const selectedCumulativeLoss = chartData[selectedEndIndex].cumulativeLoss -
    (selectedStartIndex > 0 ? chartData[selectedStartIndex].cumulativeLoss : 0);

  // Handle slider change
  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setSliderValues(newValue as number[]);
  };

  const setSliderValuesFromEvent = (data: CategoricalChartState) => {
    const newIndex = data.activePayload?.[0].payload.index ?? 0 as number;
    const indices = [potentialSliderStart, newIndex].sort()
    setSliderValues(indices);
  }

  // The chart component to render
  const elevationChart = (
    <LineChart
      width={width}
      height={height}
      data={chartData}
      margin={{ top: 5, right: 5, left: 5, bottom: 15 }}
      onMouseDown={(data, event) => {
        event.preventDefault && event.preventDefault();
        setPotentialSliderStart(data.activePayload?.[0].payload.index ?? 0 as number);
      }}
      onMouseUp={(data, event) => {
        event.preventDefault && event.preventDefault();
        setSliderValuesFromEvent(data);
      }}
      onMouseMove={(data, event) => {
        event.preventDefault && event.preventDefault();
        if (event.buttons || event.force) {
          setSliderValuesFromEvent(data);
        }
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

      {/* Create reference areas between inflection points */}
      {segments.map((segment, index) => {
        const elevationChangeSign = segment.elevationDifference > 0 ? '+' : '';

        return (
          <React.Fragment key={`inflection-${index}`}>
            <ReferenceArea
              x1={segment.from.distance}
              x2={segment.to.distance}
              y1={Math.min(segment.from.elevation, segment.to.elevation) - 10}
              y2={Math.max(segment.from.elevation, segment.to.elevation) + 10}
              fill={inflectionColors[index % inflectionColors.length]}
              fillOpacity={0.5}
              strokeOpacity={1}
              stroke="black"
            >
              <Label
                value={`${segment.distance.toFixed(1)}km`}
                position="insideTop"
                style={{ fontSize: 9, fill: '#333', fontWeight: 'bold' }}
              />
              <Label
                value={`${elevationChangeSign}${segment.elevationDifference.toFixed(0)}m`}
                position="insideRight"
                style={{ fontSize: 9, fill: '#333', fontWeight: 'bold' }}
              />
            </ReferenceArea>
          </React.Fragment>
        );
      })}

      <Line
        type="monotone"
        dataKey="elevation"
        stroke="url(#gradient)"
        strokeWidth={2}
        dot={false}
        animationDuration={500}
      />
      <ReferenceArea
        x1={chartData[selectedStartIndex].distance}
        x2={chartData[selectedEndIndex].distance}
        strokeOpacity={0.3}
        fill="#08f"
        fillOpacity={0.3}
        isFront={true}
        strokeWidth={0}
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
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Distance</th>
              <th>Min</th>
              <th>Max</th>
              <th>Gain</th>
              <th>Loss</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Total</th>
              <td>{totalDistance.toFixed(2)}km</td>
              <td>{minElevation.toFixed(0)}m</td>
              <td>{maxElevation.toFixed(0)}m</td>
              <td>{cumulativeGain.toFixed(0)}m</td>
              <td>{Math.abs(cumulativeLoss).toFixed(0)}m</td>
            </tr>
            <tr>
              <th>Selection</th>
              <td>{selectedDistance.toFixed(2)}km</td>
              <td>{selectedMinElevation.toFixed(0)}m</td>
              <td>{selectedMaxElevation.toFixed(0)}m</td>
              <td>{selectedCumulativeGain.toFixed(0)}m</td>
              <td>{Math.abs(selectedCumulativeLoss).toFixed(0)}m</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ElevationProfile;