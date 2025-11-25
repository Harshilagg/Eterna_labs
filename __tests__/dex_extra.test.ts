import { getRaydiumQuote, getMeteoraQuote, chooseBestQuote } from '../src/dex/mockDex';

describe('mockDex deterministic test-mode', () => {
  test('raydium returns 101 in test mode', async () => {
    const r = await getRaydiumQuote(1);
    expect(r.price).toBe(102);
    expect(r.dex).toBe('raydium');
  });

  test('meteora returns 99 in test mode and chooseBestQuote picks lower', async () => {
    const m = await getMeteoraQuote(1);
    expect(m.price).toBe(99);
    expect(m.dex).toBe('meteora');

    const chosen = chooseBestQuote({ dex: 'a', price: 100, liquidity: 1 }, m);
    expect(chosen.dex).toBe('meteora');
  });
});
