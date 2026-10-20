import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildCustomId, customIdArgs, customIdPrefix, parsePositiveInt } from '../src/lib/customId';

describe('customIdArgs', () => {
  it('returns the parts after the prefix', () => {
    assert.deepEqual(customIdArgs('validateNotification-12,3-24/12/2025-4-lunch'), [
      '12,3',
      '24/12/2025',
      '4',
      'lunch',
    ]);
  });

  it('returns an empty list when there are no arguments', () => {
    assert.deepEqual(customIdArgs('myNotifications'), []);
  });
});

describe('parsePositiveInt', () => {
  it('parses positive integers', () => {
    assert.equal(parsePositiveInt('42'), 42);
  });

  it('rejects invalid values', () => {
    for (const value of [undefined, '', '0', '-1', '1.5', '4a', ' 4', 'NaN']) {
      assert.equal(parsePositiveInt(value), null, `value: ${value}`);
    }
  });
});

describe('buildCustomId', () => {
  it('joins the prefix and arguments, which can be read back', () => {
    const customId = buildCustomId('openAlertForm', 12, 0);
    assert.equal(customId, 'openAlertForm-12-0');
    assert.equal(customIdPrefix(customId), 'openAlertForm');
    assert.deepEqual(customIdArgs(customId), ['12', '0']);
  });
});
