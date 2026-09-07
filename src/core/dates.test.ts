import { expect, it } from 'vitest';
import { isoDate } from './dates';

it('formats a local date', () => {
	expect(isoDate(new Date(2026, 8, 7, 23, 59))).toBe('2026-09-07');
	expect(isoDate(new Date(2026, 0, 1))).toBe('2026-01-01');
});
