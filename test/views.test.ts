import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  alertDetailView,
  alertFormModal,
  alertListView,
  alertSavedView,
  restaurantPickerView,
  View,
} from '../src/lib/views';
import { Restaurant } from '../src/typings/restaurants';
import { RestaurantAlert } from '../src/typings/bookAlerts';

const restaurants: Restaurant[] = Array.from({ length: 60 }, (_, index) => ({
  id: index + 1,
  name: `Restaurant ${index + 1} avec un nom particulièrement long pour tester les limites`,
  disneyId: `R${index + 1}`,
  imageUrl: 'https://example.com/image.jpg',
  displayed: true,
}));

const alert = (id: number, restaurantId: number): RestaurantAlert => ({
  id,
  checks: [
    {
      id,
      alertId: id,
      restaurantId,
      checkedAt: '',
      checkCount: 0,
      errorCount: 0,
      createdAt: '',
      updatedAt: '',
    },
  ],
  discordId: '1',
  date: '2026-12-24',
  mealPeriod: 'DINNER',
  partyMix: 4,
  completed: false,
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
});

/**
 * Check the limits enforced by Discord on message components
 */
function assertValidComponents(view: View): void {
  const customIds = new Set<string>();
  for (const row of view.components) {
    assert.ok(row.components.length <= 5, 'at most 5 components per row');
    for (const component of row.components) {
      if ('custom_id' in component) {
        assert.ok(component.custom_id.length <= 100, `customId too long: ${component.custom_id}`);
        assert.ok(
          !customIds.has(component.custom_id),
          `duplicate customId: ${component.custom_id}`,
        );
        customIds.add(component.custom_id);
      }
      if ('options' in component) {
        assert.ok(component.options.length <= 25, 'at most 25 options');
      }
    }
  }
  assert.ok(view.components.length <= 5, 'at most 5 rows');
}

describe('restaurantPickerView', () => {
  it('paginates restaurants', () => {
    const view = restaurantPickerView(restaurants, { page: 3 });
    assertValidComponents(view);
    assert.equal(view.embeds[0].footer?.text, 'Page 3/3 · 60 restaurants');
  });

  it('clamps out of range pages', () => {
    assert.equal(
      restaurantPickerView(restaurants, { page: 99 }).embeds[0].footer?.text,
      'Page 3/3 · 60 restaurants',
    );
  });

  it('shows search results without pagination', () => {
    const view = restaurantPickerView(restaurants.slice(0, 2), { query: 'restaurant' });
    assertValidComponents(view);
    assert.match(view.embeds[0].description ?? '', /2\*\* restaurant\(s\)/);
  });

  it('handles searches without results', () => {
    const view = restaurantPickerView([], { query: 'xyz' });
    assertValidComponents(view);
    assert.match(view.embeds[0].description ?? '', /Aucun restaurant/);
  });
});

describe('alertFormModal', () => {
  it('builds a valid prefilled modal with a short enough title', () => {
    const modal = alertFormModal(
      restaurants[0],
      { date: '24/12', partyMix: '4', mealPeriod: 'lunch' },
      12,
    ).toJSON();
    assert.ok(modal.title.length <= 45);
    assert.equal(modal.custom_id, 'alertForm-1-12');
    assert.equal(modal.components.length, 3);
  });
});

describe('alert views', () => {
  const byId = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));

  it('lists alerts, including ones whose restaurant is unknown', () => {
    const view = alertListView([alert(1, 1), alert(2, 999)], byId, 'Alerte supprimée');
    assertValidComponents(view);
    assert.equal(view.embeds[0].fields?.length, 2);
    assert.match(view.embeds[0].fields?.[1].name ?? '', /Restaurant inconnu/);
    assert.match(view.embeds[0].description ?? '', /^Alerte supprimée/);
  });

  it('offers to create an alert when there is none', () => {
    const view = alertListView([], byId);
    assertValidComponents(view);
    assert.match(view.embeds[0].description ?? '', /aucune alerte/);
  });

  it('shows alert details with edit and delete actions', () => {
    const view = alertDetailView(alert(1, 1), restaurants[0]);
    assertValidComponents(view);
    assert.equal(view.components[0].components.length, 3);
  });

  it('warns when DMs are closed', () => {
    const summary = {
      restaurantName: 'Bistrot Chez Rémy',
      date: '2026-12-24',
      mealPeriod: 'dinner',
      partyMix: 2,
    };
    const open = alertSavedView(1, summary, { edited: false, dmOpen: true });
    const closed = alertSavedView(1, summary, { edited: false, dmOpen: false });
    assertValidComponents(open);
    assert.equal(open.embeds[0].fields?.length, 4);
    assert.equal(closed.embeds[0].fields?.length, 5);
  });
});
