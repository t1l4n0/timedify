/**
 * Calculates the percentile value from an array of numbers.
 * Uses the standard percentile calculation: P = (n-1) * p/100 + 1
 * 
 * @param values - Array of numeric values
 * @param p - Percentile to calculate (0-100)
 * @returns The value at the specified percentile
 */
export function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a,b) => a-b);
  const n = sorted.length;
  const index = (n - 1) * (p / 100);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  
  if (lower === upper) {
    return sorted[lower];
  }
  
  // Linear interpolation between the two values
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
