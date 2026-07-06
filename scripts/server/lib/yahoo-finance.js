// Yahoo Finance data fetcher — prices + news
// Uses free, unauthenticated endpoints

const fs = require('fs');
const path = require('path');

const YAHOO_CHART_API = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_NEWS_API = 'https://query2.finance.yahoo.com/v1/finance/es_enhanced_news';

// Fetch price data for a ticker
// Returns: { price, change_pct, open, high, low, volume, market_cap }
async function fetchPrice(ticker) {
  const url = `${YAHOO_CHART_API}/${encodeURIComponent(ticker)}?range=5d&interval=1d`;

  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!resp.ok) {
    throw new Error(`Yahoo Finance API error for ${ticker}: ${resp.status}`);
  }

  const data = await resp.json();
  const result = data?.chart?.result?.[0];
  if (!result) {
    throw new Error(`No chart data for ${ticker}`);
  }

  const meta = result.meta;
  const quotes = result.indicators?.quote?.[0];
  const timestamps = result.timestamp || [];

  // Get the last 2 data points to calculate daily change
  const lastIdx = timestamps.length - 1;
  const prevIdx = lastIdx - 1;

  const currentPrice = meta.regularMarketPrice;
  const prevClose = quotes?.close?.[prevIdx] || meta.previousClose || meta.chartPreviousClose;
  const changePct = prevClose ? ((currentPrice - prevClose) / prevClose) * 100 : 0;
  const todayOpen = quotes?.open?.[lastIdx] || meta.regularMarketOpen;
  const todayHigh = quotes?.high?.[lastIdx] || meta.regularMarketDayHigh;
  const todayLow = quotes?.low?.[lastIdx] || meta.regularMarketDayLow;
  const volume = quotes?.volume?.[lastIdx] || meta.regularMarketVolume;

  return {
    ticker: meta.symbol,
    price: currentPrice,
    change_pct: parseFloat(changePct.toFixed(2)),
    open: todayOpen,
    high: todayHigh,
    low: todayLow,
    volume,
    market_cap: meta.marketCap,
    currency: meta.currency,
    prev_close: prevClose
  };
}

// Fetch news headlines for a ticker from Yahoo Finance
async function fetchNews(ticker, count = 5) {
  const url = `${YAHOO_NEWS_API}?symbols=${encodeURIComponent(ticker)}&count=${count}`;

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!resp.ok) return [];

    const data = await resp.json();
    const items = data?.data?.items?.result || [];

    return items.slice(0, count).map(item => ({
      title: item.title,
      summary: item.summary || '',
      source: item.provider || 'Yahoo Finance',
      url: item.link || item.canonicalUrl?.url || '',
      published_at: item.pubDate || item.publishedAt || ''
    }));
  } catch {
    return [];
  }
}

// Fetch all holdings' prices in parallel
async function fetchAllPrices(holdings) {
  const results = {};
  const entries = await Promise.allSettled(
    holdings.map(async (h) => {
      const price = await fetchPrice(h.ticker);
      return { ticker: h.ticker, price };
    })
  );

  for (const entry of entries) {
    if (entry.status === 'fulfilled') {
      const { ticker, price } = entry.value;
      results[ticker] = price;
    } else {
      // Ticker fetch failed — store null
      const ticker = holdings[entries.indexOf(entry)]?.ticker || 'UNKNOWN';
      results[ticker] = null;
    }
  }

  return results;
}

// Fetch news for all holdings in parallel
async function fetchAllNews(holdings) {
  const results = {};
  const entries = await Promise.allSettled(
    holdings.map(async (h) => ({
      ticker: h.ticker,
      news: await fetchNews(h.ticker, 5)
    }))
  );

  for (const entry of entries) {
    if (entry.status === 'fulfilled') {
      results[entry.value.ticker] = entry.value.news;
    }
  }

  return results;
}

// Web search via Yahoo Finance's enhanced news for sector keywords
async function searchSectorNews(keywords) {
  const allNews = [];
  for (const kw of keywords.slice(0, 3)) {
    const url = `${YAHOO_NEWS_API}?query=${encodeURIComponent(kw)}&count=5`;
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        const items = data?.data?.items?.result || [];
        for (const item of items) {
          allNews.push({
            title: item.title,
            summary: item.summary || '',
            source: item.provider || 'Yahoo Finance',
            url: item.link || item.canonicalUrl?.url || '',
            keyword: kw
          });
        }
      }
    } catch {
      // skip failed keyword
    }
  }
  // Deduplicate by title
  const seen = new Set();
  return allNews.filter(n => {
    if (seen.has(n.title)) return false;
    seen.add(n.title);
    return true;
  }).slice(0, 15);
}

// Generate sector search keywords based on portfolio concentration
function generateSectorKeywords(holdings) {
  // Count sectors
  const sectors = {};
  for (const h of holdings) {
    sectors[h.sector] = (sectors[h.sector] || 0) + 1;
  }

  const total = holdings.length;
  const keywords = [];

  // Find dominant sector (>30% of portfolio)
  for (const [sector, count] of Object.entries(sectors)) {
    if (count / total >= 0.3) {
      const pct = Math.round(count / total * 100);
      keywords.push(`${sector} industry competitive landscape today`);
      keywords.push(`${sector} supply chain news`);
    }
  }

  // Add cross-cutting AI/semiconductor keywords if relevant
  const semiHoldings = holdings.filter(h =>
    ['semiconductor', 'optical_networking'].includes(h.sector)
  );
  if (semiHoldings.length >= 3) {
    keywords.push('AI chip semiconductor custom ASIC hyperscaler strategy');
    keywords.push('memory storage semiconductor sector news');
  }

  return keywords.length > 0 ? keywords : ['US stock market sector news today'];
}

module.exports = {
  fetchPrice,
  fetchNews,
  fetchAllPrices,
  fetchAllNews,
  searchSectorNews,
  generateSectorKeywords
};
