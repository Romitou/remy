import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  convertTime12to24,
  frenchMealPeriod,
  isMealPeriod,
  isValidDateFormat,
  normalizeDate,
} from '../src/core/utils';

describe('convertTime12to24', () => {
  it('converts AM and PM hours', () => {
    assert.equal(convertTime12to24('9:30 AM'), '09:30');
    assert.equal(convertTime12to24('1:15 PM'), '13:15');
    assert.equal(convertTime12to24('11:45 pm'), '23:45');
  });

  it('handles noon and midnight', () => {
    assert.equal(convertTime12to24('12:00 PM'), '12:00');
    assert.equal(convertTime12to24('12:30 AM'), '00:30');
  });

  it('keeps 24-hour times as is', () => {
    assert.equal(convertTime12to24('18:45'), '18:45');
  });
});

describe('normalizeDate', () => {
  it('converts YYYY-MM-DD to DD/MM/YYYY', () => {
    assert.equal(normalizeDate('2025-12-24'), '24/12/2025');
  });
});

describe('isValidDateFormat', () => {
  it('accepts valid DD/MM/YYYY dates', () => {
    assert.equal(isValidDateFormat('24/12/2025'), true);
    assert.equal(isValidDateFormat('29/02/2024'), true);
  });

  it('rejects malformed or impossible dates', () => {
    for (const value of ['2025-12-24', '24/12/25', '31/02/2025', '29/02/2025', '32/01/2025']) {
      assert.equal(isValidDateFormat(value), false, `value: ${value}`);
    }
  });
});

describe('meal periods', () => {
  it('recognizes known meal periods', () => {
    assert.equal(isMealPeriod('lunch'), true);
    assert.equal(isMealPeriod('brunch'), false);
  });

  it('translates meal periods regardless of case', () => {
    assert.equal(frenchMealPeriod('BREAKFAST'), 'Petit-déjeuner');
    assert.equal(frenchMealPeriod('lunch'), 'Déjeuner');
    assert.equal(frenchMealPeriod('Dinner'), 'Dîner');
  });
});
