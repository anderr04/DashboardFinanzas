"use client";

import { useState, useEffect } from "react";
import { FinanceData } from "@/types/finance";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Wallet, TrendingUp, CreditCard, Repeat, Loader2 } from "lucide-react";

interface Props {
  data: FinanceData;
  marketPrices: Record<string, any>;
}

type TimeRange = '1W' | '1M' | '3M' | '1Y' | 'ALL';

export default function DashboardOverview({ data, marketPrices }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1W');

  const totalCash = data.cash.reduce((acc, c) => acc + c.balance, 0);
  const totalInvestments = data.investments.reduce((acc, inv) => {
    const marketPrice = marketPrices[inv.symbol]?.price || 0;
    const currentPrice = marketPrice > 0 ? marketPrice : (inv.averagePrice || 0);
    return acc + (currentPrice * inv.shares);
  }, 0);
  const totalDebts = data.debts.reduce((acc, d) => acc + (d.totalAmount - d.paidAmount), 0);
  const totalClasses = (data.classes || []).reduce((acc, c) => {
      // ONLY ADD UNPAID CLASSES (Accounts Receivable) TO NET WORTH
      // If they are paid, the money is already accounted for in Cash.
      if (c.paid) return acc;
      const rate = c.modality === 'Online' ? 12.5 : 15.0;
      return acc + (c.hours * rate);
  }, 0);
  const totalSubscriptionsMonthly = data.subscriptions.reduce((acc, s) => acc + s.monthlyCost, 0);
  
  const netWorth = totalCash + totalInvestments + totalClasses - totalDebts;

  const formatEuro = (val: number) => 
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);

  const formatDateESP = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    if (!day) return dateStr;
    return `${day}-${month}-${year}`;
  };

  // Helper to generate synthetic history pointing backwards to simulate variation.
  const generateSyntheticHistory = (days: number) => {
      const history = [];
      const now = new Date();
      // Generate some noisy walk backwards
      let currentNet = netWorth;
      let currentCash = totalCash;
      let currentInv = totalInvestments;
      
      for(let i = days; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          
          if (i === 0) {
             history.push({ date: d.toISOString().split('T')[0], netWorth, cashValue: totalCash, investmentsValue: totalInvestments, classesValue: totalClasses, synthetic: false });
          } else {
             history.push({
                 date: d.toISOString().split('T')[0],
                 netWorth: netWorth,
                 cashValue: totalCash,
                 investmentsValue: totalInvestments,
                 classesValue: totalClasses,
                 synthetic: true
             });
          }
      }
      return history;
  };

  const [historicalPnl, setHistoricalPnl] = useState<{date: string, investmentsValueHistory: number}[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
     if (data.investments.length === 0) return;
     setLoadingHistory(true);
     fetch('/api/finance/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investments: data.investments, days: 365 })
     }).then(res => res.json()).then(result => {
        setHistoricalPnl(result);
        setLoadingHistory(false);
     }).catch(() => setLoadingHistory(false));
  }, [data.investments]);

  let baseHistory = [];
  
  if (historicalPnl.length > 0) {
      // Rebuild true history based on backtesting current shares against past YF prices
      historicalPnl.forEach(hp => {
         const pastNet = totalCash + hp.investmentsValueHistory + totalClasses - totalDebts;
         baseHistory.push({
             date: hp.date,
             netWorth: pastNet,
             cashValue: totalCash,
             investmentsValue: hp.investmentsValueHistory,
             classesValue: totalClasses,
             synthetic: true
         });
      });
      // push today exactly
      baseHistory.push({ date: new Date().toISOString().split('T')[0], netWorth, cashValue: totalCash, investmentsValue: totalInvestments, classesValue: totalClasses, synthetic: false });
  } else {
      // Flat generation fallback while loading
      baseHistory = generateSyntheticHistory(365);
  }

  // Filter based on timeRange
  const filterDays = timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : timeRange === '3M' ? 90 : timeRange === '1Y' ? 365 : 9999;
  
  // Cut baseHistory to the last `filterDays`
  const chartData = baseHistory.slice(-filterDays);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h2 style={{ fontSize: "1rem", color: "var(--text-secondary)", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>Patrimonio Neto</h2>
        <div style={{ fontSize: "3.5rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          {formatEuro(netWorth)}
        </div>
      </div>

      <div className="panel" style={{ height: "360px", padding: "1.5rem 0", display: "flex", flexDirection: "column" }}>
        <div className="flex-between" style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", marginBottom: "1rem" }}>
           <h3 style={{ color: "var(--text-secondary)" }}>Evolución Temporal del Portfolio</h3>
           
           <div style={{ display: "flex", gap: "0.5rem", background: "rgba(255,255,255,0.05)", padding: "0.25rem", borderRadius: "8px", alignItems: "center" }}>
             {loadingHistory && <Loader2 className="animate-spin text-muted" size={16} style={{marginRight: "0.5rem"}} />}
             {(['1W', '1M', '3M', '1Y', 'ALL'] as TimeRange[]).map(tr => (
                <button 
                  key={tr}
                  onClick={() => setTimeRange(tr)}
                  style={{
                    border: 'none',
                    background: timeRange === tr ? 'var(--surface-hover)' : 'transparent',
                    color: timeRange === tr ? 'var(--text-primary)' : 'var(--text-secondary)',
                    padding: "0.25rem 0.75rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    transition: "all 0.2s"
                  }}
                >{tr}</button>
             ))}
           </div>
        </div>
        
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-positive)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--accent-positive)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-warning)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--accent-warning)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              stroke="var(--border-color)" 
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
              tickMargin={10} 
              axisLine={false} 
              tickLine={false}
              tickFormatter={formatDateESP}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--text-primary)', fontWeight: 500 }}
              labelFormatter={(label) => formatDateESP(label as string)}
              formatter={(val: number) => formatEuro(val)}
            />
            <Area type="monotone" name="Patrimonio Neto" dataKey="netWorth" stroke="var(--accent-positive)" strokeWidth={3} fillOpacity={1} fill="url(#colorNetWorth)" />
            <Area type="monotone" name="Inversiones" dataKey="investmentsValue" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorInv)" />
            <Area type="monotone" name="Clases Part." dataKey="classesValue" stroke="#B19CD9" strokeWidth={3} fillOpacity={1} fill="rgba(177,156,217,0.2)" />
            <Area type="monotone" name="Efectivo" dataKey="cashValue" stroke="var(--accent-warning)" strokeWidth={3} fillOpacity={1} fill="url(#colorCash)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4">
        <div className="panel">
          <div className="flex-between text-muted" style={{ marginBottom: "0.75rem" }}>
            <span>Efectivo</span>
            <Wallet size={16} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{formatEuro(totalCash)}</div>
        </div>
        
        <div className="panel">
          <div className="flex-between text-muted" style={{ marginBottom: "0.75rem" }}>
            <span>Inversiones</span>
            <TrendingUp size={16} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{formatEuro(totalInvestments)}</div>
        </div>

        <div className="panel" style={{ borderTop: "3px solid var(--accent-primary)" }}>
          <div className="flex-between text-muted" style={{ marginBottom: "0.75rem" }}>
            <span>Ganancia x Clases</span>
            <TrendingUp size={16} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{formatEuro(totalClasses)}</div>
        </div>

        <div className="panel" style={{ borderTop: "3px solid var(--accent-negative)" }}>
          <div className="flex-between text-muted" style={{ marginBottom: "0.75rem" }}>
            <span>Deuda Activa</span>
            <CreditCard size={16} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{formatEuro(totalDebts)}</div>
        </div>
      </div>
    </div>
  );
}
