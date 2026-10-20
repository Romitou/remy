import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  exampleVisitDate,
  formatApiDate,
  parseVisitDate,
  toApiDate,
  VisitDateResult,
} from '../src/lib/dates';

// Fixed "today" for deterministic tests: Tuesday 20 October 2026
const NOW = new Date(2026, 9, 20, 15, 30);

function apiDate(result: VisitDateResult): string | null {
  return result.ok ? toApiDate(result.date) : null;
}

describe('parseVisitDate', () => {
  it('accepts full dates with various separators', () => {
    for (const input of ['24/12/2026', '24-12-2026', '24.12.2026', '24 12 2026', ' 24/12/2026 ']) {
      assert.equal(apiDate(parseVisitDate(input, NOW)), '2026-12-24', `input: ${input}`);
    }
  });

  it('accepts short years and single digits', () => {
    assert.equal(apiDate(parseVisitDate('24/12/26', NOW)), '2026-12-24');
    assert.equal(apiDate(parseVisitDate('5/1/2027', NOW)), '2027-01-05');
  });

  it('uses the next occurrence when the year is omitted', () => {
    assert.equal(apiDate(parseVisitDate('24/12', NOW)), '2026-12-24');
    assert.equal(apiDate(parseVisitDate('14/02', NOW)), '2027-02-14');
    assert.equal(apiDate(parseVisitDate('20/10', NOW)), '2026-10-20');
  });

  it('rejects invalid dates', () => {
    for (const input of ['', 'demain', '2026-12-24', '31/02/2027', '29/02/2027', '32/01', '1/13']) {
      assert.deepEqual(
        parseVisitDate(input, NOW),
        { ok: false, reason: 'invalid' },
        `input: ${input}`,
      );
    }
  });

  it('rejects past and too distant dates', () => {
    assert.deepEqual(parseVisitDate('19/10/2026', NOW), { ok: false, reason: 'past' });
    assert.deepEqual(parseVisitDate('24/12/2028', NOW), { ok: false, reason: 'too_far' });
  });

  it('accepts today', () => {
    assert.equal(apiDate(parseVisitDate('20/10/2026', NOW)), '2026-10-20');
  });
});

describe('date formatting', () => {
  it('formats API dates for humans in French', () => {
    assert.equal(formatApiDate('2026-12-24'), 'jeudi 24 décembre 2026');
    assert.equal(formatApiDate('not a date'), 'not a date');
  });

  it('suggests an example date in the future', () => {
    assert.equal(exampleVisitDate(NOW), '19/11/2026');
  });
});
