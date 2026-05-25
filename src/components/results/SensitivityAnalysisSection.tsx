import { motion } from "framer-motion";
import { useMemo } from "react";
import type { LinearProgrammingProblem, SimplexResult } from "@/lib/linear-programming/types";
import { buildSensitivityAnalysis } from "@/lib/linear-programming/sensitivity";
import { formatNumber } from "@/lib/linear-programming/utils";

interface Props {
  problem: LinearProgrammingProblem;
  result: SimplexResult;
}

function SurfaceCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="md-surface overflow-hidden p-4">
      <div className="mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
        {description ? (
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground/80">{description}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function StatusChip({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "good" | "warn";
}) {
  const classes =
    tone === "good"
      ? "bg-optimal text-primary-dark"
      : tone === "warn"
        ? "bg-accent/15 text-primary-dark"
        : "bg-surface-alt text-foreground";

  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-alt p-3 shadow-elevation-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-lg font-bold text-primary-dark">{value}</div>
    </div>
  );
}

function ChipRow({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <StatusChip label={emptyLabel} />;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <StatusChip key={item} label={item} />
      ))}
    </div>
  );
}

export function SensitivityAnalysisSection({ problem, result }: Props) {
  const analysis = useMemo(() => buildSensitivityAnalysis(problem, result), [problem, result]);
  const optimalValueLabel = problem.optimizationType === "min" ? "Valor mínimo" : "Valor máximo";
  const reducedCostsDescription =
    problem.optimizationType === "min"
      ? "Se leen desde el tablero óptimo equivalente W = -Z. Para evitar conclusiones falsas, su interpretación se mantiene como referencia técnica del modelo transformado."
      : "Se leen desde la fila Z del tablero final para las variables de decisión.";
  const shadowPricesDescription =
    problem.optimizationType === "min"
      ? "Se muestran como referencia numérica del modelo equivalente W = -Z. La interpretación directa del signo en la minimización original se deja explícitamente en pausa."
      : "Impacto marginal de cada recurso bajo la base óptima actual.";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="md-elevated overflow-hidden p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Análisis de sensibilidad
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {problem.optimizationType === "min"
              ? "Lectura base del tablero óptimo equivalente del solver. En minimización se muestran restricciones activas, holguras y referencias técnicas de costos reducidos y precios sombra sin forzar interpretaciones de signo que aún no están desarrolladas."
              : "Lectura base del tablero óptimo para interpretar restricciones activas, holguras, costos reducidos y precios sombra sin inventar rangos que aún no se calcularon."}
          </p>
        </div>
        <StatusChip
          label={analysis.available ? "Versión base funcional" : "No disponible"}
          tone={analysis.available ? "good" : "warn"}
        />
      </div>

      {!analysis.available ? (
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm text-primary-dark">
          {analysis.message}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryMetric
              label={optimalValueLabel}
              value={`Z = ${formatNumber(analysis.optimalValue)}`}
            />
            <SummaryMetric
              label="Variables básicas"
              value={String(analysis.basicVariables.length)}
            />
            <SummaryMetric label="No básicas" value={String(analysis.nonBasicVariables.length)} />
            <SummaryMetric
              label="Restricciones activas"
              value={String(analysis.activeConstraints.length)}
            />
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <SurfaceCard
              title="Resumen del óptimo"
              description="Composición de la base final, holguras y restricciones limitantes."
            >
              <div className="space-y-4 text-sm">
                <div>
                  <div className="mb-2 font-semibold text-foreground">Variables básicas</div>
                  <ChipRow items={analysis.basicVariables} emptyLabel="Sin variables básicas" />
                </div>
                <div>
                  <div className="mb-2 font-semibold text-foreground">Variables no básicas</div>
                  <ChipRow
                    items={analysis.nonBasicVariables}
                    emptyLabel="Sin variables no básicas"
                  />
                </div>
                <div>
                  <div className="mb-2 font-semibold text-foreground">Variables de holgura</div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.slackVariables.map((item) => (
                      <StatusChip
                        key={item.variable}
                        label={`${item.variable} = ${formatNumber(item.value)}`}
                        tone={Math.abs(item.value) < 1e-9 ? "default" : "warn"}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 font-semibold text-foreground">Restricciones activas</div>
                  <ChipRow items={analysis.activeConstraints} emptyLabel="Ninguna activa" />
                </div>
                <div>
                  <div className="mb-2 font-semibold text-foreground">
                    Restricciones con holgura
                  </div>
                  <ChipRow items={analysis.inactiveConstraints} emptyLabel="Sin holguras" />
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard
              title="Estado de restricciones"
              description="Comparación entre lado derecho, holgura y lectura operativa del recurso."
            >
              <div className="scrollbar-thin overflow-x-auto">
                <table className="min-w-190 text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="min-w-22 px-2 py-2">Restricción</th>
                      <th className="min-w-26 px-2 py-2">Lado derecho</th>
                      <th className="min-w-23 px-2 py-2">Holgura</th>
                      <th className="min-w-30 px-2 py-2">Estado</th>
                      <th className="min-w-65 px-2 py-2">Interpretación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.constraintRows.map((row) => (
                      <tr
                        key={row.constraint}
                        className="border-b border-border/70 align-top last:border-b-0"
                      >
                        <td className="px-2 py-2 font-mono font-semibold text-foreground">
                          {row.constraint}
                        </td>
                        <td className="px-2 py-2 font-mono">{formatNumber(row.rhs)}</td>
                        <td className="px-2 py-2 font-mono">{formatNumber(row.slack)}</td>
                        <td className="px-2 py-2">
                          <StatusChip
                            label={row.status}
                            tone={row.status === "Activa" ? "good" : "warn"}
                          />
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{row.interpretation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>

            <SurfaceCard title="Costos reducidos" description={reducedCostsDescription}>
              <div className="scrollbar-thin overflow-x-auto">
                <table className="min-w-195 text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="min-w-22 px-2 py-2">Variable</th>
                      <th className="min-w-26 px-2 py-2">Valor final</th>
                      <th className="min-w-29 px-2 py-2">Costo reducido</th>
                      <th className="min-w-30 px-2 py-2">Estado</th>
                      <th className="min-w-65 px-2 py-2">Interpretación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.reducedCostRows.map((row) => (
                      <tr
                        key={row.variable}
                        className="border-b border-border/70 align-top last:border-b-0"
                      >
                        <td className="px-2 py-2 font-mono font-semibold text-foreground">
                          {row.variable}
                        </td>
                        <td className="px-2 py-2 font-mono">{formatNumber(row.finalValue)}</td>
                        <td className="px-2 py-2 font-mono">{formatNumber(row.reducedCost)}</td>
                        <td className="px-2 py-2">
                          <StatusChip
                            label={row.status}
                            tone={row.status === "Básica" ? "good" : "default"}
                          />
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{row.interpretation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>

            <SurfaceCard title="Precios sombra" description={shadowPricesDescription}>
              <div className="scrollbar-thin overflow-x-auto">
                <table className="min-w-195 text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="min-w-22 px-2 py-2">Restricción</th>
                      <th className="min-w-29 px-2 py-2">Precio sombra</th>
                      <th className="min-w-23 px-2 py-2">Holgura</th>
                      <th className="min-w-30 px-2 py-2">Estado</th>
                      <th className="min-w-65 px-2 py-2">Interpretación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.shadowPriceRows.map((row) => (
                      <tr
                        key={row.constraint}
                        className="border-b border-border/70 align-top last:border-b-0"
                      >
                        <td className="px-2 py-2 font-mono font-semibold text-foreground">
                          {row.constraint}
                        </td>
                        <td className="px-2 py-2 font-mono">{formatNumber(row.shadowPrice)}</td>
                        <td className="px-2 py-2 font-mono">{formatNumber(row.slack)}</td>
                        <td className="px-2 py-2">
                          <StatusChip
                            label={row.status}
                            tone={row.status === "Activa" ? "good" : "warn"}
                          />
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{row.interpretation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <SurfaceCard
              title="Rangos permisibles de la función objetivo"
              description="Estructura preparada para completar los intervalos de sensibilidad de coeficientes."
            >
              <div className="scrollbar-thin overflow-x-auto">
                <table className="min-w-180 text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-2 py-2">Variable</th>
                      <th className="px-2 py-2">Coeficiente actual</th>
                      <th className="px-2 py-2">Aumento permisible</th>
                      <th className="px-2 py-2">Disminución permisible</th>
                      <th className="min-w-35 px-2 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.objectiveRangeRows.map((row) => (
                      <tr key={row.variable} className="border-b border-border/70 last:border-b-0">
                        <td className="px-2 py-2 font-mono font-semibold text-foreground">
                          {row.variable}
                        </td>
                        <td className="px-2 py-2 font-mono">
                          {formatNumber(row.currentCoefficient)}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{row.allowableIncrease}</td>
                        <td className="px-2 py-2 text-muted-foreground">{row.allowableDecrease}</td>
                        <td className="px-2 py-2">
                          <StatusChip label={row.status} tone="warn" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>

            <SurfaceCard
              title="Rangos permisibles del lado derecho"
              description="Base lista para extender el análisis sobre cambios en los recursos disponibles."
            >
              <div className="scrollbar-thin overflow-x-auto">
                <table className="min-w-180 text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-2 py-2">Restricción</th>
                      <th className="px-2 py-2">RHS actual</th>
                      <th className="px-2 py-2">Aumento permisible</th>
                      <th className="px-2 py-2">Disminución permisible</th>
                      <th className="min-w-35 px-2 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.rhsRangeRows.map((row) => (
                      <tr
                        key={row.constraint}
                        className="border-b border-border/70 last:border-b-0"
                      >
                        <td className="px-2 py-2 font-mono font-semibold text-foreground">
                          {row.constraint}
                        </td>
                        <td className="px-2 py-2 font-mono">{formatNumber(row.rhs)}</td>
                        <td className="px-2 py-2 text-muted-foreground">{row.allowableIncrease}</td>
                        <td className="px-2 py-2 text-muted-foreground">{row.allowableDecrease}</td>
                        <td className="px-2 py-2">
                          <StatusChip label={row.status} tone="warn" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          </div>

          <div className="mt-4 space-y-2 rounded-2xl bg-surface-alt p-4 text-sm text-muted-foreground">
            <div>
              Esta versión base interpreta el tablero óptimo. Los rangos permisibles completos
              pueden ampliarse posteriormente con cálculo matricial de sensibilidad.
            </div>
            {analysis.notes.map((note) => (
              <div key={note}>{note}</div>
            ))}
          </div>
        </>
      )}
    </motion.section>
  );
}
