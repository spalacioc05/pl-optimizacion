import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei/core/Line";
import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { Text } from "@react-three/drei/core/Text";
import { Html } from "@react-three/drei/web/Html";
import { useEffect, useMemo, useRef, useState } from "react";
import { DoubleSide, Mesh, Quaternion, Vector3 } from "three";
import type {
  SpacePoint3D,
  ThreeDimensionalStage,
  ThreeDimensionalVisualization,
} from "@/lib/linear-programming/types";
import { formatNumber, getOptimizationOutcomeLabel } from "@/lib/linear-programming/utils";

interface Props {
  visualization: ThreeDimensionalVisualization;
}

function GraphControlButton({
  children,
  label,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid place-items-center rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "h-11 w-11 gradient-primary text-primary-foreground shadow-elevation-2 hover:shadow-elevation-3"
          : "h-9 w-9 bg-surface text-foreground shadow-elevation-1 hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function StagePill({
  index,
  stage,
  active,
  onClick,
}: {
  index: number;
  stage: ThreeDimensionalStage;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-28 shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-left transition-colors sm:min-w-36 ${
        active
          ? "border-primary/35 bg-primary/10 text-primary-dark"
          : "border-border/70 bg-surface text-muted-foreground hover:border-accent/40 hover:text-foreground"
      }`}
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-alt text-[11px] font-bold shadow-elevation-1">
        {index + 1}
      </span>
      <span className="truncate text-[11px] font-semibold uppercase tracking-wider">
        {stage.kind}
      </span>
    </button>
  );
}

function resettableQuaternion(normal: [number, number, number]) {
  return new Quaternion().setFromUnitVectors(
    new Vector3(0, 0, 1),
    new Vector3(normal[0], normal[1], normal[2]).normalize(),
  );
}

function roundTick(value: number) {
  return Number(value.toFixed(value > 8 ? 0 : 2));
}

function buildTicks(max: number) {
  const limit = Math.max(max, 1);
  return Array.from({ length: 5 }, (_, index) => roundTick(limit * (index / 4)));
}

function buildBoundingBoxSegments(bounds: { x: number; y: number; z: number }) {
  const { x, y, z } = bounds;
  return [
    [
      [0, 0, 0],
      [x, 0, 0],
    ],
    [
      [0, 0, 0],
      [0, y, 0],
    ],
    [
      [0, 0, 0],
      [0, 0, z],
    ],
    [
      [x, 0, 0],
      [x, y, 0],
    ],
    [
      [x, 0, 0],
      [x, 0, z],
    ],
    [
      [0, y, 0],
      [x, y, 0],
    ],
    [
      [0, y, 0],
      [0, y, z],
    ],
    [
      [0, 0, z],
      [x, 0, z],
    ],
    [
      [0, 0, z],
      [0, y, z],
    ],
    [
      [x, y, 0],
      [x, y, z],
    ],
    [
      [x, 0, z],
      [x, y, z],
    ],
    [
      [0, y, z],
      [x, y, z],
    ],
  ] as Array<[[number, number, number], [number, number, number]]>;
}

function formatPoint(point: SpacePoint3D) {
  return `(${formatNumber(point.x)}, ${formatNumber(point.y)}, ${formatNumber(point.z)})`;
}

function interpolateColor(
  start: [number, number, number],
  end: [number, number, number],
  ratio: number,
) {
  const mix = start.map((value, index) => Math.round(value + (end[index] - value) * ratio));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

function objectiveColor(value: number, min: number, max: number) {
  if (Math.abs(max - min) < 1e-9) {
    return "#14b8a6";
  }

  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));
  if (ratio < 0.42) {
    return interpolateColor([59, 130, 246], [6, 182, 212], ratio / 0.42);
  }

  if (ratio < 0.74) {
    return interpolateColor([6, 182, 212], [251, 146, 60], (ratio - 0.42) / 0.32);
  }

  return interpolateColor([251, 146, 60], [239, 68, 68], (ratio - 0.74) / 0.26);
}

function PulsingOptimalPoint({ point }: { point: SpacePoint3D }) {
  const meshRef = useRef<Mesh | null>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) {
      return;
    }

    const scale = 1 + Math.sin(clock.elapsedTime * 2.2) * 0.08;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef} position={[point.x, point.y, point.z]}>
      <sphereGeometry args={[0.24, 26, 26]} />
      <meshStandardMaterial color="#f97316" emissive="#fb923c" emissiveIntensity={0.28} />
    </mesh>
  );
}

function FeasibleScene({
  visualization,
  stage,
  onHover,
}: {
  visualization: ThreeDimensionalVisualization;
  stage: ThreeDimensionalStage;
  onHover: (text: string | null) => void;
}) {
  const planeSize =
    Math.max(visualization.bounds.x, visualization.bounds.y, visualization.bounds.z) * 1.35;
  const values = visualization.feasiblePoints.map((point) => point.objectiveValue);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const revealedPlaneIds = new Set(
    stage.revealedPlaneIds ?? visualization.planes.map((plane) => plane.id),
  );
  const revealedPointIds = new Set(
    stage.revealedPointIds ?? visualization.feasiblePoints.map((point) => point.id),
  );
  const focusPlaneId = stage.focusPlaneId;
  const focusPointId = stage.focusPointId;
  const showLabels = ["vertices", "evaluation", "direction", "optimal", "conclusion"].includes(
    stage.kind,
  );
  const boundingSegments = buildBoundingBoxSegments(visualization.bounds);
  const xTicks = buildTicks(visualization.bounds.x);
  const yTicks = buildTicks(visualization.bounds.y);
  const zTicks = buildTicks(visualization.bounds.z);

  return (
    <>
      <color attach="background" args={["#f8fafc"]} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[8, 10, 12]} intensity={1.05} color="#ffffff" />
      <directionalLight position={[-6, 5, -8]} intensity={0.55} color="#dbeafe" />

      <gridHelper
        args={[
          Math.max(visualization.bounds.x, visualization.bounds.y) * 1.2,
          12,
          "#cbd5e1",
          "#e2e8f0",
        ]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[visualization.bounds.x / 2, visualization.bounds.y / 2, 0]}
      />

      {boundingSegments.map((segment, index) => (
        <Line key={`box-${index}`} points={segment} color="#cbd5e1" lineWidth={1.2} />
      ))}

      <Line
        points={[
          [0, 0, 0],
          [visualization.bounds.x, 0, 0],
        ]}
        color="#0f172a"
        lineWidth={2.5}
      />
      <Line
        points={[
          [0, 0, 0],
          [0, visualization.bounds.y, 0],
        ]}
        color="#0f172a"
        lineWidth={2.5}
      />
      <Line
        points={[
          [0, 0, 0],
          [0, 0, visualization.bounds.z],
        ]}
        color="#0f172a"
        lineWidth={2.5}
      />

      <Text position={[visualization.bounds.x + 0.35, 0, 0]} fontSize={0.25} color="#0f172a">
        X1
      </Text>
      <Text position={[0, visualization.bounds.y + 0.35, 0]} fontSize={0.25} color="#0f172a">
        X2
      </Text>
      <Text position={[0, 0, visualization.bounds.z + 0.35]} fontSize={0.25} color="#0f172a">
        X3
      </Text>

      {xTicks.slice(1).map((tick) => (
        <Text key={`tick-x-${tick}`} position={[tick, -0.18, 0]} fontSize={0.16} color="#64748b">
          {formatNumber(tick)}
        </Text>
      ))}
      {yTicks.slice(1).map((tick) => (
        <Text key={`tick-y-${tick}`} position={[-0.22, tick, 0]} fontSize={0.16} color="#64748b">
          {formatNumber(tick)}
        </Text>
      ))}
      {zTicks.slice(1).map((tick) => (
        <Text key={`tick-z-${tick}`} position={[0, -0.18, tick]} fontSize={0.16} color="#64748b">
          {formatNumber(tick)}
        </Text>
      ))}

      {visualization.planes.map((plane) => (
        <group key={plane.id} visible={revealedPlaneIds.has(plane.id)}>
          <mesh
            position={plane.anchor}
            quaternion={resettableQuaternion(plane.normal)}
            onPointerOver={() => onHover(`${plane.label}: ${plane.description}`)}
            onPointerOut={() => onHover(null)}
          >
            <planeGeometry args={[planeSize, planeSize]} />
            <meshStandardMaterial
              color={plane.color}
              transparent
              opacity={focusPlaneId === plane.id ? 0.32 : 0.18}
              side={DoubleSide}
              roughness={0.36}
              metalness={0.02}
            />
          </mesh>
          <mesh position={plane.anchor} quaternion={resettableQuaternion(plane.normal)}>
            <planeGeometry args={[planeSize, planeSize]} />
            <meshBasicMaterial
              color={focusPlaneId === plane.id ? "#0f766e" : "#94a3b8"}
              transparent
              opacity={focusPlaneId === plane.id ? 0.4 : 0.18}
              wireframe
              side={DoubleSide}
            />
          </mesh>
        </group>
      ))}

      {visualization.feasiblePoints.map((point) => {
        if (!revealedPointIds.has(point.id)) {
          return null;
        }

        const color = objectiveColor(point.objectiveValue, minValue, maxValue);
        const isOptimal = visualization.optimalPoint?.id === point.id;
        const isFocused = focusPointId === point.id;
        const showOptimalPulse =
          isOptimal && ["direction", "optimal", "conclusion"].includes(stage.kind);

        return (
          <group key={point.id} position={[point.x, point.y, point.z]}>
            {!showOptimalPulse ? (
              <mesh
                onPointerOver={() =>
                  onHover(
                    `${point.label}: ${formatPoint(point)} · Z = ${formatNumber(point.objectiveValue)}`,
                  )
                }
                onPointerOut={() => onHover(null)}
              >
                <sphereGeometry args={[isFocused ? 0.18 : 0.13, 22, 22]} />
                <meshStandardMaterial
                  color={isFocused ? "#0f766e" : color}
                  emissive={isFocused ? "#0f766e" : color}
                  emissiveIntensity={isFocused ? 0.18 : 0.1}
                />
              </mesh>
            ) : null}

            {showOptimalPulse ? <PulsingOptimalPoint point={point} /> : null}

            {isFocused ? (
              <mesh>
                <sphereGeometry args={[0.3, 24, 24]} />
                <meshBasicMaterial color="#0f766e" transparent opacity={0.14} />
              </mesh>
            ) : null}

            {showLabels ? (
              <Html distanceFactor={12} position={[0.18, 0.18, 0]}>
                <div className="rounded-full border border-slate-200 bg-white/92 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-lg backdrop-blur-sm">
                  {showOptimalPulse ? "Óptimo" : point.label}
                </div>
              </Html>
            ) : null}
          </group>
        );
      })}

      {stage.kind === "direction" ? (
        <Line
          points={[
            [
              visualization.bounds.x * 0.12,
              visualization.bounds.y * 0.14,
              visualization.bounds.z * 0.08,
            ],
            [
              visualization.bounds.x * 0.72,
              visualization.bounds.y * 0.66,
              visualization.bounds.z * 0.56,
            ],
          ]}
          color="#0f766e"
          dashed
          lineWidth={2.1}
        />
      ) : null}
    </>
  );
}

function StepSummaryPanel({
  stage,
  visualization,
  hovered,
}: {
  stage: ThreeDimensionalStage;
  visualization: ThreeDimensionalVisualization;
  hovered: string | null;
}) {
  const focusedPoint = stage.focusPointId
    ? visualization.feasiblePoints.find((point) => point.id === stage.focusPointId)
    : undefined;

  return (
    <div className="min-w-0 rounded-[24px] border border-border/70 bg-surface p-4 shadow-elevation-1">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Panel de datos
      </div>
      <div className="mt-3 wrap-break-word rounded-2xl border border-border/70 bg-surface-alt p-3 text-sm leading-relaxed text-foreground">
        {hovered ?? stage.description}
      </div>
      <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        <div className="min-w-0 rounded-2xl bg-surface-alt p-3 shadow-elevation-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Paso actual
          </div>
          <div className="mt-1 wrap-break-word text-sm font-bold text-primary-dark">
            {stage.title}
          </div>
        </div>
        <div className="min-w-0 rounded-2xl bg-surface-alt p-3 shadow-elevation-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Punto en foco
          </div>
          <div className="mt-1 wrap-break-word font-mono text-sm font-bold text-foreground">
            {focusedPoint ? formatPoint(focusedPoint) : "Sin foco puntual"}
          </div>
        </div>
        <div className="min-w-0 rounded-2xl bg-surface-alt p-3 shadow-elevation-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Valor de Z
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-foreground">
            {focusedPoint ? `Z = ${formatNumber(focusedPoint.objectiveValue)}` : "Según escala"}
          </div>
        </div>
      </div>
    </div>
  );
}

function EvaluationTable({
  visualization,
  focusedPointId,
}: {
  visualization: ThreeDimensionalVisualization;
  focusedPointId?: string;
}) {
  const rows = [...visualization.feasiblePoints].sort((left, right) =>
    left.label.localeCompare(right.label, "es"),
  );

  return (
    <div className="min-w-0 rounded-[24px] border border-border/70 bg-surface p-4 shadow-elevation-1">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Evaluación de vértices 3D
      </div>
      <div className="scrollbar-thin w-full overflow-x-auto">
        <table className="min-w-152 text-sm xl:min-w-136 2xl:min-w-152">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-2 py-2">Punto</th>
              <th className="px-2 py-2">Coordenadas</th>
              <th className="px-2 py-2">Valor de Z</th>
              <th className="px-2 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((point) => {
              const isOptimal = visualization.optimalPoint?.id === point.id;
              const isFocused = focusedPointId === point.id;

              return (
                <tr
                  key={point.id}
                  className={`${isOptimal ? "bg-optimal/75" : isFocused ? "bg-pivot-row/80" : ""} border-b border-border/70 last:border-b-0`}
                >
                  <td className="px-2 py-2 font-mono font-semibold text-foreground">
                    {point.label}
                  </td>
                  <td className="px-2 py-2 font-mono text-muted-foreground">
                    {formatPoint(point)}
                  </td>
                  <td className="px-2 py-2 font-mono font-semibold text-primary-dark">
                    {formatNumber(point.objectiveValue)}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        isOptimal
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-alt text-muted-foreground"
                      }`}
                    >
                      {isOptimal ? "Óptimo" : "Factible"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FeasibleSpace3DSection({ visualization }: Props) {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const controlsRef = useRef<{ reset: () => void } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentStage(0);
    setPlaying(false);
    setShowAll(false);
  }, [visualization]);

  useEffect(() => {
    if (!playing || showAll || visualization.stages.length === 0) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setCurrentStage((current) => {
        if (current >= visualization.stages.length - 1) {
          setPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, 2400);

    return () => window.clearTimeout(timerId);
  }, [currentStage, playing, showAll, visualization.stages.length]);

  const stage = visualization.stages[showAll ? visualization.stages.length - 1 : currentStage];
  const focusedPoint = stage?.focusPointId
    ? visualization.feasiblePoints.find((point) => point.id === stage.focusPointId)
    : undefined;

  const summary = useMemo(() => {
    const point = visualization.optimalPoint;
    if (!point) {
      return null;
    }

    return {
      coordinates: formatPoint(point),
      objective: formatNumber(point.objectiveValue),
      constraints:
        point.activeConstraints.length > 0 ? point.activeConstraints.join(", ") : "Sin activas",
    };
  }, [visualization.optimalPoint]);

  if (!visualization.available) {
    return (
      <section className="md-elevated overflow-hidden p-5 sm:p-6">
        <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Visualización 3D del espacio factible
        </div>
        <p className="mt-3 rounded-2xl bg-surface-alt p-4 text-sm leading-relaxed text-muted-foreground">
          {visualization.message}
        </p>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="md-elevated max-w-full min-w-0 overflow-hidden p-4 sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Visualización 3D del espacio factible
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Para tres variables, la región factible vive en 3D. El{" "}
            {getOptimizationOutcomeLabel(visualization.optimizationType)} de Programación Lineal
            sigue ocurriendo en un vértice factible cuando existe solución óptima.
          </p>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => controlsRef.current?.reset()}
            className="rounded-full border border-border bg-surface-alt px-3 py-1.5 text-xs font-semibold text-primary-dark transition-colors hover:bg-secondary"
          >
            Reset cámara
          </button>
          <button
            type="button"
            onClick={() => setCanvasKey((current) => current + 1)}
            className="rounded-full border border-accent/35 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-primary-dark transition-colors hover:bg-accent/15"
          >
            Restablecer vista
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="relative min-w-0 max-w-full overflow-hidden rounded-[24px] border border-border/70 bg-surface shadow-elevation-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/70 bg-surface-alt px-4 py-3 text-xs text-muted-foreground">
            <span>Rotar: arrastra</span>
            <span>Zoom: rueda o pellizco</span>
            <span>Desplazar: botón derecho</span>
          </div>
          <div className="aspect-16/10 min-h-85 w-full max-w-full sm:min-h-105 lg:min-h-130 xl:min-h-155">
            {mounted ? (
              <Canvas
                key={canvasKey}
                className="h-full w-full"
                camera={{
                  position: [
                    visualization.bounds.x * 1.4,
                    visualization.bounds.y * 1.35,
                    visualization.bounds.z * 1.35,
                  ],
                  fov: 42,
                }}
                gl={{ antialias: true }}
                dpr={[1, 2]}
              >
                <FeasibleScene visualization={visualization} stage={stage} onHover={setHovered} />
                <OrbitControls
                  ref={controlsRef}
                  enablePan
                  enableZoom
                  enableRotate
                  minDistance={Math.max(
                    2.8,
                    Math.max(
                      visualization.bounds.x,
                      visualization.bounds.y,
                      visualization.bounds.z,
                    ) * 0.48,
                  )}
                  maxDistance={Math.max(
                    12,
                    Math.max(
                      visualization.bounds.x,
                      visualization.bounds.y,
                      visualization.bounds.z,
                    ) * 4.2,
                  )}
                  target={[
                    visualization.bounds.x * 0.34,
                    visualization.bounds.y * 0.3,
                    visualization.bounds.z * 0.28,
                  ]}
                />
              </Canvas>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Preparando escena 3D...
              </div>
            )}
          </div>
        </div>

        <div className="max-w-full overflow-hidden rounded-[24px] border border-border/70 bg-surface-alt p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Resolución gráfica 3D paso a paso
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {stage?.title ?? "Espacio tridimensional"}
              </div>
            </div>
            <div className="rounded-full bg-accent/15 px-3 py-1 text-[11px] font-semibold text-primary-dark">
              Paso {Math.min(currentStage + 1, visualization.stages.length)} de{" "}
              {visualization.stages.length}
            </div>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full gradient-primary"
              animate={{
                width: `${(Math.min(currentStage + 1, visualization.stages.length) / Math.max(visualization.stages.length, 1)) * 100}%`,
              }}
              transition={{ duration: 0.25 }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 xl:justify-start">
            <GraphControlButton
              label="Anterior"
              onClick={() => {
                setCurrentStage((current) => Math.max(0, current - 1));
                setPlaying(false);
                setShowAll(false);
              }}
              disabled={currentStage === 0 && !showAll}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </GraphControlButton>

            {playing ? (
              <GraphControlButton label="Pausar" onClick={() => setPlaying(false)} primary>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <rect x="7" y="5" width="3.5" height="14" rx="1" />
                  <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
                </svg>
              </GraphControlButton>
            ) : (
              <GraphControlButton
                label="Reproducir"
                onClick={() => {
                  setPlaying(true);
                  setShowAll(false);
                }}
                primary
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M7 5l12 7-12 7V5z" />
                </svg>
              </GraphControlButton>
            )}

            <GraphControlButton
              label="Siguiente"
              onClick={() => {
                setCurrentStage((current) =>
                  Math.min(visualization.stages.length - 1, current + 1),
                );
                setPlaying(false);
                setShowAll(false);
              }}
              disabled={currentStage >= visualization.stages.length - 1 && !showAll}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </GraphControlButton>

            <div className="mx-1 h-7 w-px bg-border" />

            <div className="rounded-full bg-surface px-3 py-2 font-mono text-[11px] font-semibold text-primary-dark shadow-elevation-1">
              {Math.min(currentStage + 1, visualization.stages.length)} /{" "}
              {visualization.stages.length}
            </div>

            <GraphControlButton
              label="Reiniciar"
              onClick={() => {
                setCurrentStage(0);
                setPlaying(false);
                setShowAll(false);
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </GraphControlButton>

            <button
              type="button"
              onClick={() => {
                const nextShowAll = !showAll;
                setShowAll(nextShowAll);
                setPlaying(false);
                if (nextShowAll) {
                  setCurrentStage(visualization.stages.length - 1);
                }
              }}
              className="rounded-full bg-surface px-3 py-2 text-xs font-semibold text-primary-dark shadow-elevation-1 transition-colors hover:bg-secondary"
            >
              {showAll ? "Modo paso a paso" : "Mostrar todo"}
            </button>
          </div>

          <div className="scrollbar-thin mt-4 flex max-w-full gap-2 overflow-x-auto pb-1">
            {visualization.stages.map((item, index) => (
              <StagePill
                key={item.id}
                index={index}
                stage={item}
                active={index === currentStage}
                onClick={() => {
                  setCurrentStage(index);
                  setPlaying(false);
                  setShowAll(false);
                }}
              />
            ))}
          </div>
        </div>

        {summary ? (
          <div className="grid min-w-0 gap-3 sm:grid-cols-3">
            <div className="min-w-0 rounded-[24px] border border-border/70 bg-surface p-4 shadow-elevation-1">
              <div className="rounded-2xl bg-surface-alt p-3 shadow-elevation-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Punto óptimo
                </div>
                <div className="mt-1 wrap-break-word font-mono text-sm font-bold text-primary-dark">
                  {summary.coordinates}
                </div>
              </div>
            </div>
            <div className="min-w-0 rounded-[24px] border border-border/70 bg-surface p-4 shadow-elevation-1">
              <div className="rounded-2xl bg-surface-alt p-3 shadow-elevation-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Valor de Z
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-primary-dark">
                  {summary.objective}
                </div>
              </div>
            </div>
            <div className="min-w-0 rounded-[24px] border border-border/70 bg-surface p-4 shadow-elevation-1">
              <div className="rounded-2xl bg-surface-alt p-3 shadow-elevation-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Restricciones activas
                </div>
                <div className="mt-1 wrap-break-word text-sm font-semibold text-foreground">
                  {summary.constraints}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid min-w-0 max-w-full grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="min-w-0 space-y-4">
            <StepSummaryPanel stage={stage} visualization={visualization} hovered={hovered} />

            <div className="min-w-0 rounded-[24px] border border-border/70 bg-surface p-4 shadow-elevation-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Escala de color para Z
              </div>
              <div className="mt-3 h-3 rounded-full bg-[linear-gradient(90deg,#3b82f6_0%,#06b6d4_35%,#fb923c_72%,#ef4444_100%)]" />
              <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                <span>Bajo</span>
                <span>Alto</span>
              </div>
            </div>

            <div className="min-w-0 rounded-[24px] border border-border/70 bg-surface p-4 shadow-elevation-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Lectura matemática
              </div>
              <div className="mt-3 space-y-2 wrap-break-word text-sm leading-relaxed text-muted-foreground">
                {(stage?.notes ?? visualization.notes).map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <EvaluationTable visualization={visualization} focusedPointId={focusedPoint?.id} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
