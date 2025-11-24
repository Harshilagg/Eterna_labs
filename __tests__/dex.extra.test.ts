import { getRaydiumQuote, getMeteoraQuote, chooseBestQuote } from '../src/dex/mockDex';

describe('mockDex extra checks', () => {
  jest.setTimeout(20000);

  test('prices are within expected variation (~2-5% from base 100)', async () => {
    const r = await getRaydiumQuote(1);
    const m = await getMeteoraQuote(1);
    expect(r.price).toBeGreaterThanOrEqual(100 * 1.02 - 0.0001);
    expect(r.price).toBeLessThanOrEqual(100 * 1.06 + 0.0001);
    expect(m.price).toBeGreaterThanOrEqual(100 * 0.98 - 0.0001);
    expect(m.price).toBeLessThanOrEqual(100 * 1.06 + 0.0001);
  });

  test('liquidity is positive and numeric', async () => {
    const r = await getRaydiumQuote(1);
    const m = await getMeteoraQuote(1);
    expect(typeof r.liquidity).toBe('number');
    expect(r.liquidity).toBeGreaterThan(0);
    expect(typeof m.liquidity).toBe('number');
    expect(m.liquidity).toBeGreaterThan(0);
  });

  test('chooseBestQuote picks meteor when lower price', () => {
    const low = { dex: 'low', price: 95, liquidity: 1000 };
    const high = { dex: 'high', price: 105, liquidity: 1000 };
    const chosen = chooseBestQuote(low, high);
    expect(chosen.dex).toBe('low');
  });
});
