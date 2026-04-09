"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { X, Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  symbol: string;
  shares: number;
  marketData: any;
  onClose: () => void;
  avgPrice: number;
}

export default function AssetModal({ symbol, shares, marketData, onClose, avgPrice }: Props) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(365); // Default 1 Year

  const isSilver = symbol === 'SI=F' || symbol === 'XAG=X';
  const displayName = isSilver ? "PLATA (FÍSICA)" : symbol;
  const displayShares = isSilver ? `${(shares * 31.1034768).toFixed(0)} GRAMOS` : `${shares} SHARES`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/finance/asset-history?symbol=${encodeURIComponent(symbol)}&days=${days}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [symbol, days]);

  const formatEuro = (val: number) => 
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);

  const formatCompactNumber = (val: number) => {
    if (val >= 1e12) return (val / 1e12).toFixed(2) + " Billones";
    if (val >= 1e9)  return (val / 1e9).toFixed(2) + " Mil M.";
    if (val >= 1e6)  return (val / 1e6).toFixed(2) + " Millones";
    return val.toString();
  };

  const stringToColour = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '#';
    for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
  }

  const avatarColor = stringToColour(symbol);
  
  const currentPrice = marketData ? marketData.price : avgPrice;
  const totalValue = currentPrice * shares;
  let pnlTotal = 0;
  let pnlPercent = 0;
  if (avgPrice > 0 && currentPrice > 0) {
    const invested = avgPrice * shares;
    pnlTotal = totalValue - invested;
    pnlPercent = (pnlTotal / invested) * 100;
  }
  
  const isPositive = pnlPercent >= 0;

  // Calculate chart bounds
  const prices = history.map(h => h.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const domainMin = minPrice * 0.95;
  const domainMax = maxPrice * 1.05;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
    }} onClick={onClose}>
      
      <div 
        className="panel" 
        style={{ width: "90%", maxWidth: "600px", padding: "0", overflow: "hidden", position: "relative" }}
        onClick={e => e.stopPropagation()} // Prevent close when clicking inside modal
      >
        <button 
          onClick={onClose}
          style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div style={{ padding: "2rem 2rem 1rem 2rem", display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
          <div style={{ 
            width: "56px", height: "56px", borderRadius: "50%", 
            backgroundColor: avatarColor, color: "white", 
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "1.2rem", boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.1)"
          }}>
            {isSilver ? "AG" : symbol.substring(0, 2)}
          </div>
          <div style={{flex: 1}}>
             <h2 style={{ fontSize: "1.8rem", margin: 0, color: "var(--text-primary)" }}>{displayName}</h2>
             <span className="text-muted" style={{ fontWeight: 500 }}>{displayShares}</span>
          </div>
          <div style={{ textAlign: "right" }}>
             <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {formatEuro(totalValue)}
             </div>
             <div className={isPositive ? "text-positive" : "text-negative"} style={{ fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.25rem" }}>
                {isPositive ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                {isPositive ? "+" : ""}{formatEuro(pnlTotal)} ({isPositive ? "+" : ""}{pnlPercent.toFixed(2)}%)
             </div>
          </div>
        </div>

        {/* Time Selector */}
        <div style={{ display: "flex", gap: "1rem", padding: "0 2rem", marginBottom: "1rem" }}>
           {[
             { label: "1 Mes", val: 30 },
             { label: "3 Meses", val: 90 },
             { label: "1 Año", val: 365 },
             { label: "3 Años", val: 1095 }
           ].map(t => (
             <button 
               key={t.val}
               onClick={() => setDays(t.val)}
               style={{
                 background: "none",
                 border: "none",
                 color: days === t.val ? "var(--text-primary)" : "var(--text-secondary)",
                 fontWeight: days === t.val ? 700 : 500,
                 cursor: "pointer",
                 fontSize: "0.9rem",
                 borderBottom: days === t.val ? "2px solid var(--accent-primary)" : "2px solid transparent",
                 paddingBottom: "4px"
               }}
             >
               {t.label}
             </button>
           ))}
        </div>

        {/* Chart */}
        <div style={{ height: "250px", width: "100%", position: "relative" }}>
           {loading ? (
             <div className="flex-center" style={{ height: "100%" }}>
                <Loader2 className="spin" size={32} color="var(--accent-primary)"/>
             </div>
           ) : (
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "var(--accent-positive)" : "var(--accent-negative)"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={isPositive ? "var(--accent-positive)" : "var(--accent-negative)"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis domain={[domainMin, domainMax]} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A2332', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 8px 16px rgba(0,0,0,0.4)' }}
                  formatter={(value: number) => [formatEuro(value), 'Precio'] as any}
                  labelStyle={{ color: '#8892B0', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isPositive ? "var(--accent-positive)" : "var(--accent-negative)"}
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                />
              </AreaChart>
            </ResponsiveContainer>
           )}
        </div>

        {/* Metrics Grid */}
        <div style={{ 
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", 
          padding: "2rem", backgroundColor: "rgba(0,0,0,0.15)",
          borderTop: "1px solid var(--border-color)"
        }}>
           <MetricBox label="PRECIO ACTUAL" value={formatEuro(currentPrice)} />
           <MetricBox label="PRECIO MEDIO" value={formatEuro(avgPrice)} />
           
           {marketData?.marketCap && <MetricBox label="MARKET CAP" value={formatCompactNumber(marketData.marketCap)} />}
           {marketData?.trailingPE && <MetricBox label="RATIO P/E" value={marketData.trailingPE.toFixed(2)} />}
           
           {(marketData?.dividendRate != null) && <MetricBox label="DIVIDENDO (Anual)" value={formatEuro(marketData.dividendRate)} />}
           {marketData?.dividendYield != null && <MetricBox label="DIV YIELD" value={`${(marketData.dividendYield).toFixed(2)}%`} />}
           
           {marketData?.fiftyTwoWeekHigh != null && <MetricBox label="52W HIGH" value={formatEuro(marketData.fiftyTwoWeekHigh)} />}
           {marketData?.fiftyTwoWeekLow != null && <MetricBox label="52W LOW" value={formatEuro(marketData.fiftyTwoWeekLow)} />}

           <MetricBox label="PRÓX. RESULTADOS" value={marketData?.earningsDate ? new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(marketData.earningsDate)) : '-'} />
           <MetricBox label="PAGO DIVIDENDOS" value={marketData?.dividendDate ? new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(marketData.dividendDate)) : '-'} />
           {marketData?.averageAnalystRating != null && <MetricBox label="OPINIÓN MERCADO" value={marketData.averageAnalystRating.toUpperCase()} />}
           
           {marketData?.forwardPE != null && <MetricBox label="FORWARD P/E" value={marketData.forwardPE.toFixed(2)} />}
        </div>
      </div>
    </div>
  );
}

function MetricBox({label, value}: {label: string, value: string | number}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "1px" }}>{label}</span>
      <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}
