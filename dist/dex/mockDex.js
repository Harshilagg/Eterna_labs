"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRaydiumQuote = getRaydiumQuote;
exports.getMeteoraQuote = getMeteoraQuote;
exports.chooseBestQuote = chooseBestQuote;
const TEST_MODE = process.env.NODE_ENV === 'test';
async function getRaydiumQuote(amount) {
    if (TEST_MODE) {
        // deterministic fast response for tests
        return { dex: 'raydium', price: 101, liquidity: 120000 };
    }
    // simulate network delay
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));
    // base price 100, apply variation
    const base = 100;
    const variation = (Math.random() * 0.03) + 0.02; // 2% - 5%
    const price = Number((base * (1 + variation)).toFixed(6));
    return { dex: 'raydium', price, liquidity: 100000 + Math.random() * 50000 };
}
async function getMeteoraQuote(amount) {
    if (TEST_MODE) {
        return { dex: 'meteora', price: 99, liquidity: 90000 };
    }
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));
    const base = 100;
    const variation = (Math.random() * 0.03) + 0.02; // 2% - 5%
    // slightly different random seed
    const price = Number((base * (1 + variation * (Math.random() > 0.5 ? 1 : -1))).toFixed(6));
    return { dex: 'meteora', price, liquidity: 80000 + Math.random() * 70000 };
}
function chooseBestQuote(q1, q2) {
    // For a market buy, lower price is better
    if (q1.price <= q2.price)
        return q1;
    return q2;
}
