import type { GraphicalResult } from "@/lib/linear-programming/types";
import { formatNumber } from "@/lib/linear-programming/utils";

interface VertexEvaluationTableProps {
  result: GraphicalResult;
}

export function VertexEvaluationTable({ result }: VertexEvaluationTableProps) {
  return (
    <div className="md-surface overflow-hidden">
      <div className="border-b border-border bg-surface-alt px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Evaluación de vértices factibles
      </div>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-primary/5 to-accent/5">
              <th className="px-3 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-primary-dark">
                Vértice
              </th>
              <th className="px-3 py-3 text-center font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                X1
              </th>
              <th className="px-3 py-3 text-center font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                X2
              </th>
              <th className="px-3 py-3 text-center font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                Z
              </th>
            </tr>
          </thead>
          <tbody>
            {result.vertices.map((vertex, index) => {
              const isOptimal = result.optimalVertex?.id === vertex.id;
              return (
                <tr
                  key={vertex.id}
                  className={`${isOptimal ? "bg-optimal/70" : index % 2 ? "bg-surface-alt/60" : ""} border-t border-border/60`}
                >
                  <td className="px-3 py-2.5 text-left font-mono text-sm font-semibold text-foreground">
                    ({formatNumber(vertex.x)}, {formatNumber(vertex.y)})
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-sm">
                    {formatNumber(vertex.x)}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-sm">
                    {formatNumber(vertex.y)}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-sm font-semibold text-primary-dark">
                    {formatNumber(vertex.z)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
