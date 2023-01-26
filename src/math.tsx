// sin of a in degrees
export function dsin(a:number) : number {
  return Math.sin(a * Math.PI / 180.0);
}
// cos of a in degrees
export function dcos(a:number) : number {
  return Math.cos(a * Math.PI / 180.0);
}

// get the resulting point from traveling r distance from (0,0) at angle a in degrees
export function ar(a:number, r:number) : [number, number] {
  return [r*dsin(a), r*dcos(a)]
}

// sum a number array
export function sum(a:number[]) : number {
  return a.reduce((s,v)=>s+v,0);
}

export default {
  dsin,
  dcos,
  ar,
  sum,
}