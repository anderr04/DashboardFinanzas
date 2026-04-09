import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({});
  }

  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
  
  if (symbols.length === 0) {
    return NextResponse.json({});
  }

  try {
    // 1. Get the stock quotes
    const quotes = await yahooFinance.quote(symbols);
    // ensure quotes is an array 
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    // 2. Identify currencies that need conversion to EUR
    const currenciesToFetch = new Set<string>();
    quotesArray.forEach(q => {
      const c = q.currency?.toUpperCase();
      if (c && c !== 'EUR') {
        currenciesToFetch.add(c);
      }
    });

    // 3. Fetch FX rates
    const fxRates: Record<string, number> = { 'EUR': 1 };
    
    // Default USD to EUR is 'EUR=X' in Yahoo Finance
    const fxSymbols = Array.from(currenciesToFetch).map(c => {
      if (c === 'USD') return 'EUR=X'; // USD to EUR
      return `${c}EUR=X`; // E.g., GBPEUR=X
    });

    if (fxSymbols.length > 0) {
      try {
        const fxQuotes = await yahooFinance.quote(fxSymbols);
        const fxQuotesArray = Array.isArray(fxQuotes) ? fxQuotes : [fxQuotes];
        
        fxQuotesArray.forEach(fx => {
          if (fx.symbol === 'EUR=X') {
            fxRates['USD'] = fx.regularMarketPrice ?? 1; // e.g. 0.92
          } else {
            // E.g. 'GBPEUR=X' -> 'GBP'
            const origCurr = fx.symbol.replace('EUR=X', '');
            fxRates[origCurr] = fx.regularMarketPrice ?? 1;
          }
        });
      } catch (e) {
        console.warn('Failed to fetch some FX rates. Fallback to 1:1');
      }
    }

    // 4. Map the response translating non-EUR prices to EUR
    const results: Record<string, any> = {};
    
    quotesArray.forEach(q => {
      const p = q.regularMarketPrice || 0;
      const c = q.currency?.toUpperCase() || 'EUR';
      const fxRate = fxRates[c] || 1;
      
      const priceInEur = p * fxRate;
      
      results[q.symbol] = {
        price: priceInEur,
        currency: 'EUR',
        rawCurrency: c,
        rawPrice: p,
        change: (q.regularMarketChange || 0) * fxRate,
        changePercent: q.regularMarketChangePercent || 0,
        trailingPE: q.trailingPE,
        dividendYield: q.dividendYield,
        dividendRate: q.dividendRate != null ? q.dividendRate * fxRate : undefined,
        trailingAnnualDividendRate: q.trailingAnnualDividendRate != null ? q.trailingAnnualDividendRate * fxRate : undefined,
        marketCap: q.marketCap != null ? q.marketCap * fxRate : undefined,
        fiftyTwoWeekHigh: q.fiftyTwoWeekHigh != null ? q.fiftyTwoWeekHigh * fxRate : undefined,
        fiftyTwoWeekLow: q.fiftyTwoWeekLow != null ? q.fiftyTwoWeekLow * fxRate : undefined
      };
    });

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
