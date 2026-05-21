import { motion } from "framer-motion";

interface Props {
  operations: string[];
  title?: string;
}

export function OperationList({ operations, title = "Operaciones de renglón" }: Props) {
  return (
    <div className="md-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
          </svg>
        </span>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <div className="space-y-2 rounded-xl bg-surface-alt p-3">
        {operations.map((op, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 font-mono text-[13px] shadow-elevation-1"
          >
            <span className="text-[10px] font-bold text-accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{op}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
