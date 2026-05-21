import { motion } from "framer-motion";
import type { SolverStep } from "@/lib/linear-programming/types";

const labels: Record<string, string> = {
  model: "modelo",
  augmented: "holguras",
  tableau: "tablero",
  optimality: "optimalidad",
  entering: "entra",
  ratios: "razones",
  leaving: "sale",
  pivot: "pivote",
  operations: "renglones",
  newTableau: "tablero",
  final: "solución",
  unbounded: "estado",
};

interface Props {
  steps: SolverStep[];
  current: number;
  onJump: (i: number) => void;
}

export function StepTimeline({ steps, current, onJump }: Props) {
  return (
    <div className="md-surface p-3">
      <div className="scrollbar-thin overflow-x-auto">
        <div className="flex items-center gap-2 px-1">
          {steps.map((s, i) => {
            const active = i === current;
            const done = i < current;
            return (
              <button
                key={s.id}
                onClick={() => onJump(i)}
                className="group relative flex shrink-0 flex-col items-center gap-1.5"
              >
                <motion.div
                  animate={{
                    scale: active ? 1.1 : 1,
                    backgroundColor: active
                      ? "var(--primary)"
                      : done
                        ? "var(--accent)"
                        : "var(--muted)",
                  }}
                  className="grid h-7 w-7 place-items-center rounded-full font-mono text-[11px] font-bold text-primary-foreground shadow-elevation-1 transition-all"
                >
                  {done ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span className={active ? "text-primary-foreground" : "text-muted-foreground"}>
                      {i + 1}
                    </span>
                  )}
                </motion.div>
                <span
                  className={`whitespace-nowrap text-[10px] font-medium ${active ? "text-primary-dark" : "text-muted-foreground"}`}
                >
                  {labels[s.kind] ?? s.kind}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
