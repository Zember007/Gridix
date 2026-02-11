import { describe, it, expect } from 'vitest';
import { parseViewMode, parseFloor, upsertViewMode } from '../hooks/useUrlState';

describe('parseViewMode', () => {
  it('returns facade by default when no param', () => {
    const params = new URLSearchParams('');
    expect(parseViewMode(params)).toBe('facade');
  });

  it('returns valid view mode from URL', () => {
    expect(parseViewMode(new URLSearchParams('view=list'))).toBe('list');
    expect(parseViewMode(new URLSearchParams('view=chess'))).toBe('chess');
    expect(parseViewMode(new URLSearchParams('view=floor-plan'))).toBe('floor-plan');
    expect(parseViewMode(new URLSearchParams('view=map'))).toBe('map');
    expect(parseViewMode(new URLSearchParams('view=favorites'))).toBe('favorites');
    expect(parseViewMode(new URLSearchParams('view=facade'))).toBe('facade');
  });

  it('returns facade for invalid view mode', () => {
    expect(parseViewMode(new URLSearchParams('view=invalid'))).toBe('facade');
    expect(parseViewMode(new URLSearchParams('view='))).toBe('facade');
  });
});

describe('parseFloor', () => {
  it('returns null when no param', () => {
    const params = new URLSearchParams('');
    expect(parseFloor(params)).toBeNull();
  });

  it('returns number for valid floor', () => {
    expect(parseFloor(new URLSearchParams('floor=5'))).toBe(5);
    expect(parseFloor(new URLSearchParams('floor=0'))).toBe(0);
    expect(parseFloor(new URLSearchParams('floor=-1'))).toBe(-1);
  });

  it('returns null for non-numeric floor', () => {
    expect(parseFloor(new URLSearchParams('floor=abc'))).toBeNull();
    expect(parseFloor(new URLSearchParams('floor='))).toBeNull();
  });
});


describe('upsertViewMode', () => {
  it('sets view=list and preserves other params', () => {
    const params = new URLSearchParams('floor=12&rooms=2');
    const next = upsertViewMode(params, 'list');

    expect(next.get('view')).toBe('list');
    expect(next.get('floor')).toBe('12');
    expect(next.get('rooms')).toBe('2');
  });

  it('removes view when facade mode is selected', () => {
    const params = new URLSearchParams('view=map&floor=4');
    const next = upsertViewMode(params, 'facade');

    expect(next.get('view')).toBeNull();
    expect(next.get('floor')).toBe('4');
  });
});
