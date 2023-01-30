import { YieldExpression } from 'typescript';
import {dsin,dcos,dasin,datan2,ar,sum,numberTransform,mapMin,dotProduct,crossProduct,L2norm,scalarProduct,normalize} from './math'

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

describe('dasin', () => {
  it.each([
    [-1,-90],
    [-0.5,-30],
    [0,0],
    [0.5,30],
    [1,90],
  ])('dasin(%p) = %p', (a: number, expected: number) => {
    expect(dasin(a)).toBeCloseTo(expected,9);
  });
});

describe('datan2', () => {
  it.each<[[number,number],number]>([
    [[-1,-Math.sqrt(3)],-150],
    [[-1,-1],-135],
    [[-Math.sqrt(3),-1],-120],
    [[-1, 0],-90],
    [[-Math.sqrt(3),1],-60],
    [[-3,3],-45],
    [[-1,Math.sqrt(3)],-30],
    [[0,1],0],
    [[1,Math.sqrt(3)],30],
    [[1,1],45],
    [[Math.sqrt(3),1],60],
    [[1,0],90],
    [[Math.sqrt(3),-1],120],
    [[1,-1],135],
    [[1,-Math.sqrt(3)],150],
    [[0,-1],180],
  ])('datan2(%p) = %p', (args: [number,number], expected: number) => {
    expect(datan2(...args)).toBeCloseTo(expected,9);
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

describe('sum', () => {
  it.each<[number[],number]>([
    [[],0],
    [[1],1],
    [[1,-1],0],
    [[1,2,3,4],10],
  ])('sum(%p) = %p', (args:number[], expected:number) => {
    const res = sum(args);
    expect(res).toBe(expected);
  });
});

describe('mapMin', () => {
  it.each<[[string[],numberTransform<string>],number]>([
    [[["1","2","3","4"],(d:string)=>Number(d)],1],
  ])('mapMin(%p) = %p', (args:[string[],numberTransform<string>], expected:number) => {
    const [list, f] = args;
    const res = mapMin(list, f);
    expect(res).toBe(expected);
  });
});

describe('dotProduct', () => {
  it.each<[[number[],number[]],number]>([
    [[[1,2],[3,4]],11],
    [[[5,6,7],[8,9,10]],40+54+70],
  ])('dotProduct(%p) = %p', (args:[number[],number[]], expected:number) => {
    const res = dotProduct(...args);
    expect(res).toBe(expected);
  });
});

describe('crossProduct', () => {
  it.each<[[[number,number,number],[number,number,number]],[number,number,number]]>([
    // test the unit normal vectors
    [[[1,0,0],[0,1,0]],[0,0,1]], // i x j = k
    [[[0,1,0],[0,0,1]],[1,0,0]], // j x k = i
    [[[0,0,1],[1,0,0]],[0,1,0]], // k x i = j
    // test anticommutativity
    [[[0,1,0],[1,0,0]],[0,0,-1]], // j x i = -k
  ])('crossProduct(%p) = %p', (args:[[number,number,number],[number,number,number]], expected:[number,number,number]) => {
    const res = crossProduct(...args);
    res.map((val,i) => expect(val).toBe(expected[i]));
  });
});

describe('L2norm', () => {
  it.each<[number[],number]>([
    // zero length
    [[0,0],0],
    // four quadrants
    [[1,0],1],
    [[0,1],1],
    [[-1,0],1],
    [[0,-1],1],
    // other vectors
    [[3,4],5],
    [[4,3],5],
  ])('L2norm(%p) = %p', (args:number[], expected:number) => {
    const res = L2norm(args);
    expect(res).toBe(expected);
  });
});

describe('scalarProduct', () => {
  it.each<[[number[],number],number[]]>([
    [[[0,0],2],[0,0]],
    [[[1,0],2],[2,0]],
    [[[0,1],-2],[0,-2]],
    [[[-1,1],3],[-3,3]],
    [[[1,-1],3],[3,-3]],
  ])('scalarProduct(%p) = %p', (args:[number[],number], expected:number[]) => {
    const res = scalarProduct(...args);
    res.map((val,i) => expect(val).toBe(expected[i]));
  });
});

describe('normalize', () => {
  it.each<[number[],number[]]>([
    [[1,0],[1,0]],
    [[0,1],[0,1]],
    [[0,-1],[0,-1]],
    [[-1,0],[-1,0]],
    [[1,1],[Math.sqrt(2)/2,Math.sqrt(2)/2]],
  ])('normalize(%p) = %p', (args:number[], expected:number[]) => {
    const res = normalize(args);
    res.map((val,i) => expect(val).toBeCloseTo(expected[i],9));
  });
});
