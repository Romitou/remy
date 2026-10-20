import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  convertTime12to24,
  formatPartyMix,
  frenchMealPeriod,
  isMealPeriod,
  normalizeText,
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

describe('formatPartyMix', () => {
  it('uses the singular for one person', () => {
    assert.equal(formatPartyMix(1), '1 personne');
    assert.equal(formatPartyMix(4), '4 personnes');
  });
});

describe('normalizeText', () => {
  it('ignores case and accents', () => {
    assert.equal(normalizeText('  Bistrot Chez Rémy '), 'bistrot chez remy');
  });
});
