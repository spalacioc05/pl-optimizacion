import { motion } from "framer-motion";
import { GraphicalPlane } from "@/components/graphical/GraphicalPlane";
import type { GraphicalResult, SimplexResult } from "@/lib/linear-programming/types";
import { formatNumber } from "@/lib/linear-programming/utils";

interface Props {
  result: SimplexResult;
  graphicalResult: GraphicalResult;
  interpretation?: string;
}

function StatCard({
  label,
  value,
  tone = "default",
  delay = 0,
}: {
  label: string;
  value: string | number;
  tone?: "default" | "primary" | "accent";
  delay?: number;
}) {
  const styles =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "accent"
        ? "bg-accent/15 text-primary-dark"
        : "bg-surface-alt text-foreground";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl p-3 text-center shadow-elevation-1 ${styles}`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</div>
      <div className="font-mono text-lg font-bold tabular-nums">{value}</div>
    </motion.div>
  );
}

export function SolutionShowcase({ result, graphicalResult, interpretation }: Props) {
  const orderedDecisionVariables = Object.entries(result.decisionVariables).sort(
    ([left], [right]) => left.localeCompare(right, "es"),
  );
  const orderedSlackVariables = Object.entries(result.slackVariables).sort(([left], [right]) =>
    left.localeCompare(right, "es"),
  );
  const optimalPoint =
    result.decisionVariables.X1 !== undefined && result.decisionVariables.X2 !== undefined
      ? `(${formatNumber(result.decisionVariables.X1)}, ${formatNumber(result.decisionVariables.X2)})`
      : null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="md-elevated relative overflow-hidden p-5 sm:p-6"
    >
      <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -left-12 -bottom-12 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-optimal px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-dark">
            Solución óptima
          </span>
          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
            Máximo global
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Valor óptimo
            </div>
            <div className="font-mono text-6xl font-bold leading-none">
              <span className="text-gradient">Z = {formatNumber(result.optimalValue)}</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {orderedDecisionVariables.map(([k, v], i) => (
                <StatCard key={k} label={k} value={v} tone="primary" delay={i * 0.05} />
              ))}
              {orderedSlackVariables.map(([k, v], i) => (
                <StatCard
                  key={k}
                  label={k}
                  value={v}
                  tone={v === 0 ? "default" : "accent"}
                  delay={0.15 + i * 0.05}
                />
              ))}
            </div>

            <p className="mt-5 rounded-2xl bg-surface-alt p-4 text-sm leading-relaxed text-muted-foreground">
              La función objetivo alcanza su valor máximo global Z ={" "}
              <strong className="font-semibold text-foreground">
                {formatNumber(result.optimalValue)}
              </strong>
              {optimalPoint ? (
                <>
                  {" "}
                  en el vértice <span className="font-mono text-primary-dark">
                    {optimalPoint}
                  </span>{" "}
                  de la región factible.
                </>
              ) : null}{" "}
              {interpretation ?? result.message}
            </p>
          </div>

          <div className="hidden lg:block lg:w-[360px]">
            <div className="md-surface overflow-hidden p-2">
              {graphicalResult.available ? (
                <GraphicalPlane
                  result={graphicalResult}
                  activeStageIndex={graphicalResult.stages.length - 1}
                  compact
                />
              ) : (
                <div className="rounded-2xl bg-surface-alt p-4 text-sm leading-relaxed text-muted-foreground">
                  {graphicalResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
