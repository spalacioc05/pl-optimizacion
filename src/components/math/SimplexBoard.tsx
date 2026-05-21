import { motion } from "framer-motion";
import type { SimplexBoardData } from "@/lib/linear-programming/types";

interface Props {
  table: SimplexBoardData;
  caption?: string;
}

function fmt(n: number) {
  if (Number.isNaN(n)) return "-";
  if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
  const r = Math.round(n * 100) / 100;
  return r.toString();
}

export function SimplexBoard({ table, caption }: Props) {
  return (
    <div className="md-surface overflow-hidden">
      {caption && (
        <div className="border-b border-border bg-surface-alt px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {caption}
        </div>
      )}
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-primary/5 to-accent/5">
              {table.headers.map((h, i) => (
                <th
                  key={h}
                  className={`px-3 py-3 text-center font-mono text-xs font-semibold uppercase tracking-wider ${
                    i === 0 ? "text-left text-primary-dark" : "text-foreground"
                  } ${
                    table.pivotCol !== undefined && i === table.pivotCol + 1 ? "bg-pivot-col" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => {
              const isZ = row.label === "Z";
              const isPivotRow = row.isPivotRow;
              return (
                <motion.tr
                  key={`${row.label}-${ri}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ri * 0.04 }}
                  className={`${isZ ? "bg-secondary/40 font-semibold" : ri % 2 ? "bg-surface-alt/60" : ""} ${
                    isPivotRow ? "!bg-pivot-row" : ""
                  } border-t border-border/60`}
                >
                  <td
                    className={`px-3 py-2.5 text-left font-mono text-sm font-semibold ${
                      isZ ? "text-primary-dark" : "text-foreground"
                    }`}
                  >
                    {row.label}
                  </td>
                  {row.values.map((v, ci) => {
                    const isPivotCol = table.pivotCol !== undefined && ci === table.pivotCol;
                    const isPivot =
                      isPivotRow && table.pivotCol !== undefined && ci === table.pivotCol;
                    const isRatioCell = ci === row.values.length - 1;
                    return (
                      <td
                        key={ci}
                        className={`px-3 py-2.5 text-center font-mono text-sm tabular-nums ${
                          isPivotCol && !isPivotRow ? "bg-pivot-col/60" : ""
                        } ${isPivot ? "!bg-pivot font-bold text-primary-dark ring-2 ring-inset ring-primary" : ""} ${
                          isRatioCell && isPivotRow
                            ? "bg-optimal/80 font-semibold text-primary-dark"
                            : ""
                        }`}
                      >
                        {fmt(v)}
                      </td>
                    );
                  })}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
