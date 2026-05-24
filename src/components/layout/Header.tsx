import { motion } from "framer-motion";

const chips = [
  "Proyecto académico",
  "Universidad de Antioquia",
  "Simplex tabular",
  "Método gráfico",
  "Análisis de sensibilidad",
  "Forma aumentada",
  "Paso a paso",
];

export function Header() {
  return (
    <header className="md-elevated mx-3 mt-3 overflow-hidden px-5 py-5 sm:mx-6 sm:mt-6 sm:px-7 sm:py-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ rotate: -8, scale: 0.9, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-elevation-2"
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
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                <span className="text-gradient">Solver de Programación Lineal</span>
              </h1>
              <p className="mt-1 text-sm font-medium text-foreground sm:text-base">
                Aplicativo académico para resolver modelos de PL paso a paso
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Herramienta interactiva para formular, resolver y visualizar problemas de
                Programación Lineal mediante Simplex tabular, método gráfico y análisis de
                sensibilidad.
              </p>
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

        <div className="rounded-3xl bg-surface-alt p-4 shadow-elevation-1">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface font-semibold tracking-wide text-primary-dark shadow-elevation-1">
              UdeA
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Contexto institucional
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                Universidad de Antioquia
              </div>
              <div className="text-xs leading-relaxed text-muted-foreground">
                Espacio reservado para el logo oficial cuando se agregue como asset local.
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
