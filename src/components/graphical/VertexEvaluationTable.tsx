import type { GraphicalResult } from "@/lib/linear-programming/types";
import { formatNumber } from "@/lib/linear-programming/utils";

interface VertexEvaluationTableProps {
  result: GraphicalResult;
  activeVertexId?: string;
  revealedVertexIds?: string[];
}

export function VertexEvaluationTable({
  result,
  activeVertexId,
  revealedVertexIds,
}: VertexEvaluationTableProps) {
  const revealedSet = new Set(revealedVertexIds ?? result.vertices.map((vertex) => vertex.id));

  return (
    <div className="md-surface overflow-hidden">
      <div className="border-b border-border bg-surface-alt px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Evaluación de vértices factibles
      </div>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-140 border-collapse text-sm">
          <thead>
            <tr className="bg-linear-to-r from-primary/5 to-accent/5">
              <th className="px-3 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-primary-dark">
                Punto
              </th>
              <th className="px-3 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                Sustitución
              </th>
              <th className="px-3 py-3 text-center font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                Valor de Z
              </th>
              <th className="px-3 py-3 text-center font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {result.vertices.map((vertex, index) => {
              const isOptimal = result.optimalVertex?.id === vertex.id;
              const isActive = activeVertexId === vertex.id;
              const isRevealed = revealedSet.has(vertex.id);
              return (
                <tr
                  key={vertex.id}
                  className={`${isOptimal ? "bg-optimal/75" : isActive ? "bg-pivot-row/85" : index % 2 ? "bg-surface-alt/60" : ""} border-t border-border/60 ${!isRevealed ? "opacity-45" : ""}`}
                >
                  <td className="px-3 py-2.5 text-left font-mono text-sm font-semibold text-foreground">
                    {vertex.label} ({formatNumber(vertex.x)}, {formatNumber(vertex.y)})
                  </td>
                  <td className="px-3 py-2.5 text-left font-mono text-sm text-muted-foreground">
                    {vertex.substitution}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-sm font-semibold text-primary-dark">
                    {isRevealed ? `= ${formatNumber(vertex.z)}` : "Pendiente"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${isOptimal ? "bg-primary text-primary-foreground" : isActive ? "bg-pivot-row text-primary-dark" : "bg-surface-alt text-muted-foreground"}`}
                    >
                      {isOptimal ? "Óptimo" : "Factible"}
                    </span>
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
