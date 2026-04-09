import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function POST(request: Request) {
  try {
    const { investments, days } = await request.json();

    if (!investments || !Array.isArray(investments) || investments.length === 0) {
      return NextResponse.json([]);
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - (days || 365));
    const period1 = targetDate.toISOString().split('T')[0];

    // Fetch EUR=X history for roughly fx correlation
    // Using a simple approximation to avoid hammering FX pairs:
    // We will just fetch EUR=X (USD to EUR) history, which covers 90% of US pairs.
    let historicalEURX: Record<string, number> = {};
    try {
        const eurxData = await yahooFinance.chart('EUR=X', { period1, interval: '1d' });
        eurxData.quotes.forEach((q: any) => {
            if (q.adjclose || q.close) {
                const dateStr = new Date(q.date).toISOString().split('T')[0];
                historicalEURX[dateStr] = q.adjclose || q.close || 1;
            }
        });
    } catch(e) {}

    // 1. Fetch History for all symbols
    const allQuotes: Record<string, Record<string, number>> = {};
    const isAssetUSD: Record<string, boolean> = {};
    const allDatesSet = new Set<string>();

    await Promise.all(investments.map(async (inv: {symbol: string, shares: number}) => {
       try {
           // Meta doesn't come with historical, we need quote to check currency if not known,
           // but we can assume USD for US stocks or rely on a quick quote call.
           const fullQuote = await yahooFinance.quote(inv.symbol);
           isAssetUSD[inv.symbol] = fullQuote?.currency === 'USD';
           
           const data = await yahooFinance.chart(inv.symbol, { period1, interval: '1d' });
           
           allQuotes[inv.symbol] = {};
           
           data.quotes.forEach((q: any) => {
               if (q.adjclose || q.close) {
                   const dateStr = new Date(q.date).toISOString().split('T')[0];
                   allQuotes[inv.symbol][dateStr] = q.adjclose || q.close;
                   allDatesSet.add(dateStr);
               }
           });
       } catch (e) {
           console.warn(`Failed history fetch for ${inv.symbol}`);
       }
    }));

    // 2. Format to sorted array and forward-fill missing prices AND missing FX rates
    // Also include historically EURX dates in the set so we don't miss fx updates
    Object.keys(historicalEURX).forEach(d => allDatesSet.add(d));
    const sortedDates = Array.from(allDatesSet).sort();
    
    // Track the last known price of each symbol
    const lastKnownPrices: Record<string, number> = {};
    let lastKnownFx = 1; // Fallback, will be updated to first valid rate

    // Initialize lastKnownFx with the first available EURX fallback just in case
    for (const d of sortedDates) {
        if (historicalEURX[d]) {
             lastKnownFx = historicalEURX[d];
             break;
        }
    }

    const result = [];
    
    for (const d of sortedDates) {
        if (historicalEURX[d] !== undefined) {
             lastKnownFx = historicalEURX[d];
        }

        let dailyTotalInvestments = 0;
        
        for (const inv of investments) {
            const sym = inv.symbol;
            if (allQuotes[sym] && allQuotes[sym][d] !== undefined) {
                lastKnownPrices[sym] = allQuotes[sym][d];
            }
            
            let currentPrice = lastKnownPrices[sym] || 0;
            if (isAssetUSD[sym]) {
                currentPrice = currentPrice * lastKnownFx;
            }
            
            dailyTotalInvestments += currentPrice * inv.shares;
        }

        result.push({
            date: d,
            investmentsValueHistory: dailyTotalInvestments
        });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
