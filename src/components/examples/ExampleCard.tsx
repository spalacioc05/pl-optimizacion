import { motion } from "framer-motion";
import type { ExampleModel } from "@/lib/linear-programming/types";
import {
  buildExpectedSummary,
  formatConstraint,
  formatObjectiveFunction,
  modelToProblem,
} from "@/lib/linear-programming/utils";

interface Props {
  model: ExampleModel;
  selected: boolean;
  onSelect: () => void;
}

export function ExampleCard({ model, selected, onSelect }: Props) {
  const problem = modelToProblem(model);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-elevation-2"
          : "border-border bg-surface hover:border-accent/60 hover:shadow-elevation-2"
      }`}
    >
      {selected && (
        <motion.div
          layoutId="example-selected"
          className="absolute inset-0 -z-10 gradient-primary opacity-[0.06]"
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{model.name}</h3>
            {selected && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                Activo
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{model.description}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 rounded-xl bg-surface-alt p-3 font-mono text-[11px] leading-relaxed">
        <div>
          <span className="text-primary">
            {formatObjectiveFunction(problem).replace(/<=/g, "≤")}
          </span>
        </div>
        {model.constraints.map((constraint, i) => (
          <div key={i} className="text-muted-foreground">
            {formatConstraint(constraint).replace(/<=/g, "≤")}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-md bg-optimal px-2 py-0.5 font-mono text-primary-dark">
          {buildExpectedSummary(model)}
        </span>
        {Object.entries(model.expectedSolution.variables).map(([k, v]) => (
          <span key={k} className="rounded-md bg-pivot-col px-2 py-0.5 font-mono">
            {k} = {v}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          {selected ? "Ejemplo cargado" : "Pulsa para cargar"}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
            selected
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground group-hover:bg-accent group-hover:text-accent-foreground"
          }`}
        >
          Cargar ejemplo
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </motion.button>
  );
}
