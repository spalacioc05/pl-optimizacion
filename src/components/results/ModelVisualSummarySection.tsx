import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LinearProgrammingProblem, SimplexResult } from "@/lib/linear-programming/types";
import { formatNumber } from "@/lib/linear-programming/utils";

interface Props {
  problem: LinearProgrammingProblem;
  result: SimplexResult;
}

const CHART_COLORS = ["#0f766e", "#14b8a6", "#0891b2", "#f59e0b", "#fb7185", "#8b5cf6"];

export function ModelVisualSummarySection({ problem, result }: Props) {
  const optimalValueLabel =
    problem.optimizationType === "min" ? "Valor mínimo actual" : "Valor máximo actual";
  const decisionData = Object.entries(result.decisionVariables)
    .sort(([left], [right]) => left.localeCompare(right, "es"))
    .map(([name, value], index) => ({
      name,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

  const slackData = Object.entries(result.slackVariables)
    .sort(([left], [right]) => left.localeCompare(right, "es"))
    .map(([name, value], index) => ({
      name,
      value,
      color: value === 0 ? "#0f766e" : CHART_COLORS[(index + 2) % CHART_COLORS.length],
    }));

  const maxCoefficient = Math.max(
    1,
    ...problem.constraints.flatMap((constraint) =>
      constraint.coefficients.map((value) => Math.abs(value)),
    ),
  );

  const activeConstraints = slackData
    .filter((item) => Math.abs(item.value) < 1e-9)
    .map((item) => item.name.replace("S", "R"));
  const inactiveConstraints = slackData
    .filter((item) => Math.abs(item.value) >= 1e-9)
    .map((item) => item.name.replace("S", "R"));

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="md-elevated overflow-hidden p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Resumen visual del modelo
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            La visualización geométrica completa solo está disponible hasta 3 variables. Para este
            modelo se muestra la solución tabular, sensibilidad y un resumen algebraico con barras y
            mapa de calor.
          </p>
        </div>
        <div className="rounded-full bg-accent/15 px-3 py-1 text-[11px] font-semibold text-primary-dark">
          {problem.objectiveCoefficients.length} variables
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="md-surface p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Variables de decisión
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={decisionData} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d7e3f1" />
                <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 12 }} />
                <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {decisionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md-surface p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Holguras finales
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={slackData}
                layout="vertical"
                margin={{ top: 12, right: 16, bottom: 8, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d7e3f1" />
                <XAxis type="number" tick={{ fill: "#475569", fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#475569", fontSize: 12 }}
                  width={48}
                />
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                  {slackData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="md-surface p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mapa de calor de la matriz A
          </div>
          <div className="scrollbar-thin overflow-x-auto pb-1">
            <div
              className="grid min-w-max gap-2"
              style={{
                gridTemplateColumns: `120px repeat(${problem.objectiveCoefficients.length}, minmax(56px, 72px))`,
              }}
            >
              <div />
              {problem.objectiveCoefficients.map((_, index) => (
                <div
                  key={`head-${index}`}
                  className="rounded-xl bg-surface-alt px-2 py-2 text-center text-xs font-semibold text-muted-foreground"
                >
                  X{index + 1}
                </div>
              ))}
              {problem.constraints.map((constraint, rowIndex) => (
                <div key={`constraint-row-${rowIndex}`} className="contents">
                  <div className="rounded-xl bg-surface-alt px-3 py-2 text-xs font-semibold text-primary-dark">
                    Restricción {rowIndex + 1}
                  </div>
                  {constraint.coefficients.map((value, columnIndex) => {
                    const intensity = Math.abs(value) / maxCoefficient;
                    return (
                      <div
                        key={`cell-${rowIndex}-${columnIndex}`}
                        className="grid h-14 place-items-center rounded-xl border border-border/60 font-mono text-sm font-semibold text-foreground"
                        style={{
                          backgroundColor: `rgba(20, 184, 166, ${0.12 + intensity * 0.34})`,
                        }}
                      >
                        {formatNumber(value)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md-surface p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Restricciones activas e inactivas
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <div className="mb-2 font-semibold text-foreground">Activas</div>
              <div className="flex flex-wrap gap-2">
                {activeConstraints.length > 0 ? (
                  activeConstraints.map((constraint) => (
                    <span
                      key={constraint}
                      className="whitespace-nowrap rounded-full bg-optimal px-3 py-1 text-[11px] font-semibold text-primary-dark"
                    >
                      {constraint}
                    </span>
                  ))
                ) : (
                  <span className="whitespace-nowrap rounded-full bg-surface-alt px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                    Ninguna activa
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="mb-2 font-semibold text-foreground">Con holgura</div>
              <div className="flex flex-wrap gap-2">
                {inactiveConstraints.length > 0 ? (
                  inactiveConstraints.map((constraint) => (
                    <span
                      key={constraint}
                      className="whitespace-nowrap rounded-full bg-accent/15 px-3 py-1 text-[11px] font-semibold text-primary-dark"
                    >
                      {constraint}
                    </span>
                  ))
                ) : (
                  <span className="whitespace-nowrap rounded-full bg-surface-alt px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                    Sin holguras
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-2xl bg-surface-alt p-3 text-sm leading-relaxed text-muted-foreground">
              {optimalValueLabel}:{" "}
              <span className="font-mono font-semibold text-primary-dark">
                Z = {formatNumber(result.optimalValue)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
