import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolParam = searchParams.get('symbol');
  const daysParam = searchParams.get('days');

  if (!symbolParam) return NextResponse.json({ error: 'No symbol' }, { status: 400 });
  
  // Use YF format if it is SI=F internally representing Silver
  // No transformation needed if we pass exactly the symbol
  const symbol = symbolParam;
  
  const days = parseInt(daysParam || '365');
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - days);
  const period1 = targetDate.toISOString().split('T')[0];

  try {
     const data = await yahooFinance.chart(symbol, { period1, interval: '1d' });
     let isUSD = false;
     
     try {
        const fullQuote = await yahooFinance.quote(symbol);
        isUSD = fullQuote?.currency === 'USD';
     } catch(e) {}

     let historicalEURX: Record<string, number> = {};
     if (isUSD) {
        try {
            const eurxData = await yahooFinance.chart('EUR=X', { period1, interval: '1d' });
            eurxData.quotes.forEach((q: any) => {
                if (q.adjclose || q.close) {
                    const dateStr = new Date(q.date).toISOString().split('T')[0];
                    historicalEURX[dateStr] = q.adjclose || q.close || 1;
                }
            });
        } catch(e) {}
     }

     let lastKnownFx = 1;
     // Pre-populate if missing first day
     const sortedEURDates = Object.keys(historicalEURX).sort();
     if (sortedEURDates.length > 0) {
         lastKnownFx = historicalEURX[sortedEURDates[0]];
     }

     const result: any[] = [];

     data.quotes.forEach((q: any) => {
         if (!q.close && !q.adjclose) return;
         const dateStr = new Date(q.date).toISOString().split('T')[0];
         let price = q.adjclose || q.close;
         
         if (isUSD) {
             if (historicalEURX[dateStr]) {
                 lastKnownFx = historicalEURX[dateStr];
             }
             price = price * lastKnownFx;
         }

         result.push({
             date: dateStr,
             price: price
         });
     });

     return NextResponse.json(result);
  } catch (error: any) {
     return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
