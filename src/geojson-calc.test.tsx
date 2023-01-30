import * as gj from './geojson-types'
import * as gc from './geojson-calc';

describe('distance', () => {
  it.each<[[gj.Coordinate,gj.Coordinate],number]>([
    // Test that the length of a minute of latitude is roughly correct at any latitude.
    // In reality, this varies (longer near the poles and smaller near the equator).
    // Source for distances of degrees of latitude:
    // https://www.thoughtco.com/degree-of-latitude-and-longitude-distance-4070616
    // distance() is using a spherical formula, so it will always give the same answer 1853.25m,
    // but that answer should be near the truth.
    // Remember that GeoJson coordinates given here at [lon,lat].
    [[[0,0],[0,0+1/60]],1842.78],
    [[[0,23.5],[0,23.5+1/60]],1849.13],
    [[[0,90],[0,90-1/60]],1861.65],
    [[[90,90],[90,90-1/60]],1861.65], // test at 90lon to ensure I didn't mix up lat and lon
    // Test that the length of a minute of longitude is roughly correct at any latitude.
    [[[0,0],[0+1/60,0]],1855.35],
    [[[0,40],[0+1/60,40]],1421],
    [[[0,90],[0+1/60,90]],0],
  ])('distance(%p) = %p', (args:[gj.Coordinate,gj.Coordinate], expected:number) => {
    const res = gc.distance(...args);
    if (expected === 0) {
      expect(res).toBeCloseTo(expected,9);
    } else {
      const percentError = 100*(res-expected)/expected;
      expect(percentError).toBeLessThan(1);
    }
  });
});

describe('simplify', () => {
  it.each<[[gj.Feature,number],gj.Feature]>([
    // test that rounding to nearest tenth-degree works, keeps properties
    [
      [{type:gj.FeatureType.Feature,properties:{name:"REI"},geometry:{type:gj.GeometryType.Point,coordinates:[-122.46600,47.22229]}},
      1852*6],
      {type:gj.FeatureType.Feature,properties:{name:"REI"},geometry:{type:gj.GeometryType.Point,coordinates:[-122.5,47.2]}},
    ],
  ])('simplify(%p) = %p', (args:[gj.Feature,number], expected:gj.Feature) => {
    const res = gc.simplify(...args);
    expect(res).toStrictEqual(expected);
  });
});