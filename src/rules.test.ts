import { describe, it, expect } from 'vitest';
import { matchesAnyRule } from './rules';

describe('matchesAnyRule', () => {
  it('hides a make match', () => {
    expect(matchesAnyRule('Toyota Celica', [{ id: 1, value: 'Toyota' }])).toBe(true);
  });

  it('hides a full title match', () => {
    expect(matchesAnyRule('Toyota Celica', [{ id: 1, value: 'Toyota Celica' }])).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(matchesAnyRule('toyota celica', [{ id: 1, value: 'Toyota' }])).toBe(true);
  });

  it('does not hide a non-matching title', () => {
    expect(matchesAnyRule('Ford Focus', [{ id: 1, value: 'Toyota' }])).toBe(false);
  });

  it('does not hide when rules list is empty', () => {
    expect(matchesAnyRule('Toyota Celica', [])).toBe(false);
  });

  it('does not hide an empty title', () => {
    expect(matchesAnyRule('', [{ id: 1, value: 'Toyota' }])).toBe(false);
  });

  it('matches multi-word makes like Land Rover', () => {
    expect(matchesAnyRule('Land Rover Defender', [{ id: 1, value: 'Land Rover' }])).toBe(true);
  });

  it('matches the first of multiple rules', () => {
    const rules = [{ id: 1, value: 'BMW' }, { id: 2, value: 'Toyota' }];
    expect(matchesAnyRule('Toyota GR86', rules)).toBe(true);
  });

  it('does not partially match a different make', () => {
    expect(matchesAnyRule('Seat Leon', [{ id: 1, value: 'Aston Martin' }])).toBe(false);
  });
});
