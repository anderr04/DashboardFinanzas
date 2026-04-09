"use client";

import { useState } from "react";
import { Subscription } from "@/types/finance";
import { Repeat, Plus, Trash2 } from "lucide-react";

interface Props {
  subscriptions: Subscription[];
  onChange: (subscriptions: Subscription[]) => void;
}

export default function SubscriptionsSection({ subscriptions, onChange }: Props) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    if (!name || isNaN(Number(cost))) return;
    onChange([
      ...subscriptions,
      { id: Date.now().toString(), name, monthlyCost: Number(cost) }
    ]);
    setName("");
    setCost("");
    setShowAdd(false);
  };

  const handleRemove = (id: string) => {
    onChange(subscriptions.filter(s => s.id !== id));
  };

  const formatEuro = (val: number) => 
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);

  const totalMonthly = subscriptions.reduce((acc, s) => acc + s.monthlyCost, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="flex-between">
         <div>
           <h2 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>Flujo Recurrente (Gastos y Pagas)</h2>
           <span style={{ fontSize: "1.5rem", fontWeight: 700, color: totalMonthly <= 0 ? "var(--accent-positive)" : "var(--text-primary)" }}>
             {totalMonthly <= 0 ? '+' : ''}{formatEuro(Math.abs(totalMonthly))} <span className="text-muted" style={{fontSize:"0.9rem"}}>/ mes {totalMonthly <= 0 ? '(Favor)' : '(Gastos)'}</span>
           </span>
        </div>
        <button className="btn btn-outline" style={{ borderRadius: "20px", display: "flex", gap: "0.5rem" }} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> <span>Añadir / Restar</span>
        </button>
      </div>

      {showAdd && (
        <div className="panel" style={{ display: "flex", gap: "0.5rem" }}>
          <input className="input-field" placeholder="Netflix o Paga (negativo)" value={name} onChange={e => setName(e.target.value)} />
          <input className="input-field" type="number" placeholder="Coste o -Ingreso (€)" style={{ width: "150px" }} value={cost} onChange={e => setCost(e.target.value)} />
          <button className="btn btn-primary" onClick={handleAdd}>Guardar</button>
        </div>
      )}

      <div className="panel" style={{ display: "flex", flexDirection: "column", padding: "0" }}>
        {subscriptions.length === 0 && <p className="text-muted flex-center" style={{ padding: "2rem" }}>No hay nada.</p>}
        {subscriptions.map((sub, idx) => (
          <div key={sub.id} className="flex-between" style={{ 
            padding: "1rem 1.5rem",
            borderBottom: idx !== subscriptions.length - 1 ? "1px solid var(--border-color)" : "none"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
               <Repeat size={18} className="text-muted" />
               <span style={{ fontWeight: 500, fontSize: "1.05rem" }}>{sub.name}</span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
               <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontWeight: 600, fontSize: "1.05rem", color: sub.monthlyCost < 0 ? "var(--accent-positive)" : "inherit" }}>
                     {sub.monthlyCost < 0 ? `+${formatEuro(Math.abs(sub.monthlyCost))}` : formatEuro(sub.monthlyCost)}
                  </span>
                  <span className="text-muted" style={{fontSize: "0.8rem"}}>
                     {sub.monthlyCost < 0 ? `+${formatEuro(Math.abs(sub.monthlyCost) * 12)} al año` : `${formatEuro(sub.monthlyCost * 12)} al año`}
                  </span>
               </div>
              <button onClick={() => handleRemove(sub.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.5 }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
