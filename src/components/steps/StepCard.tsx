import { motion } from "framer-motion";
import { SimplexBoard } from "@/components/math/SimplexBoard";
import { OperationList } from "@/components/math/OperationList";
import type { LinearModel, SolverStep } from "@/lib/linear-programming/types";
import {
  formatConstraint,
  formatObjectiveFunction,
  modelToProblem,
} from "@/lib/linear-programming/utils";

interface Props {
  step: SolverStep;
  model: LinearModel;
  index: number;
  total: number;
}

function ModelDisplay({ model }: { model: LinearModel }) {
  const problem = modelToProblem(model);
  return (
    <div className="rounded-2xl bg-surface-alt p-4 font-mono text-sm">
      <div className="mb-2">
        <span className="text-primary font-semibold">
          {formatObjectiveFunction(problem).replace(/<=/g, "≤")}
        </span>
      </div>
      <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        Sujeto a
      </div>
      {model.constraints.map((constraint, i) => (
        <div key={i} className="ml-3 text-foreground">
          {formatConstraint(constraint).replace(/<=/g, "≤")}
        </div>
      ))}
      <div className="ml-3 mt-1 text-muted-foreground">{model.variables.join(", ")} ≥ 0</div>
    </div>
  );
}

export function StepCard({ step, model, index, total }: Props) {
  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className="md-elevated p-5 sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            {step.subtitle}
          </div>
          <h3 className="mt-0.5 text-lg font-semibold text-foreground sm:text-xl">{step.title}</h3>
        </div>
        <div className="shrink-0 rounded-full bg-secondary px-3 py-1 font-mono text-xs font-semibold text-secondary-foreground">
          {index + 1} / {total}
        </div>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{step.explanation}</p>

      <div className="space-y-4">
        {step.summary ? (
          <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="md-surface p-4">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Resumen de iteración
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl bg-surface-alt p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Variables básicas
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {step.summary.basicVariables.map((variable) => (
                      <span
                        key={variable}
                        className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary-dark"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-surface-alt p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Variables no básicas
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {step.summary.nonBasicVariables.map((variable) => (
                      <span
                        key={variable}
                        className="rounded-full bg-secondary px-2.5 py-1 font-mono text-xs font-semibold text-secondary-foreground"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-surface-alt p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Valor actual de Z
                  </div>
                  <div className="mt-2 font-mono text-2xl font-bold text-primary-dark">
                    {step.summary.objectiveValue}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-surface-alt p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Solución básica actual
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(step.summary.solution).map(([variable, value]) => (
                    <span
                      key={variable}
                      className="rounded-full bg-background px-2.5 py-1 font-mono text-xs shadow-elevation-1"
                    >
                      {variable} = {value}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="md-surface p-4">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Decisiones clave
              </div>
              <div className="space-y-2 rounded-xl bg-surface-alt p-3 text-sm">
                <div>
                  <span className="font-semibold text-foreground">Estado:</span>{" "}
                  {step.summary.status}
                </div>
                <div className="leading-relaxed text-muted-foreground">{step.summary.reason}</div>
                {step.summary.mostNegativeVariable ? (
                  <div>
                    <span className="font-semibold text-foreground">Coeficiente más negativo:</span>{" "}
                    <span className="font-mono">
                      {step.summary.mostNegativeVariable} = {step.summary.mostNegativeValue}
                    </span>
                  </div>
                ) : null}
                {step.summary.enteringVariable ? (
                  <div>
                    <span className="font-semibold text-foreground">Entra:</span>{" "}
                    <span className="font-mono">{step.summary.enteringVariable}</span>
                  </div>
                ) : null}
                {step.summary.leavingVariable ? (
                  <div>
                    <span className="font-semibold text-foreground">Sale:</span>{" "}
                    <span className="font-mono">{step.summary.leavingVariable}</span>
                  </div>
                ) : null}
                {step.summary.pivotValue !== undefined ? (
                  <div>
                    <span className="font-semibold text-foreground">Pivote:</span>{" "}
                    <span className="font-mono">
                      {step.summary.pivotValue}
                      {step.summary.pivotPosition ? ` (${step.summary.pivotPosition})` : ""}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {step.kind === "model" && <ModelDisplay model={model} />}
        {step.operations && step.kind !== "augmented" && (
          <OperationList operations={step.operations} />
        )}
        {step.kind === "augmented" && step.operations && (
          <div className="rounded-2xl bg-surface-alt p-4 font-mono text-sm">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Forma estándar
            </div>
            {step.operations.map((o, i) => (
              <div key={i} className="py-0.5">
                {o}
              </div>
            ))}
          </div>
        )}
        {step.table && <SimplexBoard table={step.table} caption={step.tableCaption} />}
        {step.comparison ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <SimplexBoard table={step.comparison.before} caption={step.comparison.beforeCaption} />
            <SimplexBoard table={step.comparison.after} caption={step.comparison.afterCaption} />
          </div>
        ) : null}
        {step.ratios && (
          <div className="md-surface p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Razones mínimas
            </div>
            <div className="space-y-1.5 font-mono text-sm">
              {step.ratios.map((r) => (
                <div
                  key={r.row}
                  className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${r.min ? "bg-pivot-row font-semibold text-primary-dark" : "bg-surface-alt"}`}
                >
                  <span>{r.row}</span>
                  <span>{r.value}</span>
                  {r.min && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                      Mín
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {step.highlights && (
          <div className="flex flex-wrap gap-2 text-xs">
            {step.highlights.entering && (
              <span className="rounded-full bg-pivot-col px-3 py-1 font-mono font-semibold">
                Entra → {step.highlights.entering}
              </span>
            )}
            {step.highlights.leaving && (
              <span className="rounded-full bg-pivot-row px-3 py-1 font-mono font-semibold">
                Sale → {step.highlights.leaving}
              </span>
            )}
            {step.highlights.pivot !== undefined && (
              <span className="rounded-full bg-pivot px-3 py-1 font-mono font-semibold text-primary-dark">
                Pivote = {step.highlights.pivot}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
