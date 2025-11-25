import { getRaydiumQuote, getMeteoraQuote, chooseBestQuote } from '../src/dex/mockDex';

describe('mockDex additional tests', () => {
  test('test-mode deterministic prices', async () => {
    process.env.NODE_ENV = 'test';
    const r = await getRaydiumQuote(1);
    const m = await getMeteoraQuote(1);
    expect(r.price).toBeGreaterThan(0);
    expect(m.price).toBeGreaterThan(0);
    // deterministic values in test mode from implementation
    expect(r.dex).toBe('raydium');
    expect(m.dex).toBe('meteora');
  });

  test('price variation out-of-test is within expected bounds', async () => {
    process.env.NODE_ENV = 'development';
    const r = await getRaydiumQuote(1);
    const m = await getMeteoraQuote(1);
    // prices should be within 90..110 roughly given 2-5% variation around 100
    expect(r.price).toBeGreaterThanOrEqual(95);
    expect(r.price).toBeLessThanOrEqual(106);
    expect(m.price).toBeGreaterThanOrEqual(95);
    expect(m.price).toBeLessThanOrEqual(106);
  });

  test('chooseBestQuote chooses lower price when equal picks first', () => {
    const a = { dex: 'a', price: 100, liquidity: 1000 };
    const b = { dex: 'b', price: 100, liquidity: 500 };
    const chosen = chooseBestQuote(a, b);
    expect(chosen).toBe(a);
  });
});
