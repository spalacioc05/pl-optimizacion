import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  GraphicalLine,
  GraphicalResult,
  GraphicalVertex,
} from "@/lib/linear-programming/types";
import { EPSILON, formatNumber } from "@/lib/linear-programming/utils";

interface GraphicalPlaneProps {
  result: GraphicalResult;
  activeStageIndex: number;
  compact?: boolean;
}

interface ViewWindow {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
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

const buildTicks = (min: number, max: number) => {
  const range = Math.max(max - min, 1);
  return Array.from({ length: 6 }, (_, index) => min + (range * index) / 5).map((tick) =>
    Number(tick.toFixed(range > 8 ? 0 : 2)),
  );
};

const clampView = (view: ViewWindow, result: GraphicalResult): ViewWindow => {
  const width = Math.max(view.xMax - view.xMin, result.xMax * 0.18, 1);
  const height = Math.max(view.yMax - view.yMin, result.yMax * 0.18, 1);
  const xMin = Math.min(Math.max(0, view.xMin), Math.max(0, result.xMax - width));
  const yMin = Math.min(Math.max(0, view.yMin), Math.max(0, result.yMax - height));

  return {
    xMin,
    xMax: xMin + width,
    yMin,
    yMax: yMin + height,
  };
};

export function GraphicalPlane({ result, activeStageIndex, compact = false }: GraphicalPlaneProps) {
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
  const showOptimal = rank >= 7;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    label: string;
    targetId: string;
  } | null>(null);
  const [cursorPoint, setCursorPoint] = useState<{ x: number; y: number } | null>(null);
  const [dragStart, setDragStart] = useState<{
    clientX: number;
    clientY: number;
    view: ViewWindow;
  } | null>(null);
  const [view, setView] = useState<ViewWindow>({
    xMin: 0,
    xMax: result.xMax,
    yMin: 0,
    yMax: result.yMax,
  });

  useEffect(() => {
    setView({ xMin: 0, xMax: result.xMax, yMin: 0, yMax: result.yMax });
    setCursorPoint(null);
    setDragStart(null);
  }, [result]);

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

  const sx = (value: number) =>
    padding.left + ((value - view.xMin) / Math.max(view.xMax - view.xMin, EPSILON)) * innerWidth;
  const sy = (value: number) =>
    padding.top +
    innerHeight -
    ((value - view.yMin) / Math.max(view.yMax - view.yMin, EPSILON)) * innerHeight;

  const screenToWorld = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }

    const relativeX = ((clientX - rect.left) / rect.width) * width;
    const relativeY = ((clientY - rect.top) / rect.height) * height;

    const clampedX = Math.min(Math.max(relativeX, padding.left), padding.left + innerWidth);
    const clampedY = Math.min(Math.max(relativeY, padding.top), padding.top + innerHeight);

    const x = view.xMin + ((clampedX - padding.left) / innerWidth) * (view.xMax - view.xMin);
    const y =
      view.yMin + ((padding.top + innerHeight - clampedY) / innerHeight) * (view.yMax - view.yMin);

    return { x, y };
  };

  const zoomView = (factor: number, center?: { x: number; y: number }) => {
    if (compact) {
      return;
    }

    setView((current) => {
      const currentWidth = current.xMax - current.xMin;
      const currentHeight = current.yMax - current.yMin;
      const nextWidth = Math.min(result.xMax, Math.max(result.xMax * 0.18, currentWidth * factor));
      const nextHeight = Math.min(
        result.yMax,
        Math.max(result.yMax * 0.18, currentHeight * factor),
      );
      const pivot = center ?? {
        x: current.xMin + currentWidth / 2,
        y: current.yMin + currentHeight / 2,
      };

      const ratioX = currentWidth > EPSILON ? (pivot.x - current.xMin) / currentWidth : 0.5;
      const ratioY = currentHeight > EPSILON ? (pivot.y - current.yMin) / currentHeight : 0.5;

      return clampView(
        {
          xMin: pivot.x - nextWidth * ratioX,
          xMax: pivot.x + nextWidth * (1 - ratioX),
          yMin: pivot.y - nextHeight * ratioY,
          yMax: pivot.y + nextHeight * (1 - ratioY),
        },
        result,
      );
    });
  };

  const xTicks = useMemo(() => buildTicks(view.xMin, view.xMax), [view.xMax, view.xMin]);
  const yTicks = useMemo(() => buildTicks(view.yMin, view.yMax), [view.yMax, view.yMin]);
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
  const defaultActiveLevelId =
    visibleLevelLines.length > 0
      ? result.optimizationType === "min"
        ? visibleLevelLines[0]?.id
        : visibleLevelLines[visibleLevelLines.length - 1]?.id
      : undefined;

  const updateHover = (
    event: { clientX: number; clientY: number },
    label: string,
    targetId: string,
  ) => {
    setHover({
      x: event.clientX,
      y: event.clientY,
      label,
      targetId,
    });
  };

  const clearHover = (targetId: string) => {
    setHover((current) => (current?.targetId === targetId ? null : current));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || compact) {
      return undefined;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const center = screenToWorld(event.clientX, event.clientY);
      zoomView(event.deltaY < 0 ? 0.86 : 1.14, center ?? undefined);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [compact, result, view.xMax, view.xMin, view.yMax, view.yMin]);

  return (
    <div
      className={`relative w-full ${compact ? "aspect-[9/7] min-h-[280px]" : "aspect-[92/66] min-h-[340px] sm:min-h-[420px] lg:min-h-[520px]"}`}
    >
      {!compact ? (
        <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/60 bg-surface/90 p-1 shadow-elevation-2 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => zoomView(0.82)}
              className="grid h-9 w-9 place-items-center rounded-full bg-surface-alt text-lg font-semibold text-primary-dark transition-colors hover:bg-secondary"
              aria-label="Acercar"
              title="Acercar"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => zoomView(1.18)}
              className="grid h-9 w-9 place-items-center rounded-full bg-surface-alt text-lg font-semibold text-primary-dark transition-colors hover:bg-secondary"
              aria-label="Alejar"
              title="Alejar"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setView({ xMin: 0, xMax: result.xMax, yMin: 0, yMax: result.yMax })}
              className="rounded-full bg-surface-alt px-3 py-2 text-xs font-semibold text-primary-dark transition-colors hover:bg-secondary"
            >
              Restablecer vista
            </button>
          </div>
        </div>
      ) : null}

      <div
        ref={containerRef}
        className={`h-full w-full ${compact ? "" : "cursor-grab active:cursor-grabbing"}`}
        onPointerDown={(event) => {
          if (compact) {
            return;
          }

          setDragStart({ clientX: event.clientX, clientY: event.clientY, view });
        }}
        onPointerMove={(event) => {
          const world = screenToWorld(event.clientX, event.clientY);
          if (world) {
            setCursorPoint(world);
          }

          setHover((current) =>
            current
              ? {
                  ...current,
                  x: event.clientX,
                  y: event.clientY,
                }
              : current,
          );

          if (!dragStart || compact) {
            return;
          }

          const deltaX =
            ((event.clientX - dragStart.clientX) /
              Math.max(containerRef.current?.clientWidth ?? 1, 1)) *
            (dragStart.view.xMax - dragStart.view.xMin);
          const deltaY =
            ((event.clientY - dragStart.clientY) /
              Math.max(containerRef.current?.clientHeight ?? 1, 1)) *
            (dragStart.view.yMax - dragStart.view.yMin);

          setView(
            clampView(
              {
                xMin: dragStart.view.xMin - deltaX,
                xMax: dragStart.view.xMax - deltaX,
                yMin: dragStart.view.yMin + deltaY,
                yMax: dragStart.view.yMax + deltaY,
              },
              result,
            ),
          );
        }}
        onPointerUp={() => setDragStart(null)}
        onDoubleClick={() => setView({ xMin: 0, xMax: result.xMax, yMin: 0, yMax: result.yMax })}
        onPointerLeave={() => {
          setDragStart(null);
          setHover(null);
        }}
      >
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-full w-full">
          <defs>
            <clipPath id={`graph-clip-${compact ? "compact" : "full"}`}>
              <rect
                x={padding.left}
                y={padding.top}
                width={innerWidth}
                height={innerHeight}
                rx="16"
              />
            </clipPath>
          </defs>

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

          <g clipPath={`url(#graph-clip-${compact ? "compact" : "full"})`}>
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
                fill={
                  hover?.targetId === "feasible-region"
                    ? "rgba(20,184,166,0.28)"
                    : "rgba(20,184,166,0.2)"
                }
                stroke={
                  hover?.targetId === "feasible-region"
                    ? "rgba(15,118,110,0.9)"
                    : "rgba(15,118,110,0.7)"
                }
                strokeWidth={hover?.targetId === "feasible-region" ? 2.1 : 1.5}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45 }}
                onMouseEnter={(event) => {
                  updateHover(
                    event,
                    "Región factible: puntos que cumplen todas las restricciones.",
                    "feasible-region",
                  );
                }}
                onMouseMove={(event) =>
                  updateHover(
                    event,
                    "Región factible: puntos que cumplen todas las restricciones.",
                    "feasible-region",
                  )
                }
                onMouseLeave={() => clearHover("feasible-region")}
              />
            ) : null}

            {result.lines.slice(0, constraintCount).map((line, index) => {
              const isActive = activeLine?.id === line.id;
              const isHovered = hover?.targetId === line.id;
              return (
                <g key={line.id}>
                  <motion.line
                    x1={sx(line.points[0].x)}
                    y1={sy(line.points[0].y)}
                    x2={sx(line.points[1].x)}
                    y2={sy(line.points[1].y)}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={isActive || isHovered ? 3.6 : 2.3}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: isActive || isHovered ? 1 : 0.82 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    style={{
                      cursor: "pointer",
                      filter: isHovered ? "drop-shadow(0 0 8px rgba(8,145,178,0.28))" : undefined,
                    }}
                    onMouseEnter={(event) => updateHover(event, line.tooltip, line.id)}
                    onMouseMove={(event) => updateHover(event, line.tooltip, line.id)}
                    onMouseLeave={() => clearHover(line.id)}
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
                const isHovered = hover?.targetId === vertex.id;
                const isRevealed = revealedVertexIds.has(vertex.id) || rank >= 5;

                return (
                  <g key={vertex.id}>
                    {isActive || isHovered ? (
                      <motion.circle
                        cx={sx(vertex.x)}
                        cy={sy(vertex.y)}
                        r={compact ? 8 : 11}
                        fill={isOptimal ? "rgba(249,115,22,0.2)" : "rgba(15,118,110,0.16)"}
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.3, repeat: Number.POSITIVE_INFINITY }}
                      />
                    ) : null}
                    <motion.circle
                      cx={sx(vertex.x)}
                      cy={sy(vertex.y)}
                      r={isOptimal ? (compact ? 5 : 6) : compact ? 3.8 : 4.2}
                      fill={isActive || isOptimal || isHovered ? "#0f766e" : "#ffffff"}
                      stroke={isActive || isOptimal || isHovered ? "#ffffff" : "#0f766e"}
                      strokeWidth={isActive || isOptimal || isHovered ? 2.2 : 1.6}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: isRevealed ? 1 : 0.45 }}
                      transition={{
                        delay: index * 0.04,
                        type: "spring",
                        stiffness: 260,
                        damping: 18,
                      }}
                      onMouseEnter={(event) =>
                        updateHover(event, getVertexTooltip(vertex), vertex.id)
                      }
                      onMouseMove={(event) =>
                        updateHover(event, getVertexTooltip(vertex), vertex.id)
                      }
                      onMouseLeave={() => clearHover(vertex.id)}
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
                    (!activeLevel && levelLine.id === defaultActiveLevelId);
                  const isHovered = hover?.targetId === levelLine.id;
                  return (
                    <g key={levelLine.id}>
                      <motion.line
                        x1={sx(levelLine.points[0].x)}
                        y1={sy(levelLine.points[0].y)}
                        x2={sx(levelLine.points[1].x)}
                        y2={sy(levelLine.points[1].y)}
                        stroke={isActive || isHovered ? "#115e59" : "rgba(15,118,110,0.38)"}
                        strokeWidth={isActive || isHovered ? 3 : 1.7}
                        strokeDasharray={isActive || isHovered ? "10 6" : "6 8"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: isActive ? 0.65 : 0.25 }}
                        onMouseEnter={(event) =>
                          updateHover(event, levelLine.tooltip, levelLine.id)
                        }
                        onMouseMove={(event) => updateHover(event, levelLine.tooltip, levelLine.id)}
                        onMouseLeave={() => clearHover(levelLine.id)}
                      />
                      {!compact && (isActive || isHovered) ? (
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
                  onMouseEnter={(event) =>
                    updateHover(
                      event,
                      `${result.optimizationType === "min" ? "Óptimo global mínimo" : "Óptimo global máximo"}: (${formatNumber(result.optimalVertex.x)}, ${formatNumber(result.optimalVertex.y)}), Z = ${formatNumber(result.optimalVertex.z)}`,
                      "optimal-point",
                    )
                  }
                  onMouseMove={(event) =>
                    updateHover(
                      event,
                      `${result.optimizationType === "min" ? "Óptimo global mínimo" : "Óptimo global máximo"}: (${formatNumber(result.optimalVertex.x)}, ${formatNumber(result.optimalVertex.y)}), Z = ${formatNumber(result.optimalVertex.z)}`,
                      "optimal-point",
                    )
                  }
                  onMouseLeave={() => clearHover("optimal-point")}
                />
                {!compact ? (
                  <g
                    transform={`translate(${sx(result.optimalVertex.x) + 12}, ${sy(result.optimalVertex.y) - 22})`}
                  >
                    <rect rx={10} ry={10} width={212} height={48} fill="#0f766e" opacity={0.96} />
                    <text x={12} y={18} fill="#ffffff" fontSize="10" fontWeight={700}>
                      {result.optimizationType === "min"
                        ? "MÍNIMO GLOBAL EN LA REGIÓN FACTIBLE"
                        : "MÁXIMO GLOBAL EN LA REGIÓN FACTIBLE"}
                    </text>
                    <text
                      x={12}
                      y={35}
                      fill="#ccfbf1"
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      ({formatNumber(result.optimalVertex.x)},{" "}
                      {formatNumber(result.optimalVertex.y)}) · Z ={" "}
                      {formatNumber(result.optimalVertex.z)}
                    </text>
                  </g>
                ) : null}
              </motion.g>
            ) : null}
          </g>

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
              {formatNumber(tick)}
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
              {formatNumber(tick)}
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
        </svg>
      </div>

      {!compact && cursorPoint ? (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-surface/90 px-3 py-1.5 font-mono text-[11px] font-semibold text-primary-dark shadow-elevation-2 backdrop-blur-sm">
          Cursor: ({formatNumber(cursorPoint.x)}, {formatNumber(cursorPoint.y)})
        </div>
      ) : null}

      <AnimatePresence>
        {hover ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="pointer-events-none fixed z-50 max-w-[320px] rounded-2xl border border-border/70 bg-white/96 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-[0_16px_36px_-18px_rgba(15,23,42,0.4)] backdrop-blur-sm"
            style={{ left: hover.x + 16, top: hover.y + 14 }}
          >
            {hover.label}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
