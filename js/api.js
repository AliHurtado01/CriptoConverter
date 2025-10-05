// api.js – Capa de datos: CoinGecko + fallback JSON local
const COINS = {
  btc: {
    id: "bitcoin",
    name: "Bitcoin",
    img: "/imgs/bitcoin.jpg",
  },
  eth: {
    id: "ethereum",
    name: "Ethereum",
    img: "/imgs/ethereum.jpg",
  },
  sol: {
    id: "solana",
    name: "Solana",
    img: "/imgs/solana.jpeg",
  },
  xrp: {
    id: "ripple-xrp-logo",
    name: "XRP",
    img: "/imgs/xrp.png",
  },
  ada: {
    id: "cardano",
    name: "Cardano",
    img: "/imgs/cardano.png",
  },
};
const FIAT = {
  usd: { name: "Dólar (USD)" },
  eur: { name: "Euro (EUR)" },
};
export const ASSETS = { ...COINS, ...FIAT };

/** Devuelve precios simples */
export async function getSimplePrices(vs = "usd") {
  try {
    const ids = Object.values(COINS)
      .map((c) => c.id)
      .join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs}`;
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    const out = { base: vs, rates: {} };
    out.rates["usd"] = vs === "usd" ? 1 : NaN;
    out.rates["eur"] = vs === "eur" ? 1 : NaN;
    for (const [k, v] of Object.entries(COINS)) {
      out.rates[k] = Number(data[v.id][vs]);
    }
    return out;
  } catch (e) {
    const res = await fetch("./data/rates.json");
    return res.json();
  }
}

/** Serie de 7 días para una cripto */
export async function get7dSeries(coin = "bitcoin", vs = "usd") {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=${vs}&days=7`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    // data.prices: [[ts, price], ...]
    return data.prices.map((p) => ({ t: new Date(p[0]), y: p[1] }));
  } catch (e) {
    const base = await getSimplePrices(vs);
    const key = Object.keys(COINS).find((k) => COINS[k].id === coin);
    const price = base.rates[key] || 1;
    const now = Date.now();
    return Array.from({ length: 7 }, (_, i) => ({
      t: new Date(now - (6 - i) * 86400000),
      y: price,
    }));
  }
}

export function coinInfo(symbol) {
  return COINS[symbol];
}
