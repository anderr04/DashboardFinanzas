"use client";

import { useEffect, useState } from "react";
import { FinanceData, defaultData, Snapshot } from "@/types/finance";
import DashboardOverview from "@/components/DashboardOverview";
import CashSection from "@/components/CashSection";
import InvestmentsSection from "@/components/InvestmentsSection";
import SubscriptionsSection from "@/components/SubscriptionsSection";
import ClassesSection from "@/components/ClassesSection";
import { LayoutDashboard, TrendingUp, Wallet, CreditCard, Repeat, BookOpen } from "lucide-react";

export default function Home() {
  const [data, setData] = useState<FinanceData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [marketPrices, setMarketPrices] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/db");
        if (res.ok) {
          const dbData = await res.json();
          // Ensure history exists
          if (!dbData.history) dbData.history = [];
          setData(dbData);
          
          if (dbData.investments && dbData.investments.length > 0) {
            const symbols = dbData.investments.map((inv: any) => inv.symbol).join(",");
            const priceRes = await fetch(`/api/finance?symbols=${symbols}`);
            if (priceRes.ok) {
              const priceData = await priceRes.json();
              setMarketPrices(priceData);
              
              // We can calculate NetWorth and save Snapshot if we have prices
              recalculateNetWorthSnapshot(dbData, priceData);
            }
          } else {
             recalculateNetWorthSnapshot(dbData, {});
          }
        }
      } catch (err) {
        console.error("Failed to load", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const recalculateNetWorthSnapshot = async (currentData: FinanceData, prices: Record<string, any>) => {
    const today = new Date().toISOString().split("T")[0];
    
    // Calcula net worth actual
    const cash = currentData.cash.reduce((acc, c) => acc + c.balance, 0);
    const debts = currentData.debts.reduce((acc, d) => acc + (d.totalAmount - d.paidAmount), 0);
    const investments = currentData.investments.reduce((acc, inv) => {
       const market = prices[inv.symbol]?.price || inv.averagePrice || 0;
       return acc + (market * inv.shares);
    }, 0);
    const classesV = (currentData.classes || []).reduce((acc, c) => {
       if (c.paid) return acc; // Only unpaid classes represent theoretical owed Net Worth
       const rate = c.modality === 'Online' ? 12.5 : 15.0;
       return acc + (c.hours * rate);
    }, 0);
    const netWorth = cash + investments + classesV - debts;

    const newHistory = [...(currentData.history || [])];
    const existingIndex = newHistory.findIndex(h => h.date === today);
    
    if (existingIndex >= 0) {
       newHistory[existingIndex].netWorth = netWorth;
       newHistory[existingIndex].cashValue = cash;
       newHistory[existingIndex].investmentsValue = investments;
       newHistory[existingIndex].classesValue = classesV;
    } else {
       newHistory.push({ date: today, netWorth, cashValue: cash, investmentsValue: investments, classesValue: classesV });
    }
    
    // Only save to DB if it changed significantly or is new
    if (existingIndex === -1 || Math.abs((newHistory[existingIndex].netWorth || 0) - netWorth) > 1) {
       const finalData = { ...currentData, history: newHistory };
       setData(finalData);
       await fetch("/api/db", {
         method: "POST",
         body: JSON.stringify(finalData),
       });
    }
  };

  const handleSave = async (newData: FinanceData) => {
    setData(newData);
    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });
      // Optionally requery finance
      if (newData.investments.length > 0) {
        const symbols = newData.investments.map((inv) => inv.symbol).join(",");
        const pRes = await fetch(`/api/finance?symbols=${symbols}`);
        if(pRes.ok) {
           const pData = await pRes.json();
           setMarketPrices(pData);
           recalculateNetWorthSnapshot(newData, pData);
        }
      } else {
         recalculateNetWorthSnapshot(newData, marketPrices);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex-center" style={{ minHeight: "100vh", color: "var(--text-secondary)" }}>Analizando portfolio...</div>;
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ padding: "0 1rem 2rem 1rem" }}>
          <h1 style={{ fontSize: "1.25rem", color: "white" }}>Mi Portfolio</h1>
        </div>
        
        <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard size={20} />
          <span>General</span>
        </div>
        <div className={`nav-item ${activeTab === 'investments' ? 'active' : ''}`} onClick={() => setActiveTab('investments')}>
          <TrendingUp size={20} />
          <span>Inversiones</span>
        </div>
        <div className={`nav-item ${activeTab === 'cash' ? 'active' : ''}`} onClick={() => setActiveTab('cash')}>
          <Wallet size={20} />
          <span>Efec. y Cuentas</span>
        </div>
        <div className={`nav-item ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => setActiveTab('classes')}>
          <BookOpen size={20} />
          <span>Clases Particulares</span>
        </div>
        <div className={`nav-item ${activeTab === 'subscriptions' ? 'active' : ''}`} onClick={() => setActiveTab('subscriptions')}>
          <Repeat size={20} />
          <span>Suscripciones</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          {activeTab === 'dashboard' && <DashboardOverview data={data} marketPrices={marketPrices} />}
          {activeTab === 'investments' && <InvestmentsSection investments={data.investments} marketPrices={marketPrices} onChange={inv => handleSave({...data, investments: inv})} />}
          {activeTab === 'cash' && <CashSection cash={data.cash} onChange={c => handleSave({...data, cash: c})} />}
          {activeTab === 'classes' && <ClassesSection classes={data.classes || []} onChange={cls => handleSave({...data, classes: cls})} />}
          {activeTab === 'subscriptions' && <SubscriptionsSection subscriptions={data.subscriptions} onChange={s => handleSave({...data, subscriptions: s})} />}
        </div>
      </main>
    </div>
  );
}
