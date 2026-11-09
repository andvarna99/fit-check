/** Move `delta` steps through `length` items, wrapping at both ends. Returns 0 for an empty list. */
export function cycleIndex(index: number, delta: number, length: number): number {
  if (length <= 0) return 0;
  return (((index + delta) % length) + length) % length;
}
