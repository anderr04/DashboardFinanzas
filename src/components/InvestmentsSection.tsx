"use client";

import { useState } from "react";
import { Investment } from "@/types/finance";
import { Plus, Trash2 } from "lucide-react";
import AssetModal from "./AssetModal";

interface Props {
  investments: Investment[];
  marketPrices: Record<string, any>;
  onChange: (investments: Investment[]) => void;
}

export default function InvestmentsSection({ investments, marketPrices, onChange }: Props) {
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Investment | null>(null);

  const handleAdd = () => {
    if (!symbol || isNaN(Number(shares))) return;
    onChange([
      ...investments,
      { 
        id: Date.now().toString(), 
        symbol: symbol.toUpperCase(), 
        shares: Number(shares), 
        averagePrice: Number(avgPrice) || 0 
      }
    ]);
    setSymbol("");
    setShares("");
    setAvgPrice("");
    setShowAdd(false);
  };

  const handleRemove = (id: string) => {
    onChange(investments.filter(i => i.id !== id));
  };

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

  // Calculate total value and estimated yearly dividends
  let totalValue = 0;
  let totalDividends = 0;
  
  investments.forEach((inv) => {
    const market = marketPrices[inv.symbol];
    const currentPrice = market ? market.price : (inv.averagePrice || 0);
    totalValue += currentPrice * inv.shares;
    
    if (market && (market.dividendRate || market.trailingAnnualDividendRate)) {
        // Dividend rates from Yahoo Finance are absolute values per share per year
        const divPerShare = market.dividendRate || market.trailingAnnualDividendRate;
        totalDividends += divPerShare * inv.shares;
    }
  });

  const avgYield = totalValue > 0 ? (totalDividends / totalValue) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="flex-between">
        <div>
           <h2 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "1px" }}>INVESTMENTS</h2>
           <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{formatEuro(totalValue)}</span>
           {totalDividends > 0 && <div className="text-positive" style={{ fontSize: "0.85rem", fontWeight: 500, marginTop: "0.25rem" }}>+ {formatEuro(totalDividends)} est. div. año ({avgYield.toFixed(2)}% Yield Medio)</div>}
        </div>
        <button className="btn btn-outline" style={{ borderRadius: "20px", display: "flex", gap: "0.5rem" }} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> <span>Añadir Instrumento</span>
        </button>
      </div>

      {showAdd && (
        <div className="panel" style={{ display: "flex", gap: "0.5rem" }}>
          <input className="input-field" placeholder="Ticker (Ej. AAPL, BTC-USD)" value={symbol} onChange={e => setSymbol(e.target.value)} />
          <input className="input-field" type="number" placeholder="Acciones" style={{ width: "120px" }} value={shares} onChange={e => setShares(e.target.value)} />
          <input className="input-field" type="number" placeholder="Precio Medio" style={{ width: "120px" }} value={avgPrice} onChange={e => setAvgPrice(e.target.value)} />
          <button className="btn btn-primary" onClick={handleAdd}>Guardar</button>
        </div>
      )}

      <div className="panel" style={{ display: "flex", flexDirection: "column", padding: "0" }}>
        {investments.length === 0 && <p className="text-muted flex-center" style={{ padding: "2rem" }}>Tu portfolio está vacío.</p>}
        
        {investments.map((inv, index) => {
          const market = marketPrices[inv.symbol];
          const currentPrice = market ? market.price : inv.averagePrice || 0;
          const totalInvValue = currentPrice * inv.shares;
          
          let pnlTotal = 0;
          let pnlPercent = 0;
          
          if (inv.averagePrice && inv.averagePrice > 0 && currentPrice > 0) {
            const investedVal = inv.averagePrice * inv.shares;
            pnlTotal = totalInvValue - investedVal;
            pnlPercent = (pnlTotal / investedVal) * 100;
          }

          const isPositive = pnlPercent >= 0;
          const sign = isPositive ? "+" : "";
          const colorClass = isPositive ? "text-positive" : "text-negative";
          
          const avatarColor = stringToColour(inv.symbol);

          const isSilver = inv.symbol === 'SI=F' || inv.symbol === 'XAG=X';
          const displayName = isSilver ? "PLATA (FÍSICA)" : inv.symbol;
          const displayShares = isSilver ? `${(inv.shares * 31.1034768).toFixed(0)} GRAMOS` : `${inv.shares} SHARES`;

          return (
            <div key={inv.id} style={{ display: "flex", flexDirection: "column" }}>
              <div 
                className="flex-between" 
                style={{ 
                  padding: "1rem 1.5rem 0.5rem 1.5rem", 
                  transition: "background-color 0.2s",
                  cursor: "pointer"
                }}
                onClick={() => setSelectedAsset(inv)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ 
                    width: "40px", height: "40px", borderRadius: "50%", 
                    backgroundColor: avatarColor, color: "white", 
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 600, fontSize: "0.9rem", boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.1)"
                  }}>
                    {isSilver ? "AG" : inv.symbol.substring(0, 2)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>{displayName}</span>
                    <span className="text-muted">{displayShares}</span>
                  </div>
                </div>

              <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>{formatEuro(totalInvValue)}</span>
                  {inv.averagePrice && inv.averagePrice > 0 ? (
                    <span className={colorClass} style={{ fontWeight: 500, fontSize: "0.9rem" }}>
                      {sign}{formatEuro(pnlTotal)} ({sign}{pnlPercent.toFixed(2)}%)
                    </span>
                  ) : (
                    <span className="text-muted" style={{ fontSize: "0.85rem" }}>Añade precio medio</span>
                  )}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRemove(inv.id); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.5 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {/* Extended Metrics Row */}
            <div style={{ 
              padding: "0.5rem 1.5rem 1rem 1.5rem", 
              borderBottom: index !== investments.length - 1 ? "1px solid var(--border-color)" : "none",
              display: "flex", gap: "1.5rem",
              fontSize: "0.8rem", color: "var(--text-secondary)"
            }}>
              {market?.trailingPE && <span>P/E: <span style={{color: "var(--text-primary)"}}>{market.trailingPE.toFixed(2)}</span></span>}
              {market?.dividendRate && <span>Dividendo: <span style={{color: "var(--accent-positive)"}}>{formatEuro(market.dividendRate * inv.shares)} / año</span></span>}
              {market?.fiftyTwoWeekHigh != null && <span>52w High: <span style={{color: "var(--text-primary)"}}>{market.fiftyTwoWeekHigh.toFixed(2)}</span></span>}
              {market?.marketCap && <span>Cap.: <span style={{color: "var(--text-primary)"}}>{formatCompactNumber(market.marketCap)}</span></span>}
            </div>
            </div>
          );
        })}
      </div>

      {selectedAsset && (
        <AssetModal
          symbol={selectedAsset.symbol}
          shares={selectedAsset.shares}
          marketData={marketPrices[selectedAsset.symbol]}
          avgPrice={selectedAsset.averagePrice || 0}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
