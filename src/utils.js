// @flow

import * as assert from "assert";

export class NotImplementedError extends Error {}

export function last<T>(xs: Array<T>): T {
  return xs[xs.length - 1];
}

export function range(low: number, high: number): Array<number> {
  return Array.from(new Array(high - low), (x, i) => i + low);
}

export function flatten<T>(xs: Array<Array<T>>): Array<T> {
  return [].concat(...xs);
}

export function unweave<T>(xs: Array<T>): [Array<T>, Array<T>] {
  const result = [[], []];
  xs.forEach((x, i) => {
    result[i % 2].push(x);
  });
  return result;
}

export function interleave<T>(xs: Array<T>, ys: Array<T>): Array<T> {
  assert.ok(xs.length === ys.length || xs.length === ys.length + 1);
  const result = [];
  for (let i = 0; i < Math.min(xs.length, ys.length); i += 1) {
    result.push(xs[i]);
    result.push(ys[i]);
  }
  if (xs.length > ys.length) {
    result.push(last(xs));
  }
  return result;
}

export { assert };
