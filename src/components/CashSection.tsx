"use client";

import { useState } from "react";
import { CashAccount } from "@/types/finance";
import { Wallet, Plus, Trash2, Edit2, Check } from "lucide-react";

interface Props {
  cash: CashAccount[];
  onChange: (cash: CashAccount[]) => void;
}

export default function CashSection({ cash, onChange }: Props) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    if (!name || isNaN(Number(balance))) return;
    onChange([
      ...cash,
      { id: Date.now().toString(), name, balance: Number(balance) }
    ]);
    setName("");
    setBalance("");
    setShowAdd(false);
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEditStart = (account: CashAccount) => {
    setEditingId(account.id);
    setEditValue(account.balance.toString());
  };

  const handleEditSave = (id: string) => {
    onChange(cash.map(c => c.id === id ? { ...c, balance: Number(editValue) } : c));
    setEditingId(null);
  };

  const handleRemove = (id: string) => {
    onChange(cash.filter(c => c.id !== id));
  };

  const formatEuro = (val: number) => 
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);

  const total = cash.reduce((acc, c) => acc + c.balance, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="flex-between">
        <div>
           <h2 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>Efectivo</h2>
           <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{formatEuro(total)}</span>
        </div>
        <button className="btn btn-outline" style={{ borderRadius: "20px", display: "flex", gap: "0.5rem" }} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> <span>Añadir Cuenta</span>
        </button>
      </div>

      {showAdd && (
        <div className="panel" style={{ display: "flex", gap: "0.5rem" }}>
          <input className="input-field" placeholder="Nombre (Ej. Revolut)" value={name} onChange={e => setName(e.target.value)} />
          <input className="input-field" type="number" placeholder="Balance (€)" style={{ width: "150px" }} value={balance} onChange={e => setBalance(e.target.value)} />
          <button className="btn btn-primary" onClick={handleAdd}>Guardar</button>
        </div>
      )}

      <div className="panel" style={{ display: "flex", flexDirection: "column", padding: "0" }}>
        {cash.length === 0 && <p className="text-muted flex-center" style={{ padding: "2rem" }}>No hay cuentas agregadas.</p>}
        {cash.map((account, idx) => (
          <div key={account.id} className="flex-between" style={{ 
            padding: "1rem 1.5rem",
            borderBottom: idx !== cash.length - 1 ? "1px solid var(--border-color)" : "none"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
               <Wallet size={20} className="text-muted" />
               <span style={{ fontWeight: 500, fontSize: "1.05rem" }}>{account.name}</span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {editingId === account.id ? (
                 <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input 
                      type="number" 
                      className="input-field" 
                      style={{ width: "100px", padding: "0.25rem 0.5rem" }} 
                      value={editValue} 
                      onChange={e => setEditValue(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleEditSave(account.id)}
                      autoFocus
                    />
                    <button onClick={() => handleEditSave(account.id)} className="btn btn-primary" style={{ padding: "0.25rem 0.5rem" }}><Check size={16} /></button>
                 </div>
              ) : (
                 <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>{formatEuro(account.balance)}</span>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => handleEditStart(account)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.5 }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleRemove(account.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.5 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
