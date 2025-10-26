import { describe, it, expect } from 'vitest';
import { percentile } from '../stats';

describe('percentile', () => {
  it('calculates p75 correctly', () => {
    const values = [100, 200, 300, 400];
    expect(percentile(values, 75)).toBe(325); // Linear interpolation between 300 and 400
  });

  it('handles empty array', () => {
    expect(percentile([], 75)).toBe(0);
  });

  it('calculates p50 (median) correctly', () => {
    const values = [100, 200, 300, 400, 500];
    expect(percentile(values, 50)).toBe(300);
  });

  it('calculates p95 correctly', () => {
    const values = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    expect(percentile(values, 95)).toBe(955); // Linear interpolation between 900 and 1000
  });

  it('calculates p100 (max) correctly', () => {
    const values = [100, 200, 300, 400];
    expect(percentile(values, 100)).toBe(400);
  });

  it('calculates p0 (min) correctly', () => {
    const values = [100, 200, 300, 400];
    expect(percentile(values, 0)).toBe(100);
  });
});
