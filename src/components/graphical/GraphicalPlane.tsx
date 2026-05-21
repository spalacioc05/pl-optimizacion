import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { GraphicalResult, LinearProgrammingProblem } from "@/lib/linear-programming/types";
import { formatNumber } from "@/lib/linear-programming/utils";

interface GraphicalPlaneProps {
  problem: LinearProgrammingProblem;
  result: GraphicalResult;
  activeStageIndex: number;
  compact?: boolean;
}

const COLORS = ["#0891b2", "#14b8a6", "#0f766e", "#7c3aed", "#f59e0b"];

const stageRank: Record<string, number> = {
  plane: 0,
  axes: 1,
  constraint: 2,
  region: 3,
  vertices: 4,
  evaluation: 5,
  objective: 6,
  optimal: 7,
  conclusion: 8,
};

const getObjectiveLinePoints = (
  problem: LinearProgrammingProblem,
  zValue: number,
  xMax: number,
  yMax: number,
) => {
  const [c1, c2] = problem.objectiveCoefficients;
  const points: Array<{ x: number; y: number }> = [];

  if (Math.abs(c1) > 1e-9) {
    points.push({ x: zValue / c1, y: 0 });
    points.push({ x: (zValue - c2 * yMax) / c1, y: yMax });
  }

  if (Math.abs(c2) > 1e-9) {
    points.push({ x: 0, y: zValue / c2 });
    points.push({ x: xMax, y: (zValue - c1 * xMax) / c2 });
  }

  const filtered = points.filter(
    (point) =>
      point.x >= -1e-6 && point.x <= xMax + 1e-6 && point.y >= -1e-6 && point.y <= yMax + 1e-6,
  );

  const unique = filtered.filter(
    (point, index) =>
      filtered.findIndex(
        (candidate) =>
          Math.abs(candidate.x - point.x) < 1e-6 && Math.abs(candidate.y - point.y) < 1e-6,
      ) === index,
  );

  return unique.slice(0, 2);
};

export function GraphicalPlane({
  problem,
  result,
  activeStageIndex,
  compact = false,
}: GraphicalPlaneProps) {
  const width = compact ? 360 : 620;
  const height = compact ? 280 : 460;
  const padding = compact
    ? { top: 20, right: 18, bottom: 38, left: 46 }
    : { top: 24, right: 28, bottom: 48, left: 58 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const currentStage = result.stages[activeStageIndex] ?? result.stages[result.stages.length - 1];
  const rank = stageRank[currentStage?.kind ?? "plane"] ?? 0;
  const constraintCount =
    currentStage?.kind === "constraint"
      ? (currentStage.constraintIndex ?? 0) + 1
      : rank >= 3
        ? result.lines.length
        : 0;
  const showAxes = rank >= 1;
  const showRegion = rank >= 3;
  const showVertices = rank >= 4;
  const showEvaluation = rank >= 5;
  const showObjective = rank >= 6;
  const showOptimal = rank >= 7;
  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null);

  const sx = (value: number) => padding.left + (value / result.xMax) * innerWidth;
  const sy = (value: number) => padding.top + innerHeight - (value / result.yMax) * innerHeight;

  const xTicks = useMemo(
    () => Array.from({ length: 6 }, (_, index) => Math.round((result.xMax * index) / 5)),
    [result.xMax],
  );
  const yTicks = useMemo(
    () => Array.from({ length: 6 }, (_, index) => Math.round((result.yMax * index) / 5)),
    [result.yMax],
  );
  const polygonPoints = result.feasiblePolygon
    .map((point) => `${sx(point.x)},${sy(point.y)}`)
    .join(" ");
  const objectivePoints = result.optimalVertex
    ? getObjectiveLinePoints(problem, result.optimalVertex.z, result.xMax, result.yMax)
    : [];
  const previewObjectivePoints = result.optimalVertex
    ? getObjectiveLinePoints(problem, result.optimalVertex.z * 0.42, result.xMax, result.yMax)
    : [];

  const directionArrow = useMemo(() => {
    if (!result.optimalVertex) {
      return null;
    }

    const dx = problem.objectiveCoefficients[0];
    const dy = problem.objectiveCoefficients[1];
    const magnitude = Math.sqrt(dx * dx + dy * dy) || 1;
    const normalizedX = dx / magnitude;
    const normalizedY = dy / magnitude;
    const startX = Math.min(result.xMax * 0.6, result.optimalVertex.x + 0.8);
    const startY = Math.min(result.yMax * 0.15 + 0.8, result.optimalVertex.y + 1.2);
    const endX = startX + normalizedX * Math.min(result.xMax * 0.18, 2.4);
    const endY = startY + normalizedY * Math.min(result.yMax * 0.18, 2.4);

    return {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
    };
  }, [problem.objectiveCoefficients, result.optimalVertex, result.xMax, result.yMax]);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        onMouseLeave={() => setHover(null)}
      >
        <rect x="0" y="0" width={width} height={height} fill="transparent" rx="24" />

        {xTicks.map((tick) => (
          <line
            key={`grid-x-${tick}`}
            x1={sx(tick)}
            x2={sx(tick)}
            y1={padding.top}
            y2={padding.top + innerHeight}
            stroke="#e2e8f0"
            strokeDasharray="2 4"
          />
        ))}
        {yTicks.map((tick) => (
          <line
            key={`grid-y-${tick}`}
            y1={sy(tick)}
            y2={sy(tick)}
            x1={padding.left}
            x2={padding.left + innerWidth}
            stroke="#e2e8f0"
            strokeDasharray="2 4"
          />
        ))}

        <motion.line
          x1={padding.left}
          y1={padding.top + innerHeight}
          x2={padding.left + innerWidth}
          y2={padding.top + innerHeight}
          stroke="#172033"
          strokeWidth={1.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: showAxes ? 1 : 0 }}
          transition={{ duration: 0.45 }}
        />
        <motion.line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + innerHeight}
          stroke="#172033"
          strokeWidth={1.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: showAxes ? 1 : 0 }}
          transition={{ duration: 0.45, delay: 0.06 }}
        />

        {showAxes &&
          xTicks.map((tick) => (
            <text
              key={`tick-x-${tick}`}
              x={sx(tick)}
              y={padding.top + innerHeight + (compact ? 14 : 18)}
              textAnchor="middle"
              fontSize={compact ? "9" : "10"}
              fill="#64748b"
              fontFamily="JetBrains Mono, monospace"
            >
              {tick}
            </text>
          ))}
        {showAxes &&
          yTicks.map((tick) => (
            <text
              key={`tick-y-${tick}`}
              x={padding.left - 8}
              y={sy(tick) + 3}
              textAnchor="end"
              fontSize={compact ? "9" : "10"}
              fill="#64748b"
              fontFamily="JetBrains Mono, monospace"
            >
              {tick}
            </text>
          ))}

        <text
          x={padding.left + innerWidth}
          y={height - 8}
          textAnchor="end"
          fontSize={compact ? "11" : "12"}
          fill="#172033"
          fontWeight={700}
        >
          X1
        </text>
        <text
          x={compact ? 14 : 16}
          y={padding.top + 4}
          fontSize={compact ? "11" : "12"}
          fill="#172033"
          fontWeight={700}
        >
          X2
        </text>

        {showRegion && result.feasiblePolygon.length > 2 ? (
          <motion.polygon
            points={polygonPoints}
            fill="var(--feasible)"
            stroke="rgba(20,184,166,0.4)"
            strokeWidth={1.2}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            onMouseEnter={(event) => {
              const rect = (event.target as SVGElement).getBoundingClientRect();
              setHover({ x: rect.left + rect.width / 2, y: rect.top, label: "Región factible" });
            }}
          />
        ) : null}

        {result.lines.slice(0, constraintCount).map((line, index) => (
          <g key={line.id}>
            <motion.line
              x1={sx(line.points[0].x)}
              y1={sy(line.points[0].y)}
              x2={sx(line.points[1].x)}
              y2={sy(line.points[1].y)}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2.2}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4 }}
              style={{ cursor: "pointer" }}
              onMouseEnter={(event) => {
                const rect = (event.currentTarget as SVGLineElement).getBoundingClientRect();
                setHover({ x: rect.left + rect.width / 2, y: rect.top, label: line.label });
              }}
            />
            {!compact ? (
              <text
                x={(sx(line.points[0].x) + sx(line.points[1].x)) / 2}
                y={(sy(line.points[0].y) + sy(line.points[1].y)) / 2 - 8}
                textAnchor="middle"
                fontSize="10"
                fill={COLORS[index % COLORS.length]}
                fontWeight={700}
              >
                R{index + 1}
              </text>
            ) : null}
          </g>
        ))}

        {showVertices &&
          result.vertices.map((vertex, index) => (
            <g key={vertex.id}>
              <motion.circle
                cx={sx(vertex.x)}
                cy={sy(vertex.y)}
                r={compact ? 3.5 : 4}
                fill="#ffffff"
                stroke="#0f766e"
                strokeWidth={1.6}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.04, type: "spring", stiffness: 260, damping: 18 }}
                onMouseEnter={(event) => {
                  const rect = (event.currentTarget as SVGCircleElement).getBoundingClientRect();
                  setHover({
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                    label: `(${formatNumber(vertex.x)}, ${formatNumber(vertex.y)}) · Z=${formatNumber(vertex.z)}`,
                  });
                }}
              />
              {showEvaluation ? (
                <text
                  x={sx(vertex.x) + 8}
                  y={sy(vertex.y) - 8}
                  fontSize={compact ? "9" : "10"}
                  fill="#115e59"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight={700}
                >
                  Z={formatNumber(vertex.z)}
                </text>
              ) : null}
            </g>
          ))}

        {showObjective && objectivePoints.length === 2 ? (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <motion.line
              x1={sx(previewObjectivePoints[0]?.x ?? objectivePoints[0].x)}
              y1={sy(previewObjectivePoints[0]?.y ?? objectivePoints[0].y)}
              x2={sx(previewObjectivePoints[1]?.x ?? objectivePoints[1].x)}
              y2={sy(previewObjectivePoints[1]?.y ?? objectivePoints[1].y)}
              animate={{
                x1: sx(objectivePoints[0].x),
                y1: sy(objectivePoints[0].y),
                x2: sx(objectivePoints[1].x),
                y2: sy(objectivePoints[1].y),
              }}
              stroke="#115e59"
              strokeWidth={2.4}
              strokeDasharray="10 8"
              transition={{ duration: 0.8 }}
            />
            <text
              x={(sx(objectivePoints[0].x) + sx(objectivePoints[1].x)) / 2}
              y={(sy(objectivePoints[0].y) + sy(objectivePoints[1].y)) / 2 - 10}
              textAnchor="middle"
              fontSize={compact ? "9" : "10"}
              fill="#115e59"
              fontFamily="JetBrains Mono, monospace"
              fontWeight={700}
            >
              Z = {result.optimalVertex ? formatNumber(result.optimalVertex.z) : "0"}
            </text>
            {directionArrow ? (
              <>
                <motion.line
                  x1={sx(directionArrow.start.x)}
                  y1={sy(directionArrow.start.y)}
                  x2={sx(directionArrow.end.x)}
                  y2={sy(directionArrow.end.y)}
                  stroke="#0f766e"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                />
                <polygon
                  points={`${sx(directionArrow.end.x)},${sy(directionArrow.end.y)} ${sx(directionArrow.end.x - 0.28)},${sy(directionArrow.end.y - 0.12)} ${sx(directionArrow.end.x - 0.08)},${sy(directionArrow.end.y - 0.32)}`}
                  fill="#0f766e"
                />
                {!compact ? (
                  <text
                    x={sx(directionArrow.end.x) + 8}
                    y={sy(directionArrow.end.y) - 6}
                    fontSize="10"
                    fill="#0f766e"
                    fontWeight={700}
                  >
                    Dirección de maximización
                  </text>
                ) : null}
              </>
            ) : null}
          </motion.g>
        ) : null}

        {showOptimal && result.optimalVertex ? (
          <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
          >
            <circle
              cx={sx(result.optimalVertex.x)}
              cy={sy(result.optimalVertex.y)}
              r={compact ? 10 : 14}
              fill="#0f766e"
              opacity={0.15}
            />
            <circle
              cx={sx(result.optimalVertex.x)}
              cy={sy(result.optimalVertex.y)}
              r={compact ? 5 : 6.5}
              fill="#0f766e"
              stroke="#ffffff"
              strokeWidth={2}
              onMouseEnter={(event) => {
                const rect = (event.currentTarget as SVGCircleElement).getBoundingClientRect();
                setHover({
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                  label: `Máximo global: (${formatNumber(result.optimalVertex?.x ?? 0)}, ${formatNumber(result.optimalVertex?.y ?? 0)}) · Z=${formatNumber(result.optimalVertex?.z ?? 0)}`,
                });
              }}
            />
            {!compact ? (
              <g
                transform={`translate(${sx(result.optimalVertex.x) + 12}, ${sy(result.optimalVertex.y) - 18})`}
              >
                <rect rx={8} ry={8} width={188} height={42} fill="#0f766e" opacity={0.96} />
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
                  ({formatNumber(result.optimalVertex.x)}, {formatNumber(result.optimalVertex.y)}) ·
                  Z={formatNumber(result.optimalVertex.z)}
                </text>
              </g>
            ) : null}
          </motion.g>
        ) : null}
      </svg>

      <AnimatePresence>
        {hover ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="pointer-events-none fixed z-50 rounded-lg bg-foreground px-2.5 py-1.5 font-mono text-[11px] text-background shadow-elevation-3"
            style={{ left: hover.x, top: hover.y - 36, transform: "translateX(-50%)" }}
          >
            {hover.label}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
