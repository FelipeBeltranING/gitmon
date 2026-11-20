import { describe, expect, it } from 'vitest';
import { activeSeason, EDITION, editionLabel, SEASON } from '../src/config';

describe('edición', () => {
  it('la semilla oficial se presenta como la primera edición', () => {
    expect(editionLabel(SEASON)).toBe(EDITION);
    expect(EDITION).toBe('Primera edición');
  });

  it('otra semilla se marca como prueba', () => {
    expect(editionLabel('4')).toBe('Prueba · semilla 4');
  });

  it('?t= solo acepta números', () => {
    expect(activeSeason('?t=4')).toBe('4');
    expect(activeSeason('?t=<script>')).toBe(SEASON);
    expect(activeSeason('')).toBe(SEASON);
  });
});
