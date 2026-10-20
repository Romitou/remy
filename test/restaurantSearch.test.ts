import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { searchRestaurants } from '../src/lib/restaurantSearch';
import { Restaurant } from '../src/typings/restaurants';

const restaurant = (id: number, name: string): Restaurant => ({
  id,
  name,
  disneyId: `R${id}`,
  imageUrl: '',
  displayed: true,
});

const RESTAURANTS = [
  restaurant(1, 'Bistrot Chez Rémy'),
  restaurant(2, 'Auberge de Cendrillon'),
  restaurant(3, 'Royal Banquet'),
];

describe('searchRestaurants', () => {
  it('matches regardless of case and accents', () => {
    assert.deepEqual(
      searchRestaurants(RESTAURANTS, 'REMY').map((r) => r.id),
      [1],
    );
  });

  it('requires every word to match', () => {
    assert.deepEqual(
      searchRestaurants(RESTAURANTS, 'chez bistrot').map((r) => r.id),
      [1],
    );
    assert.deepEqual(searchRestaurants(RESTAURANTS, 'chez cendrillon'), []);
  });
});
