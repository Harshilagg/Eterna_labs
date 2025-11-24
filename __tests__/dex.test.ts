import { getRaydiumQuote, getMeteoraQuote, chooseBestQuote } from '../src/dex/mockDex';

describe('mockDex', () => {
  jest.setTimeout(20000);

  test('quotes return shape and values', async () => {
    const r = await getRaydiumQuote(1);
    const m = await getMeteoraQuote(1);
    expect(r).toHaveProperty('dex', 'raydium');
    expect(r).toHaveProperty('price');
    expect(typeof r.price).toBe('number');
    expect(m).toHaveProperty('dex', 'meteora');
  });

  test('chooseBestQuote selects lower price', () => {
    const a = { dex: 'a', price: 100, liquidity: 1000 };
    const b = { dex: 'b', price: 105, liquidity: 1000 };
    const chosen = chooseBestQuote(a, b);
    expect(chosen.dex).toBe('a');
  });
});
