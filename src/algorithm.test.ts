import {setEquals} from './algorithm'

describe('setEquals', () => {
  it.each<[[number[], number[]], boolean]>([
    // test equal sets of different sizes
    [[[],[]],true],
    [[[1],[1]],true],
    [[[1,2],[1,2]],true],
    // test equal sets with different order
    [[[1,2],[2,1]],true],
    // test different sized arrays
    [[[1,2],[1]],false],
    [[[1],[2,1]],false],
    // test same sized array with different elements
    [[[1,3],[2,1]],false],
  ])('ar(%p) = %p', (args:[number[],number[]], expected:boolean) => {
    const res = setEquals(...args);
    expect(res).toBe(expected);
  });
});