const palette = ["#0891b2", "#14b8a6", "#0f766e", "#7c3aed", "#f59e0b"];

interface GraphLegendProps {
  constraintCount: number;
}

export function GraphLegend({ constraintCount }: GraphLegendProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-feasible ring-1 ring-accent/40" />
        Región factible
      </span>
      {Array.from({ length: constraintCount }, (_, index) => (
        <span key={`legend-${index}`} className="inline-flex items-center gap-1.5">
          <span
            className="h-0.5 w-4 rounded-full"
            style={{ background: palette[index % palette.length] }}
          />
          Restricción {index + 1}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        Máximo global
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-pivot-row ring-2 ring-primary/20" />
        Vértice en evaluación
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-0.5 w-4 rounded-full border-t-2 border-dashed border-primary-dark" />
        Recta de nivel Z activa
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-0.5 w-4 rounded-full border-t-2 border-dashed border-primary-dark/40" />
        Rectas Z anteriores
      </span>
    </div>
  );
}
