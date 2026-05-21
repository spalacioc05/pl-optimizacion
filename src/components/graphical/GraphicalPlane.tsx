import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type {
  GraphicalLine,
  GraphicalResult,
  GraphicalVertex,
  LinearProgrammingProblem,
} from "@/lib/linear-programming/types";
import { EPSILON, formatNumber } from "@/lib/linear-programming/utils";

interface GraphicalPlaneProps {
  problem: LinearProgrammingProblem;
  result: GraphicalResult;
  activeStageIndex: number;
  compact?: boolean;
}

const COLORS = ["#0891b2", "#14b8a6", "#0f766e", "#7c3aed", "#f59e0b"];

const stageRank: Record<string, number> = {
  plane: 0,
  constraint: 1,
  region: 2,
  vertices: 3,
  evaluation: 4,
  objective: 5,
  direction: 6,
  optimal: 7,
  conclusion: 8,
};

const uniquePoints = (points: Array<{ x: number; y: number }>) =>
  points.filter(
    (point, index) =>
      points.findIndex(
        (candidate) =>
          Math.abs(candidate.x - point.x) < EPSILON && Math.abs(candidate.y - point.y) < EPSILON,
      ) === index,
  );

const buildConvexHull = (points: Array<{ x: number; y: number }>) => {
  if (points.length <= 1) {
    return points;
  }

  const sorted = [...points].sort((left, right) => left.x - right.x || left.y - right.y);
  const cross = (
    origin: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);

  const lower: Array<{ x: number; y: number }> = [];
  sorted.forEach((point) => {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], point) <= EPSILON
    ) {
      lower.pop();
    }
    lower.push(point);
  });

  const upper: Array<{ x: number; y: number }> = [];
  [...sorted].reverse().forEach((point) => {
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], point) <= EPSILON
    ) {
      upper.pop();
    }
    upper.push(point);
  });

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
};

const buildHalfPlanePolygon = (
  line: GraphicalLine,
  xMax: number,
  yMax: number,
): Array<{ x: number; y: number }> => {
  const [a, b] = line.coefficients;
  const candidatePoints = [
    { x: 0, y: 0 },
    { x: xMax, y: 0 },
    { x: xMax, y: yMax },
    { x: 0, y: yMax },
  ].filter((point) => a * point.x + b * point.y <= line.rhs + EPSILON);

  const intersections = [
    Math.abs(a) > EPSILON ? { x: line.rhs / a, y: 0 } : null,
    Math.abs(a) > EPSILON ? { x: (line.rhs - b * yMax) / a, y: yMax } : null,
    Math.abs(b) > EPSILON ? { x: 0, y: line.rhs / b } : null,
    Math.abs(b) > EPSILON ? { x: xMax, y: (line.rhs - a * xMax) / b } : null,
  ]
    .filter((point): point is { x: number; y: number } => point !== null)
    .filter(
      (point) =>
        point.x >= -EPSILON &&
        point.x <= xMax + EPSILON &&
        point.y >= -EPSILON &&
        point.y <= yMax + EPSILON,
    );

  return buildConvexHull(uniquePoints([...candidatePoints, ...intersections]));
};

const getVertexTooltip = (vertex: GraphicalVertex) =>
  `(${formatNumber(vertex.x)}, ${formatNumber(vertex.y)}), Z = ${formatNumber(vertex.z)}`;

export function GraphicalPlane({
  problem,
  result,
  activeStageIndex,
  compact = false,
}: GraphicalPlaneProps) {
  const width = compact ? 360 : 920;
  const height = compact ? 280 : 660;
  const padding = compact
    ? { top: 20, right: 18, bottom: 38, left: 46 }
    : { top: 30, right: 40, bottom: 62, left: 72 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const currentStage = result.stages[activeStageIndex] ?? result.stages[result.stages.length - 1];
  const rank = stageRank[currentStage?.kind ?? "plane"] ?? 0;
  const constraintCount =
    currentStage?.kind === "constraint"
      ? (currentStage.constraintIndex ?? 0) + 1
      : rank >= 2
        ? result.lines.length
        : 0;
  const showAxes = true;
  const showRegion = rank >= 2;
  const showVertices = rank >= 3;
  const showVertexValues = rank >= 4;
  const showObjective = rank >= 5;
  const showDirection = rank >= 6;
  const showOptimal = rank >= 7;
  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null);

  const activeLine = currentStage?.focusLineId
    ? result.lines.find((line) => line.id === currentStage.focusLineId)
    : currentStage?.constraintIndex !== undefined
      ? result.lines[currentStage.constraintIndex]
      : undefined;
  const activeVertex = currentStage?.focusVertexId
    ? result.vertices.find((vertex) => vertex.id === currentStage.focusVertexId)
    : undefined;
  const activeLevel = currentStage?.focusLevelId
    ? result.levelLines.find((levelLine) => levelLine.id === currentStage.focusLevelId)
    : undefined;
  const revealedVertexIds = new Set(
    currentStage?.revealedVertexIds ??
      (showVertices ? result.vertices.map((vertex) => vertex.id) : []),
  );
  const revealedLevelIds = new Set(
    currentStage?.revealedLevelIds ??
      (showObjective ? result.levelLines.map((levelLine) => levelLine.id) : []),
  );

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
  const activeHalfPlane =
    currentStage?.kind === "constraint" && activeLine
      ? buildHalfPlanePolygon(activeLine, result.xMax, result.yMax)
      : [];
  const halfPlanePoints = activeHalfPlane.map((point) => `${sx(point.x)},${sy(point.y)}`).join(" ");
  const visibleLevelLines = result.levelLines.filter((levelLine) =>
    revealedLevelIds.has(levelLine.id),
  );

  const directionArrow = useMemo(() => {
    if (!result.optimalVertex) {
      return null;
    }

    const dx = problem.objectiveCoefficients[0];
    const dy = problem.objectiveCoefficients[1];
    const magnitude = Math.sqrt(dx * dx + dy * dy) || 1;
    const normalizedX = dx / magnitude;
    const normalizedY = dy / magnitude;
    const startX = Math.max(result.optimalVertex.x - result.xMax * 0.18, result.xMax * 0.2);
    const startY = Math.max(result.optimalVertex.y - result.yMax * 0.16, result.yMax * 0.16);
    const endX = startX + normalizedX * Math.min(result.xMax * 0.2, 2.8);
    const endY = startY + normalizedY * Math.min(result.yMax * 0.2, 2.8);

    return {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
    };
  }, [problem.objectiveCoefficients, result.optimalVertex, result.xMax, result.yMax]);

  return (
    <div className={`relative w-full ${compact ? "h-70" : "h-105 sm:h-130 lg:h-145 xl:h-165"}`}>
      <div className="h-full w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-full w-full"
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
              stroke="#d7e3f1"
              strokeDasharray="2 5"
            />
          ))}
          {yTicks.map((tick) => (
            <line
              key={`grid-y-${tick}`}
              y1={sy(tick)}
              y2={sy(tick)}
              x1={padding.left}
              x2={padding.left + innerWidth}
              stroke="#d7e3f1"
              strokeDasharray="2 5"
            />
          ))}

          {activeHalfPlane.length > 2 && currentStage?.kind === "constraint" ? (
            <motion.polygon
              points={halfPlanePoints}
              fill="rgba(8,145,178,0.08)"
              stroke="rgba(8,145,178,0.12)"
              strokeWidth={1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            />
          ) : null}

          {showRegion && result.feasiblePolygon.length > 2 ? (
            <motion.polygon
              points={polygonPoints}
              fill="rgba(20,184,166,0.2)"
              stroke="rgba(15,118,110,0.7)"
              strokeWidth={1.5}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
              onMouseEnter={(event) => {
                const rect = (event.target as SVGElement).getBoundingClientRect();
                setHover({
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                  label: "Región factible: puntos que cumplen todas las restricciones.",
                });
              }}
            />
          ) : null}

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

          {xTicks.map((tick) => (
            <text
              key={`tick-x-${tick}`}
              x={sx(tick)}
              y={padding.top + innerHeight + (compact ? 14 : 18)}
              textAnchor="middle"
              fontSize={compact ? "9" : "12"}
              fill="#64748b"
              fontFamily="JetBrains Mono, monospace"
            >
              {tick}
            </text>
          ))}
          {yTicks.map((tick) => (
            <text
              key={`tick-y-${tick}`}
              x={padding.left - 8}
              y={sy(tick) + 3}
              textAnchor="end"
              fontSize={compact ? "9" : "12"}
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
            fontSize={compact ? "11" : "14"}
            fill="#172033"
            fontWeight={700}
          >
            X1
          </text>
          <text
            x={compact ? 14 : 16}
            y={padding.top + 4}
            fontSize={compact ? "11" : "14"}
            fill="#172033"
            fontWeight={700}
          >
            X2
          </text>

          {result.lines.slice(0, constraintCount).map((line, index) => {
            const isActive = activeLine?.id === line.id;
            return (
              <g key={line.id}>
                <motion.line
                  x1={sx(line.points[0].x)}
                  y1={sy(line.points[0].y)}
                  x2={sx(line.points[1].x)}
                  y2={sy(line.points[1].y)}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={isActive ? 3 : 2.3}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1, opacity: isActive ? 1 : 0.82 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(event) => {
                    const rect = (event.currentTarget as SVGLineElement).getBoundingClientRect();
                    setHover({ x: rect.left + rect.width / 2, y: rect.top, label: line.tooltip });
                  }}
                />
                {!compact ? (
                  <text
                    x={(sx(line.points[0].x) + sx(line.points[1].x)) / 2}
                    y={(sy(line.points[0].y) + sy(line.points[1].y)) / 2 - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fill={COLORS[index % COLORS.length]}
                    fontWeight={700}
                  >
                    R{index + 1}
                  </text>
                ) : null}

                {isActive && currentStage?.kind === "constraint"
                  ? line.intercepts.map((intercept) => (
                      <g key={intercept.id}>
                        <circle
                          cx={sx(intercept.x)}
                          cy={sy(intercept.y)}
                          r={compact ? 3 : 4}
                          fill="#ffffff"
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                        />
                        {!compact ? (
                          <text
                            x={sx(intercept.x) + 8}
                            y={sy(intercept.y) - 8}
                            fontSize="12"
                            fill={COLORS[index % COLORS.length]}
                            fontFamily="JetBrains Mono, monospace"
                            fontWeight={700}
                          >
                            {intercept.label}
                          </text>
                        ) : null}
                      </g>
                    ))
                  : null}
              </g>
            );
          })}

          {showVertices &&
            result.vertices.map((vertex, index) => {
              const isActive = activeVertex?.id === vertex.id;
              const isOptimal = result.optimalVertex?.id === vertex.id;
              const isRevealed = revealedVertexIds.has(vertex.id) || rank >= 5;

              return (
                <g key={vertex.id}>
                  {isActive ? (
                    <motion.circle
                      cx={sx(vertex.x)}
                      cy={sy(vertex.y)}
                      r={compact ? 8 : 11}
                      fill="rgba(15,118,110,0.16)"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.3, repeat: Number.POSITIVE_INFINITY }}
                    />
                  ) : null}
                  <motion.circle
                    cx={sx(vertex.x)}
                    cy={sy(vertex.y)}
                    r={isOptimal ? (compact ? 5 : 6) : compact ? 3.8 : 4.2}
                    fill={isActive || isOptimal ? "#0f766e" : "#ffffff"}
                    stroke={isActive || isOptimal ? "#ffffff" : "#0f766e"}
                    strokeWidth={isActive || isOptimal ? 2.2 : 1.6}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, opacity: isRevealed ? 1 : 0.45 }}
                    transition={{
                      delay: index * 0.04,
                      type: "spring",
                      stiffness: 260,
                      damping: 18,
                    }}
                    onMouseEnter={(event) => {
                      const rect = (
                        event.currentTarget as SVGCircleElement
                      ).getBoundingClientRect();
                      setHover({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                        label: getVertexTooltip(vertex),
                      });
                    }}
                  />

                  {!compact ? (
                    <text
                      x={sx(vertex.x) + 8}
                      y={sy(vertex.y) - (showVertexValues ? 12 : 8)}
                      fontSize="12"
                      fill={isActive || isOptimal ? "#0f766e" : "#475569"}
                      fontWeight={700}
                    >
                      {vertex.label}({formatNumber(vertex.x)}, {formatNumber(vertex.y)})
                    </text>
                  ) : null}

                  {showVertexValues && isRevealed ? (
                    <text
                      x={sx(vertex.x) + 8}
                      y={sy(vertex.y) + 8}
                      fontSize={compact ? "8.5" : "12"}
                      fill={isActive || isOptimal ? "#115e59" : "#64748b"}
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight={700}
                    >
                      Z={formatNumber(vertex.z)}
                    </text>
                  ) : null}
                </g>
              );
            })}

          {showObjective
            ? visibleLevelLines.map((levelLine, index) => {
                const isActive =
                  activeLevel?.id === levelLine.id ||
                  (showDirection && index === visibleLevelLines.length - 1);
                return (
                  <g key={levelLine.id}>
                    <motion.line
                      x1={sx(levelLine.points[0].x)}
                      y1={sy(levelLine.points[0].y)}
                      x2={sx(levelLine.points[1].x)}
                      y2={sy(levelLine.points[1].y)}
                      stroke={isActive ? "#115e59" : "rgba(15,118,110,0.38)"}
                      strokeWidth={isActive ? 2.8 : 1.7}
                      strokeDasharray={isActive ? "10 6" : "6 8"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: isActive ? 0.65 : 0.25 }}
                      onMouseEnter={(event) => {
                        const rect = (
                          event.currentTarget as SVGLineElement
                        ).getBoundingClientRect();
                        setHover({
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                          label: levelLine.tooltip,
                        });
                      }}
                    />
                    {!compact && isActive ? (
                      <text
                        x={(sx(levelLine.points[0].x) + sx(levelLine.points[1].x)) / 2}
                        y={(sy(levelLine.points[0].y) + sy(levelLine.points[1].y)) / 2 - 10}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#115e59"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight={700}
                      >
                        {levelLine.label}
                      </text>
                    ) : null}
                  </g>
                );
              })
            : null}

          {showDirection && directionArrow ? (
            <g>
              <motion.line
                x1={sx(directionArrow.start.x)}
                y1={sy(directionArrow.start.y)}
                x2={sx(directionArrow.end.x)}
                y2={sy(directionArrow.end.y)}
                stroke="#0f766e"
                strokeWidth={2.4}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.55 }}
              />
              <polygon
                points={`${sx(directionArrow.end.x)},${sy(directionArrow.end.y)} ${sx(directionArrow.end.x - 0.32)},${sy(directionArrow.end.y - 0.15)} ${sx(directionArrow.end.x - 0.1)},${sy(directionArrow.end.y - 0.35)}`}
                fill="#0f766e"
              />
              {!compact ? (
                <text
                  x={sx(directionArrow.end.x) + 8}
                  y={sy(directionArrow.end.y) - 8}
                  fontSize="12"
                  fill="#0f766e"
                  fontWeight={700}
                >
                  Dirección de maximización
                </text>
              ) : null}
            </g>
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
                opacity={0.16}
              />
              <circle
                cx={sx(result.optimalVertex.x)}
                cy={sy(result.optimalVertex.y)}
                r={compact ? 5.5 : 7}
                fill="#0f766e"
                stroke="#ffffff"
                strokeWidth={2.3}
                onMouseEnter={(event) => {
                  const rect = (event.currentTarget as SVGCircleElement).getBoundingClientRect();
                  setHover({
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                    label: `Óptimo global: (${formatNumber(result.optimalVertex.x)}, ${formatNumber(result.optimalVertex.y)}), Z = ${formatNumber(result.optimalVertex.z)}`,
                  });
                }}
              />
              {!compact ? (
                <g
                  transform={`translate(${sx(result.optimalVertex.x) + 12}, ${sy(result.optimalVertex.y) - 22})`}
                >
                  <rect rx={10} ry={10} width={212} height={48} fill="#0f766e" opacity={0.96} />
                  <text x={12} y={18} fill="#ffffff" fontSize="10" fontWeight={700}>
                    MÁXIMO GLOBAL EN LA REGIÓN FACTIBLE
                  </text>
                  <text
                    x={12}
                    y={35}
                    fill="#ccfbf1"
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    ({formatNumber(result.optimalVertex.x)}, {formatNumber(result.optimalVertex.y)})
                    · Z = {formatNumber(result.optimalVertex.z)}
                  </text>
                </g>
              ) : null}
            </motion.g>
          ) : null}
        </svg>
      </div>

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
