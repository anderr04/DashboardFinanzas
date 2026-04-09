"use client";

import { useState } from "react";
import { Debt } from "@/types/finance";
import { CreditCard, Plus, Trash2 } from "lucide-react";

interface Props {
  debts: Debt[];
  onChange: (debts: Debt[]) => void;
}

export default function DebtsSection({ debts, onChange }: Props) {
  const [name, setName] = useState("");
  const [total, setTotal] = useState("");
  const [paid, setPaid] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    if (!name || isNaN(Number(total))) return;
    onChange([
      ...debts,
      { id: Date.now().toString(), name, totalAmount: Number(total), paidAmount: Number(paid) || 0 }
    ]);
    setName("");
    setTotal("");
    setPaid("");
    setShowAdd(false);
  };

  const handleRemove = (id: string) => {
    onChange(debts.filter(d => d.id !== id));
  };

  const formatEuro = (val: number) => 
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);

  const remaining = debts.reduce((acc, d) => acc + (d.totalAmount - d.paidAmount), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="flex-between">
        <div>
           <h2 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>Deudas y Pasivo</h2>
           <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{formatEuro(remaining)} <span className="text-muted" style={{fontSize: "0.9rem"}}>restante</span></span>
        </div>
        <button className="btn btn-outline" style={{ borderRadius: "20px", display: "flex", gap: "0.5rem" }} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> <span>Añadir Deuda</span>
        </button>
      </div>

      {showAdd && (
        <div className="panel" style={{ display: "flex", gap: "0.5rem" }}>
          <input className="input-field" placeholder="Nombre (Ej. Coche)" value={name} onChange={e => setName(e.target.value)} />
          <input className="input-field" type="number" placeholder="Total (€)" style={{ width: "120px" }} value={total} onChange={e => setTotal(e.target.value)} />
          <input className="input-field" type="number" placeholder="Pagado (€)" style={{ width: "120px" }} value={paid} onChange={e => setPaid(e.target.value)} />
          <button className="btn btn-primary" onClick={handleAdd}>Guardar</button>
        </div>
      )}

      <div className="panel" style={{ display: "flex", flexDirection: "column", padding: "0" }}>
        {debts.length === 0 && <p className="text-muted flex-center" style={{ padding: "2rem" }}>No hay deudas. ¡Genial!</p>}
        {debts.map((debt, idx) => {
          const progress = Math.min(100, Math.max(0, (debt.paidAmount / debt.totalAmount) * 100));
          return (
            <div key={debt.id} style={{ 
              padding: "1.5rem",
              borderBottom: idx !== debts.length - 1 ? "1px solid var(--border-color)" : "none",
              display: "flex", flexDirection: "column", gap: "0.75rem"
            }}>
              <div className="flex-between">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                   <CreditCard size={18} className="text-negative" />
                   <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>{debt.name}</span>
                </div>
                <button onClick={() => handleRemove(debt.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.5 }}>
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex-between" style={{ fontSize: "0.9rem" }}>
                <span className="text-muted">Abonado: <span style={{color: "var(--text-primary)"}}>{formatEuro(debt.paidAmount)}</span></span>
                <span className="text-muted">Total: <span style={{color: "var(--text-primary)"}}>{formatEuro(debt.totalAmount)}</span></span>
              </div>
              
              <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", backgroundColor: "var(--accent-positive)", transition: "width 0.3s ease" }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
