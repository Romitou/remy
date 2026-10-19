import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bookNotificationSchema } from '../src/typings/bookAlerts';

const validNotification = {
  alertId: 12,
  discordId: '123456789012345678',
  restaurant: { id: 1, name: 'Bistrot Chez Rémy', imageUrl: 'https://example.com/remy.jpg' },
  date: '2025-12-24',
  mealPeriod: 'DINNER',
  partyMix: 4,
  hours: ['7:00 PM', '7:30 PM'],
};

describe('bookNotificationSchema', () => {
  it('accepts a valid notification', () => {
    assert.equal(bookNotificationSchema.safeParse(validNotification).success, true);
  });

  it('rejects a notification with missing or invalid fields', () => {
    const { discordId: _discordId, ...withoutDiscordId } = validNotification;
    assert.equal(bookNotificationSchema.safeParse(withoutDiscordId).success, false);
    assert.equal(
      bookNotificationSchema.safeParse({ ...validNotification, partyMix: '4' }).success,
      false,
    );
  });
});
