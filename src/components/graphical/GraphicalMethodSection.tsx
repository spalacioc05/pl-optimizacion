import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { GraphicalPlane } from "@/components/graphical/GraphicalPlane";
import { GraphLegend } from "@/components/graphical/GraphLegend";
import { VertexEvaluationTable } from "@/components/graphical/VertexEvaluationTable";
import type { GraphicalResult, LinearProgrammingProblem } from "@/lib/linear-programming/types";
import { formatNumber } from "@/lib/linear-programming/utils";

interface GraphicalMethodSectionProps {
  problem: LinearProgrammingProblem;
  result: GraphicalResult;
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
          : "h-9 w-9 bg-surface-alt text-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

export function GraphicalMethodSection({ problem, result }: GraphicalMethodSectionProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const totalStages = result.stages.length;
  const activeStage = result.stages[currentStage] ?? result.stages[result.stages.length - 1];
  const activeVertexId = activeStage?.focusVertexId;
  const revealedVertexIds = showAll
    ? result.vertices.map((vertex) => vertex.id)
    : (activeStage?.revealedVertexIds ?? []);

  useEffect(() => {
    setCurrentStage(0);
    setPlaying(false);
    setShowAll(false);
    setShowTable(false);
  }, [result]);

  useEffect(() => {
    if (!playing || showAll || totalStages === 0) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setCurrentStage((current) => {
        if (current >= totalStages - 1) {
          setPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, 2000);

    return () => window.clearTimeout(timerId);
  }, [playing, showAll, currentStage, totalStages]);

  const visibleStages = useMemo(
    () => (showAll ? result.stages : result.stages.slice(0, currentStage + 1)),
    [currentStage, result.stages, showAll],
  );

  if (!result.available) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="md-elevated overflow-hidden"
      >
        <div className="border-b border-border bg-surface-alt px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Resolución por método gráfico
          </h2>
        </div>
        <div className="p-5 text-sm leading-relaxed text-muted-foreground">
          Este problema no puede resolverse gráficamente en esta vista porque requiere exactamente
          dos variables de decisión.
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="md-elevated overflow-hidden"
    >
      <div className="border-b border-border bg-surface-alt px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Resolución por método gráfico
            </h2>
            <p className="text-xs text-muted-foreground/80">
              Región factible, vértices y recta objetivo para problemas con dos variables
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 font-mono text-[11px] font-semibold text-secondary-foreground">
              {activeStage?.title ?? "Método gráfico"}
            </span>
            <span className="rounded-full bg-accent/15 px-3 py-1 font-mono text-[11px] font-semibold text-primary-dark">
              Paso {Math.min(currentStage + 1, totalStages)} de {totalStages}
            </span>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full gradient-primary"
            animate={{
              width: `${(Math.min(currentStage + 1, totalStages) / Math.max(totalStages, 1)) * 100}%`,
            }}
            transition={{ duration: 0.25 }}
          />
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.85fr)_minmax(320px,0.95fr)]">
        <div className="space-y-4">
          <div className="md-surface overflow-hidden p-2 sm:p-3 lg:p-4">
            <GraphicalPlane
              problem={problem}
              result={result}
              activeStageIndex={showAll ? totalStages - 1 : currentStage}
            />

            <div className="mt-3 rounded-2xl bg-surface-alt/80 px-3 py-2">
              <GraphLegend constraintCount={result.lines.length} />
            </div>
          </div>

          <div className="flex justify-center xl:justify-start">
            <div className="md-floating flex flex-wrap items-center justify-center gap-1.5 px-2.5 py-1.5">
              <GraphControlButton
                label="Anterior"
                onClick={() => {
                  setCurrentStage((current) => Math.max(0, current - 1));
                  setPlaying(false);
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
                  label="Reproducir automático"
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
                  setCurrentStage((current) => Math.min(totalStages - 1, current + 1));
                  setPlaying(false);
                }}
                disabled={currentStage >= totalStages - 1 && !showAll}
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

              <div className="rounded-full bg-surface-alt px-3 py-1.5 font-mono text-[11px] font-semibold text-primary-dark">
                {Math.min(currentStage + 1, totalStages)} / {totalStages}
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
                  <path
                    d="M3 12a9 9 0 1 0 3-6.7L3 8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </GraphControlButton>

              <GraphControlButton
                label={showAll ? "Modo paso a paso" : "Mostrar todo"}
                onClick={() => {
                  const nextShowAll = !showAll;
                  setShowAll(nextShowAll);
                  setPlaying(false);
                  if (nextShowAll) {
                    setCurrentStage(totalStages - 1);
                  }
                }}
              >
                {showAll ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <rect x="4" y="5" width="16" height="6" rx="2" />
                    <rect x="4" y="13" width="16" height="6" rx="2" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M4 10h16M10 4v16" />
                  </svg>
                )}
              </GraphControlButton>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="md-surface p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Vértices factibles
              </div>
              <div className="mt-2 font-mono text-3xl font-bold text-primary-dark">
                {result.vertices.length}
              </div>
            </div>
            <div className="md-surface p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Punto óptimo
              </div>
              <div className="mt-2 font-mono text-2xl font-bold text-primary-dark">
                {result.optimalVertex
                  ? `(${formatNumber(result.optimalVertex.x)}, ${formatNumber(result.optimalVertex.y)})`
                  : "-"}
              </div>
            </div>
            <div className="md-surface p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Valor máximo
              </div>
              <div className="mt-2 font-mono text-3xl font-bold text-primary-dark">
                {result.optimalVertex ? `Z = ${formatNumber(result.optimalVertex.z)}` : "-"}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div className="md-surface p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Etapa actual
            </div>
            <h3 className="text-lg font-semibold text-foreground">{activeStage?.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {activeStage?.description}
            </p>
            {activeStage?.notes && activeStage.notes.length > 0 ? (
              <div className="mt-3 space-y-2 rounded-2xl bg-surface-alt p-3 text-sm text-muted-foreground">
                {activeStage.notes.map((note) => (
                  <div key={note} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="md-surface p-3">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Secuencia de pasos
              </div>
              <div className="font-mono text-[11px] font-semibold text-primary-dark">
                {Math.min(currentStage + 1, totalStages)} / {totalStages}
              </div>
            </div>
            <div className="scrollbar-thin overflow-x-auto">
              <div className="flex items-center gap-2 px-1">
                {result.stages.map((stage, index) => {
                  const active = index === currentStage;
                  const done = index < currentStage || showAll;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => {
                        setCurrentStage(index);
                        setPlaying(false);
                      }}
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
                        className="grid h-7 w-7 place-items-center rounded-full font-mono text-[11px] font-bold text-primary-foreground shadow-elevation-1"
                      >
                        {done && !active ? (
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
                          <span
                            className={active ? "text-primary-foreground" : "text-muted-foreground"}
                          >
                            {index + 1}
                          </span>
                        )}
                      </motion.div>
                      <span
                        className={`whitespace-nowrap text-[10px] font-medium ${active ? "text-primary-dark" : "text-muted-foreground"}`}
                      >
                        {stage.kind}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="md-surface overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-alt px-4 py-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tabla de evaluación
                </div>
                <div className="text-xs text-muted-foreground/80">
                  Comparación de Z en cada vértice factible
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTable((current) => !current)}
                className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground"
              >
                {showTable ? "Ocultar" : "Ver tabla completa"}
              </button>
            </div>
            {showTable ? (
              <div className="max-h-105 overflow-auto">
                <VertexEvaluationTable
                  result={result}
                  activeVertexId={activeVertexId}
                  revealedVertexIds={revealedVertexIds}
                />
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {result.vertices.map((vertex) => {
                  const isActive = activeVertexId === vertex.id;
                  const isOptimal = result.optimalVertex?.id === vertex.id;
                  return (
                    <div
                      key={vertex.id}
                      className={`rounded-xl px-3 py-2 text-sm ${isOptimal ? "bg-optimal/80" : isActive ? "bg-pivot-row/90" : "bg-surface-alt"}`}
                    >
                      <div className="flex items-center justify-between gap-2 font-mono text-sm font-semibold text-foreground">
                        <span>
                          {vertex.label} ({formatNumber(vertex.x)}, {formatNumber(vertex.y)})
                        </span>
                        <span className="text-primary-dark">Z = {formatNumber(vertex.z)}</span>
                      </div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">
                        {vertex.substitution}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {visibleStages.length > 0 && showAll ? (
            <div className="scrollbar-thin space-y-3 xl:max-h-90 xl:overflow-auto xl:pr-1">
              {visibleStages.map((stage, index) => (
                <div key={stage.id} className="md-surface p-4">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
                    Etapa {index + 1}
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">{stage.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {stage.description}
                  </p>
                  {stage.notes && stage.notes.length > 0 ? (
                    <div className="mt-3 space-y-1.5 rounded-xl bg-surface-alt p-3 text-sm text-muted-foreground">
                      {stage.notes.map((note) => (
                        <div key={note}>{note}</div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
