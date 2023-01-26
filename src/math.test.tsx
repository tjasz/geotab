import {dsin,dcos,ar} from './math'

describe('dsin', () => {
  it.each([
    // multiples of 90 for positive and negative numbers
    [-360,0],
    [-270,1],
    [-180,0],
    [-90,-1],
    [0,0],
    [90,1],
    [180,0],
    [270,-1],
    [360,0],
    // equivalents of 30 for positive numbers
    [30,0.5],
    [150,0.5],
    [210,-0.5],
    [330,-0.5],
  ])('dsin(%p) = %p', (a: number, expected: number) => {
    expect(dsin(a)).toBeCloseTo(expected,9);
  });
});

describe('dcos', () => {
  it.each([
    // multiples of 90 for positive and negative numbers
    [-360,1],
    [-270,0],
    [-180,-1],
    [-90,0],
    [0,1],
    [90,0],
    [180,-1],
    [270,0],
    [360,1],
    // equivalents of 60 for positive numbers
    [60,0.5],
    [120,-0.5],
    [240,-0.5],
    [300,0.5],
  ])('dcos(%p) = %p', (a: number, expected: number) => {
    expect(dcos(a)).toBeCloseTo(expected,9);
  });
});

describe('ar', () => {
  it.each<[[number,number],[number,number]]>([
    // ensure expanding radius increases result coordinates
    [[30,1],[0.5,Math.sqrt(3)/2]],
    [[30,2],[1,Math.sqrt(3)]],
    [[53.130102354195,5],[4,3]],
    // test a point in each quadrant
    [[120,2],[Math.sqrt(3),-1]],
    [[210,2],[-1,-Math.sqrt(3)]],
    [[330,2],[-1,Math.sqrt(3)]],
  ])('ar(%p) = %p', (args:[number,number], expected:[number,number]) => {
    const res = ar(...args);
    expect(res[0]).toBeCloseTo(expected[0],9);
    expect(res[1]).toBeCloseTo(expected[1],9);
  });
});
