import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import type { LinearModel } from "@/data/mockExamples";

interface Props {
  model: LinearModel;
  progress?: number; // 0..1 controls drawing animation
}

const COLORS = ["#0891b2", "#14b8a6", "#0f766e", "#7c3aed", "#f59e0b"];

export function OptimizationGraph({ model, progress = 1 }: Props) {
  const W = 560;
  const H = 440;
  const padding = { top: 24, right: 24, bottom: 44, left: 56 };
  const innerW = W - padding.left - padding.right;
  const innerH = H - padding.top - padding.bottom;

  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null);

  const xMax = useMemo(() => {
    let m = 0;
    model.constraints.forEach((c) => {
      if (c.coefficients[0] > 0) m = Math.max(m, c.rhs / c.coefficients[0]);
    });
    return Math.max(8, Math.ceil(m * 1.15));
  }, [model]);

  const yMax = useMemo(() => {
    let m = 0;
    model.constraints.forEach((c) => {
      if (c.coefficients[1] > 0) m = Math.max(m, c.rhs / c.coefficients[1]);
    });
    return Math.max(8, Math.ceil(m * 1.15));
  }, [model]);

  const sx = (x: number) => padding.left + (x / xMax) * innerW;
  const sy = (y: number) => padding.top + innerH - (y / yMax) * innerH;

  // Compute feasible region polygon (intersections of constraints in first quadrant)
  const vertices = useMemo(() => {
    const lines = [
      ...model.constraints.map((c) => ({ a: c.coefficients[0], b: c.coefficients[1], c: c.rhs })),
      { a: 1, b: 0, c: 0 }, // x = 0
      { a: 0, b: 1, c: 0 }, // y = 0
    ];
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const { a: a1, b: b1, c: c1 } = lines[i];
        const { a: a2, b: b2, c: c2 } = lines[j];
        const det = a1 * b2 - a2 * b1;
        if (Math.abs(det) < 1e-9) continue;
        const x = (c1 * b2 - c2 * b1) / det;
        const y = (a1 * c2 - a2 * c1) / det;
        if (x < -1e-6 || y < -1e-6) continue;
        const ok = model.constraints.every(
          (c) => c.coefficients[0] * x + c.coefficients[1] * y <= c.rhs + 1e-6,
        );
        if (ok) pts.push({ x, y });
      }
    }
    // unique
    const uniq: Array<{ x: number; y: number }> = [];
    pts.forEach((p) => {
      if (!uniq.some((q) => Math.abs(q.x - p.x) < 1e-4 && Math.abs(q.y - p.y) < 1e-4)) uniq.push(p);
    });
    // sort ccw
    const cx = uniq.reduce((s, p) => s + p.x, 0) / Math.max(uniq.length, 1);
    const cy = uniq.reduce((s, p) => s + p.y, 0) / Math.max(uniq.length, 1);
    uniq.sort((p, q) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(q.y - cy, q.x - cx));
    return uniq;
  }, [model]);

  // Optimum
  const optimum = useMemo<{ p: { x: number; y: number }; z: number } | null>(() => {
    let best: { p: { x: number; y: number }; z: number } | null = null;
    vertices.forEach((p) => {
      const z = model.objective.coefficients[0] * p.x + model.objective.coefficients[1] * p.y;
      if (best === null || z > best.z) best = { p, z };
    });
    return best;
  }, [vertices, model]);

  const polyPoints = vertices.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ");

  // Animation timing buckets
  const t = progress;
  const showAxes = t >= 0;
  const constraintReveal = (i: number) => {
    const startBase = 0.15;
    const step = 0.12;
    const s = startBase + i * step;
    return Math.max(0, Math.min(1, (t - s) / step));
  };
  const showRegion =
    t >= 0.15 + step(model.constraints.length) * model.constraints.length
      ? 1
      : Math.max(0, Math.min(1, (t - (0.15 + 0.12 * model.constraints.length)) / 0.15));
  const showOpt = t >= 0.85 ? 1 : Math.max(0, (t - 0.75) / 0.1);

  function step(n: number) {
    void n;
    return 0.12;
  }

  // grid ticks
  const xTicks = Array.from({ length: 6 }, (_, i) => Math.round((xMax * i) / 5));
  const yTicks = Array.from({ length: 6 }, (_, i) => Math.round((yMax * i) / 5));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseLeave={() => setHover(null)}>
        {/* grid */}
        {xTicks.map((tk) => (
          <line
            key={`gx${tk}`}
            x1={sx(tk)}
            x2={sx(tk)}
            y1={padding.top}
            y2={padding.top + innerH}
            stroke="#e2e8f0"
            strokeDasharray="2 4"
          />
        ))}
        {yTicks.map((tk) => (
          <line
            key={`gy${tk}`}
            y1={sy(tk)}
            y2={sy(tk)}
            x1={padding.left}
            x2={padding.left + innerW}
            stroke="#e2e8f0"
            strokeDasharray="2 4"
          />
        ))}

        {/* axes */}
        <motion.line
          x1={padding.left}
          y1={padding.top + innerH}
          x2={padding.left + innerW}
          y2={padding.top + innerH}
          stroke="#172033"
          strokeWidth={1.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: showAxes ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />
        <motion.line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + innerH}
          stroke="#172033"
          strokeWidth={1.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: showAxes ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        />

        {/* ticks */}
        {xTicks.map((tk) => (
          <text
            key={`tx${tk}`}
            x={sx(tk)}
            y={padding.top + innerH + 16}
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
            fontFamily="JetBrains Mono, monospace"
          >
            {tk}
          </text>
        ))}
        {yTicks.map((tk) => (
          <text
            key={`ty${tk}`}
            x={padding.left - 8}
            y={sy(tk) + 3}
            textAnchor="end"
            fontSize="10"
            fill="#64748b"
            fontFamily="JetBrains Mono, monospace"
          >
            {tk}
          </text>
        ))}

        <text
          x={padding.left + innerW}
          y={H - 8}
          textAnchor="end"
          fontSize="12"
          fill="#172033"
          fontWeight={600}
        >
          {model.variables[0]}
        </text>
        <text x={12} y={padding.top + 4} fontSize="12" fill="#172033" fontWeight={600}>
          {model.variables[1]}
        </text>

        {/* feasible region */}
        {vertices.length > 2 && (
          <motion.polygon
            points={polyPoints}
            fill="var(--feasible)"
            stroke="rgba(20,184,166,0.4)"
            strokeWidth={1}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: showRegion, scale: 1 }}
            style={{ transformOrigin: "center" }}
            transition={{ duration: 0.6 }}
            onMouseEnter={(e) => {
              const rect = (e.target as SVGElement).getBoundingClientRect();
              setHover({
                x: rect.left + rect.width / 2,
                y: rect.top,
                label: "Región factible",
              });
            }}
          />
        )}

        {/* constraint lines */}
        {model.constraints.map((c, i) => {
          const [a, b] = c.coefficients;
          let p1: [number, number];
          let p2: [number, number];
          if (Math.abs(b) < 1e-9) {
            const x = c.rhs / a;
            p1 = [x, 0];
            p2 = [x, yMax];
          } else if (Math.abs(a) < 1e-9) {
            const y = c.rhs / b;
            p1 = [0, y];
            p2 = [xMax, y];
          } else {
            p1 = [0, c.rhs / b];
            p2 = [c.rhs / a, 0];
          }
          const reveal = constraintReveal(i);
          const color = COLORS[i % COLORS.length];
          const labelTxt = `${a !== 0 ? `${a}${model.variables[0]}` : ""}${a !== 0 && b !== 0 ? " + " : ""}${b !== 0 ? `${b}${model.variables[1]}` : ""} ${c.operator} ${c.rhs}`;
          return (
            <g key={i}>
              <motion.line
                x1={sx(p1[0])}
                y1={sy(p1[1])}
                x2={sx(p2[0])}
                y2={sy(p2[1])}
                stroke={color}
                strokeWidth={2.2}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: reveal }}
                transition={{ duration: 0.45 }}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => {
                  const r = (e.currentTarget as SVGLineElement).getBoundingClientRect();
                  setHover({ x: r.left + r.width / 2, y: r.top, label: labelTxt });
                }}
              />
            </g>
          );
        })}

        {/* vertices */}
        {vertices.map((p, i) => (
          <motion.circle
            key={i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={3.5}
            fill="#ffffff"
            stroke="#0f766e"
            strokeWidth={1.5}
            initial={{ scale: 0 }}
            animate={{ scale: showRegion > 0.5 ? 1 : 0 }}
            transition={{ delay: 0.05 * i, type: "spring", stiffness: 300, damping: 18 }}
            onMouseEnter={(e) => {
              const r = (e.currentTarget as SVGCircleElement).getBoundingClientRect();
              setHover({
                x: r.left + r.width / 2,
                y: r.top,
                label: `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`,
              });
            }}
          />
        ))}

        {/* optimum */}
        {optimum && (
          <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: showOpt, scale: showOpt ? 1 : 0.5 }}
            transition={{ type: "spring", stiffness: 220, damping: 14 }}
          >
            <circle
              cx={sx(optimum.p.x)}
              cy={sy(optimum.p.y)}
              r={14}
              fill="#0f766e"
              opacity={0.15}
            />
            <circle
              cx={sx(optimum.p.x)}
              cy={sy(optimum.p.y)}
              r={6.5}
              fill="#0f766e"
              stroke="#ffffff"
              strokeWidth={2}
            />
            <g transform={`translate(${sx(optimum.p.x) + 12}, ${sy(optimum.p.y) - 18})`}>
              <rect rx={8} ry={8} width={170} height={42} fill="#0f766e" opacity={0.96} />
              <text x={10} y={16} fill="#ffffff" fontSize="10" fontWeight={700}>
                MÁXIMO GLOBAL
              </text>
              <text
                x={10}
                y={32}
                fill="#ccfbf1"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
              >
                ({optimum.p.x.toFixed(0)}, {optimum.p.y.toFixed(0)}) · Z={optimum.z.toFixed(0)}
              </text>
            </g>
          </motion.g>
        )}
      </svg>

      {/* legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-feasible ring-1 ring-accent/40" />
          Región factible
        </span>
        {model.constraints.map((_, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span
              className="h-0.5 w-4 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            Restricción {i + 1}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          Máximo global
        </span>
      </div>

      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="pointer-events-none fixed z-50 rounded-lg bg-foreground px-2.5 py-1.5 font-mono text-[11px] text-background shadow-elevation-3"
            style={{ left: hover.x, top: hover.y - 36, transform: "translateX(-50%)" }}
          >
            {hover.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
