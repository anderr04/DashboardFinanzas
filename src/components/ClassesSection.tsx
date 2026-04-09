"use client";

import { useState } from "react";
import { ClassRecord } from "@/types/finance";
import { BookOpen, Plus, Trash2 } from "lucide-react";

interface Props {
  classes: ClassRecord[];
  onChange: (classes: ClassRecord[]) => void;
}

export default function ClassesSection({ classes, onChange }: Props) {
  const [student, setStudent] = useState("Telmo");
  const [modality, setModality] = useState<'Online' | 'Presencial'>('Online');
  const [hours, setHours] = useState("");
  const [month, setMonth] = useState(() => {
     const now = new Date();
     return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    if (!student || !month || isNaN(Number(hours))) return;
    onChange([
      ...classes,
      { id: Date.now().toString(), student, modality, month, hours: Number(hours) }
    ]);
    setHours("");
    setShowAdd(false);
  };

  const handleRemove = (id: string) => {
    onChange(classes.filter(c => c.id !== id));
  };

  const formatEuro = (val: number) => 
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);

  // Group classes by month
  const groupedClasses = classes.reduce((acc, curr) => {
    if (!acc[curr.month]) acc[curr.month] = [];
    acc[curr.month].push(curr);
    return acc;
  }, {} as Record<string, ClassRecord[]>);

  // Sort months descending
  const sortedMonths = Object.keys(groupedClasses).sort((a, b) => b.localeCompare(a));

  const calculateTotal = (records: ClassRecord[]) => {
      return records.reduce((acc, c) => {
          const rate = c.modality === 'Online' ? 12.5 : 15.0;
          return acc + (c.hours * rate);
      }, 0);
  };

  const calculatePaidTotal = (records: ClassRecord[]) => {
      return records.reduce((acc, c) => {
          if (!c.paid) return acc;
          const rate = c.modality === 'Online' ? 12.5 : 15.0;
          return acc + (c.hours * rate);
      }, 0);
  };

  const globalTotal = calculatePaidTotal(classes);
  const globalPotential = calculateTotal(classes);

  const handleToggleMonthPaid = (month: string) => {
      const isMonthFullyPaid = groupedClasses[month].every(c => c.paid);
      const newClasses = classes.map(c => {
          if (c.month === month) {
             return { ...c, paid: !isMonthFullyPaid };
          }
          return c;
      });
      onChange(newClasses);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="flex-between">
         <div>
           <h2 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>Clases Particulares</h2>
           <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{formatEuro(globalTotal)} <span className="text-muted" style={{fontSize:"0.9rem"}}>cobrado al total histórico</span></span>
           {globalPotential > globalTotal && <div className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>Pendiente de cobro: {formatEuro(globalPotential - globalTotal)}</div>}
        </div>
        <button className="btn btn-outline" style={{ borderRadius: "20px", display: "flex", gap: "0.5rem" }} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> <span>Añadir Clase</span>
        </button>
      </div>

      {showAdd && (
        <div className="panel" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
          
          <input className="input-field" type="month" style={{ width: "160px" }} value={month} onChange={e => setMonth(e.target.value)} />
          
          <select className="input-field" style={{ width: "160px" }} value={student} onChange={e => setStudent(e.target.value)}>
             <option value="Telmo">Telmo</option>
             <option value="Markel">Markel</option>
             <option value="Otro">Otro alumno</option>
          </select>
          {student === "Otro" && <input className="input-field" style={{ width: "120px" }} placeholder="Nombre" onChange={e => setStudent(e.target.value)} />}

          <select className="input-field" style={{ width: "160px" }} value={modality} onChange={e => setModality(e.target.value as any)}>
             <option value="Online">Online (€12.5/h)</option>
             <option value="Presencial">Presencial (€15/h)</option>
          </select>
          
          <input className="input-field" type="number" placeholder="Horas" step="0.5" style={{ width: "100px" }} value={hours} onChange={e => setHours(e.target.value)} />
          <button className="btn btn-primary" onClick={handleAdd}>Guardar</button>
        </div>
      )}

      {classes.length === 0 && <p className="text-muted flex-center panel" style={{ padding: "2rem" }}>No has registrado ninguna clase este año.</p>}
      
      {sortedMonths.map(m => {
          const monthRecords = groupedClasses[m];
          const monthTotal = calculateTotal(monthRecords);
          const [year, monthNum] = m.split("-");
          
          return (
             <div key={m} className="panel" style={{ padding: 0 }}>
               <div className="flex-between" style={{ padding: "1rem 1.5rem", backgroundColor: "rgba(0,0,0,0.2)", borderBottom: "1px solid var(--border-color)" }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {monthNum}/{year}
                    <button 
                       onClick={() => handleToggleMonthPaid(m)}
                       style={{
                          background: monthRecords.every(c => c.paid) ? 'var(--accent-positive)' : 'transparent',
                          border: monthRecords.every(c => c.paid) ? 'none' : '1px solid var(--border-color)',
                          color: monthRecords.every(c => c.paid) ? '#fff' : 'var(--text-secondary)',
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '10px',
                          cursor: 'pointer'
                       }}>
                       {monthRecords.every(c => c.paid) ? 'Cobrado' : 'Marcar Pagado'}
                    </button>
                  </span>
                  <span style={{ fontWeight: 600, color: monthRecords.every(c => c.paid) ? "var(--accent-positive)" : "var(--text-secondary)" }}>{formatEuro(monthTotal)}</span>
               </div>
               
               {monthRecords.map((r, idx) => {
                  const rate = r.modality === 'Online' ? 12.5 : 15;
                  return (
                     <div key={r.id} className="flex-between" style={{ 
                        padding: "1rem 1.5rem",
                        borderBottom: idx !== monthRecords.length - 1 ? "1px solid var(--border-color)" : "none",
                        opacity: r.paid ? 1 : 0.6
                     }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                           <BookOpen size={18} className="text-secondary" />
                           <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 500, fontSize: "1.05rem" }}>{r.student}</span>
                              <span className="text-muted" style={{ fontSize: "0.85rem" }}>{r.modality}</span>
                           </div>
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                           <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                              <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>{formatEuro(r.hours * rate)}</span>
                              <span className="text-muted" style={{fontSize: "0.8rem"}}>{r.hours} h @ {formatEuro(rate)}/h</span>
                           </div>
                           <button onClick={() => handleRemove(r.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.5 }}>
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                  )
               })}
             </div>
          );
      })}
    </div>
  );
}
