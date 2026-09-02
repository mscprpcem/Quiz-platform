import React from 'react';
import { Table } from 'lucide-react';

export default function ComparisonTable({ comparison }) {
  if (!comparison || !comparison.headers || !comparison.rows) return null;

  const { title, badge, headers, rows } = comparison;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
            <Table size={15} />
          </div>
          <h2 className="text-sm sm:text-base font-black text-slate-900">
            {title || 'Architectural Comparison'}
          </h2>
        </div>
        {badge && (
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/80">
            {badge}
          </span>
        )}
      </div>

      <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-700 font-black">
              {headers.map((header, hIdx) => {
                let colClass = "py-3 px-4 font-black";
                if (hIdx === 0) colClass += " w-1/4 text-slate-800";
                else if (header.includes('DROP')) colClass += " text-rose-900 bg-rose-50/50";
                else if (header.includes('TRUNCATE')) colClass += " text-amber-900 bg-amber-50/50";
                else if (header.includes('DELETE')) colClass += " text-blue-900 bg-blue-50/50";
                else if (hIdx === 1) colClass += " text-amber-900 bg-amber-50/40";
                else if (hIdx === 2) colClass += " text-blue-950 bg-blue-50/40";
                return (
                  <th key={hIdx} className={colClass}>
                    {header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rIdx) => {
              const vals = row.values || [row.dbms, row.rdbms].filter(Boolean);
              return (
                <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800 bg-slate-50/30">
                    {row.feature}
                  </td>
                  {vals.map((val, vIdx) => {
                    const header = headers[vIdx + 1] || '';
                    let cellBg = "";

                    if (header.includes('DROP')) {
                      cellBg = "bg-rose-50/10 text-slate-700";
                    } else if (header.includes('TRUNCATE')) {
                      cellBg = "bg-amber-50/10 text-slate-900 font-medium";
                    } else if (header.includes('DELETE')) {
                      cellBg = "bg-blue-50/10 text-slate-700";
                    } else if (vIdx === 0) {
                      cellBg = "bg-amber-50/10 text-slate-600";
                    } else {
                      cellBg = "bg-blue-50/10 text-slate-900 font-medium";
                    }

                    return (
                      <td key={vIdx} className={`py-3 px-4 leading-relaxed ${cellBg}`}>
                        {val}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
