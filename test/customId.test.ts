import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { customIdArgs, parseIdList, parsePositiveInt } from '../src/lib/customId';

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

describe('parseIdList', () => {
  it('parses comma-separated ids', () => {
    assert.deepEqual(parseIdList('1,22,333'), [1, 22, 333]);
  });

  it('rejects the whole list if one id is invalid', () => {
    assert.equal(parseIdList('1,abc,3'), null);
    assert.equal(parseIdList('1,,3'), null);
    assert.equal(parseIdList(''), null);
    assert.equal(parseIdList(undefined), null);
  });
});
