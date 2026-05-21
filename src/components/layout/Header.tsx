import { motion } from "framer-motion";

const chips = [
  "Sprint 1",
  "Maximización",
  "Restricciones ≤",
  "Variables ≥ 0",
  "Método gráfico",
  "Tablero Simplex",
];

export function Header() {
  return (
    <header className="md-elevated mx-3 mt-3 px-5 py-4 sm:mx-6 sm:mt-6 sm:px-7 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -8, scale: 0.9, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-elevation-2"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M3 3v18h18" strokeLinecap="round" />
              <path d="M7 15l4-6 4 3 5-8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              <span className="text-gradient">Solver de Programación Lineal</span>
            </h1>
            <p className="text-sm text-muted-foreground">Método Simplex paso a paso</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c, i) => (
            <motion.span
              key={c}
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 * i }}
              className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-secondary-foreground"
            >
              {c}
            </motion.span>
          ))}
        </div>
      </div>
    </header>
  );
}
