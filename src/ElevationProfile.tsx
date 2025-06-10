import React, { useEffect, useState, useMemo, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Label, ReferenceDot, ReferenceArea } from 'recharts';
import * as GeoJson from "./geojson-types";
import { distance, Feature } from '@turf/turf';
import { Slider, Typography, Button, CircularProgress } from '@mui/material';
import { CategoricalChartState } from 'recharts/types/chart/types';
import { DataContext } from './dataContext';
import { simplifyLineString } from './geojson-calc';

interface ElevationProfileProps {
  feature: GeoJson.Feature;
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
  metabolicFactor: number;
}

export const ElevationProfileWrapper: React.FC<ElevationProfileProps> = ({
  feature,
  useResponsiveContainer = false,
  width = 220,
  height = 100
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatedFeature, setUpdatedFeature] = useState<GeoJson.Feature | null>(null);

  // Function to fetch elevation data from Google Elevation API
  const fetchElevationData = async (feature: GeoJson.Feature) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (!process.env.REACT_APP_ELEVATION_API_URL) {
        throw new Error("Elevation API URL is not defined");
      }

      const response = await fetch(process.env.REACT_APP_ELEVATION_API_URL,
        {
          method: 'POST',
          body: JSON.stringify(feature),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const data: GeoJson.Feature = await response.json();
      console.log(data);
      setUpdatedFeature(data);
    } catch (error) {
      console.error("Failed to fetch elevation data:", error);
      setErrorMessage(`Failed to fetch elevation data: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center' }}><CircularProgress /></div>;
  }

  if (errorMessage) {
    return <div style={{ textAlign: 'center', color: 'red' }}>{errorMessage}</div>;
  }

  if (!feature || !feature.geometry || !feature.geometry.coordinates || !feature.geometry.type
    || (feature.geometry.type !== GeoJson.GeometryType.LineString && feature.geometry.type !== GeoJson.GeometryType.MultiLineString)
    || !feature.geometry.coordinates.length
  ) {
    return <div>Invalid geometry</div>;
  }

  if (!updatedFeature) {
    const coordinates = feature.geometry.type === GeoJson.GeometryType.LineString ? feature.geometry.coordinates : feature.geometry.coordinates.flat() as number[][];
    if (coordinates.some(coord => coord.length < 3)) {
      fetchElevationData(feature);
    }
  }

  return <ElevationProfile feature={updatedFeature ?? feature} useResponsiveContainer={useResponsiveContainer} width={width} height={height} />;
}

const ElevationProfile: React.FC<ElevationProfileProps> = ({
  feature,
  useResponsiveContainer = false,
  width = 220,
  height = 100
}) => {
  const context = useContext(DataContext);

  // Extract coordinates based on geometry type
  const geometry = feature.geometry;
  let rawCoordinates: number[][] = [];
  if (geometry.type === GeoJson.GeometryType.LineString) {
    rawCoordinates = geometry.coordinates as number[][];
  } else if (geometry.type === GeoJson.GeometryType.MultiLineString) {
    // Flatten MultiLineString coordinates
    rawCoordinates = (geometry.coordinates as number[][][]).flat();
  }
  const coordinates = rawCoordinates.filter(c => c.length >= 3); // Filter out points without elevation data

  // Add slider state
  const [potentialSliderStart, setPotentialSliderStart] = useState<number>(0);
  const [sensitivity, setSensitivity] = useState<number>(10);

  // Create data for the chart, including cumulative elevation gain
  const { chartData, totalDistance, cumulativeGain, cumulativeLoss, minElevation, maxElevation } = useMemo(() => {
    const chartData: ChartDataPoint[] = [];
    let totalDistance = 0;
    let cumulativeGain = 0;
    let cumulativeLoss = 0;
    let minElevation = Infinity;
    let maxElevation = -Infinity;

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

        if (currCoord[2] < minElevation) {
          minElevation = currCoord[2];
        }
        if (currCoord[2] > maxElevation) {
          maxElevation = currCoord[2];
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

    const simplifiedChartData = douglasPeucker(chartData, 1).map((p, i) => ({ ...p, index: i }));

    return { chartData: simplifiedChartData, totalDistance, cumulativeGain, cumulativeLoss, minElevation, maxElevation };
  }, [coordinates]);

  const [sliderValues, setSliderValues] = useState<number[]>([0, chartData.length - 1]);

  // Calculate precision based on the sensitivity slider value
  // Lower sensitivity = higher precision value = fewer points in the simplified curve
  // Higher sensitivity = lower precision value = more points in the simplified curve
  const elevationRange = maxElevation - minElevation;
  const precisionValue = (elevationRange * (1 / sensitivity));

  const segments = useMemo(() => {
    // Update the chart data when sensitivity changes
    const smoothedChartData = douglasPeucker(chartData, precisionValue);

    // identify peaks and valleys from the smoothed data
    let segments: Segment[] = [];
    for (let i = 1; i < smoothedChartData.length; i++) {
      const prevPoint = smoothedChartData[i - 1];
      const currPoint = smoothedChartData[i];
      const distance = currPoint.distance - prevPoint.distance;
      const elevationDifference = currPoint.elevation - prevPoint.elevation;
      const grade = elevationDifference / distance / 1000;
      const clampedGrade = Math.max(-.45, Math.min(grade, .45)); // Clamp grade to -45% to 45%
      const metabolicFactor = (155.4 * Math.pow(clampedGrade, 5) - 30.4 * Math.pow(clampedGrade, 4) - 43.3 * Math.pow(clampedGrade, 3) + 46.3 * Math.pow(clampedGrade, 2) + 19.5 * clampedGrade + 3.6) / 3.6
      segments.push({ from: prevPoint, to: currPoint, distance, elevationDifference, grade, metabolicFactor });
    }
    return segments;
  }, [chartData, precisionValue]);

  // Generate alternating colors for the inflection sections
  const inflectionColors = ['rgba(255, 200, 100, 0.2)', 'rgba(100, 200, 255, 0.2)'];

  // Calculate selected range metrics
  const selectedStartIndex = sliderValues[0];
  const selectedEndIndex = sliderValues[1];

  let selectedMinElevation = Infinity;
  let selectedMaxElevation = -Infinity;
  for (let i = selectedStartIndex; i <= selectedEndIndex; i++) {
    const elevation = chartData[i].elevation;
    if (elevation < selectedMinElevation) {
      selectedMinElevation = elevation;
    }
    if (elevation > selectedMaxElevation) {
      selectedMaxElevation = elevation;
    }
  }

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
        context?.setDetailFeature({
          feature: context?.detailFeature?.feature,
          cursor: data.activePayload?.[0].payload.coordinate,
        })
        if (event.buttons || event.force) {
          setSliderValuesFromEvent(data);
        }
      }}
      onMouseLeave={() => {
        context?.setDetailFeature({
          feature: context?.detailFeature?.feature,
          cursor: undefined,
        });
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
              y1={Math.min(segment.from.elevation, segment.to.elevation)}
              y2={Math.max(segment.from.elevation, segment.to.elevation)}
              fill={inflectionColors[segment.elevationDifference > 0 ? 0 : 1]}
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
                angle={90}
                style={{ fontSize: 9, fill: '#333', fontWeight: 'bold' }}
              />
              <Label
                value={`${(segment.grade * 100).toFixed(0)}%`}
                position="insideBottom"
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
        x1={selectedStartDistance}
        x2={selectedEndDistance}
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
          max={chartData.length - 1}
          valueLabelFormat={(index) => `${chartData[index].distance}km`}
        />
      </div>
      <div style={{ padding: '15px 10px 5px 10px' }}>
        <Typography variant="caption">Sensitivity</Typography>
        <Slider
          value={sensitivity}
          onChange={(event, newValue) => setSensitivity(newValue as number)}
          valueLabelDisplay="auto"
          min={1}
          max={20}
        />
      </div>
      <StatisticsTable
        totalDistance={totalDistance}
        minElevation={minElevation}
        maxElevation={maxElevation}
        cumulativeGain={cumulativeGain}
        cumulativeLoss={cumulativeLoss}
        selectedDistance={selectedDistance}
        selectedMinElevation={selectedMinElevation}
        selectedMaxElevation={selectedMaxElevation}
        selectedCumulativeGain={selectedCumulativeGain}
        selectedCumulativeLoss={selectedCumulativeLoss}
      />
      <SegmentsTable segments={segments} />
    </div>
  );
};

interface SegmentsTableProps {
  segments: Segment[];
}

const SegmentsTable: React.FC<SegmentsTableProps> = ({ segments }) => {
  const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
  const totalCumulativeGain = segments.reduce((sum, seg) => sum + (seg.to.cumulativeGain - seg.from.cumulativeGain), 0);
  const totalMetabolicDistance = segments.reduce((sum, seg) => sum + (seg.distance * 1000 * seg.metabolicFactor), 0);
  return (
    <table className="elevation-profile-table">
      <thead>
        <tr>
          <th>Segment</th>
          <th>From</th>
          <th>To</th>
          <th>Distance</th>
          <th>Starting Elevation</th>
          <th>Ending Elevation</th>
          <th>Net Gain</th>
          <th>Grade</th>
          <th>Gross Gain</th>
          <th>Metabolic Factor</th>
          <th>Metabolic Distance (m)</th>
        </tr>
        <tr>
          <th>All</th>
          <th>0</th>
          <th>{totalDistance.toFixed(3)}km</th>
          <th>{totalDistance.toFixed(3)}km</th>
          <th>{segments[0].from.elevation.toFixed(0)}m</th>
          <th>{segments[segments.length - 1].to.elevation.toFixed(0)}m</th>
          <th>{(segments[segments.length - 1].to.elevation - segments[0].from.elevation).toFixed(0)}m</th>
          <th>N/A</th>
          <th>{totalCumulativeGain.toFixed(0)}m</th>
          <th>{(totalMetabolicDistance / totalDistance / 1000).toFixed(3)}</th>
          <th>{totalMetabolicDistance.toFixed(0)}</th>
        </tr>
      </thead>
      <tbody>
        {segments.map((segment, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{segment.from.distance.toFixed(3)}km</td>
            <td>{segment.to.distance.toFixed(3)}km</td>
            <td>{segment.distance.toFixed(3)}km</td>
            <td>{segment.from.elevation.toFixed(0)}m</td>
            <td>{segment.to.elevation.toFixed(0)}m</td>
            <td>{segment.elevationDifference.toFixed(0)}m</td>
            <td>{(segment.grade * 100).toFixed(0)}%</td>
            <td>{(segment.to.cumulativeGain - segment.from.cumulativeGain).toFixed(0)}</td>
            <td>{segment.metabolicFactor.toFixed(3)}</td>
            <td>{(segment.distance * 1000 * segment.metabolicFactor).toFixed(0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

interface StatisticsTableProps {
  totalDistance: number;
  minElevation: number;
  maxElevation: number;
  cumulativeGain: number;
  cumulativeLoss: number;
  selectedDistance: number;
  selectedMinElevation: number;
  selectedMaxElevation: number;
  selectedCumulativeGain: number;
  selectedCumulativeLoss: number;
}

const StatisticsTable: React.FC<StatisticsTableProps> = ({
  totalDistance, minElevation, maxElevation,
  cumulativeGain, cumulativeLoss,
  selectedDistance, selectedMinElevation, selectedMaxElevation,
  selectedCumulativeGain, selectedCumulativeLoss
}) => {
  return <table className="elevation-profile-table">
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

export default ElevationProfile;