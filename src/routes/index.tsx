import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GraphicalMethodSection } from "@/components/graphical/GraphicalMethodSection";
import { Header } from "@/components/layout/Header";
import { ExampleSelector } from "@/components/examples/ExampleSelector";
import { LinearModelForm } from "@/components/forms/LinearModelForm";
import { ModelVisualSummarySection } from "@/components/results/ModelVisualSummarySection";
import { SensitivityAnalysisSection } from "../components/results/SensitivityAnalysisSection";
import { StepByStepPlayer } from "@/components/steps/StepByStepPlayer";
import { SolutionShowcase } from "@/components/results/SolutionShowcase";
import { FloatingStepControls } from "@/components/layout/FloatingStepControls";
import { exampleModels } from "@/lib/linear-programming/examples";
import { solveGraphically } from "@/lib/linear-programming/graphical";
import { buildSimplexSteps, solveSimplex } from "@/lib/linear-programming/simplex";
import { buildThreeDimensionalVisualization } from "@/lib/linear-programming/visualization";
import type {
  ExampleModel,
  LinearProgrammingProblem,
  SimplexResult,
} from "@/lib/linear-programming/types";
import {
  createEmptyDraft,
  modelToProblem,
  problemToDraft,
  problemToModel,
  resizeDraft,
  validateDraft,
} from "@/lib/linear-programming/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

const FeasibleSpace3DSection = lazy(() =>
  import("@/components/graphical/FeasibleSpace3DSection").then((module) => ({
    default: module.FeasibleSpace3DSection,
  })),
);

function Index() {
  const initialExample = exampleModels[0];
  const [selectedId, setSelectedId] = useState<string | null>(initialExample.id);
  const [draft, setDraft] = useState(() => problemToDraft(modelToProblem(initialExample)));
  const [errors, setErrors] = useState<string[]>([]);
  const [solvedProblem, setSolvedProblem] = useState<LinearProgrammingProblem | null>(() =>
    modelToProblem(initialExample),
  );
  const [simplexResult, setSimplexResult] = useState<SimplexResult | null>(() =>
    solveSimplex(modelToProblem(initialExample)),
  );
  const [solvedMeta, setSolvedMeta] = useState<
    Pick<ExampleModel, "id" | "name" | "description" | "interpretation">
  >({
    id: initialExample.id,
    name: initialExample.name,
    description: initialExample.description,
    interpretation: initialExample.interpretation,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const solvedModel = useMemo(
    () =>
      solvedProblem
        ? problemToModel(solvedProblem, {
            id: solvedMeta.id,
            name: solvedMeta.name,
            description: solvedMeta.description,
          })
        : null,
    [solvedMeta.description, solvedMeta.id, solvedMeta.name, solvedProblem],
  );
  const simplexSteps = useMemo(
    () => (solvedProblem && simplexResult ? buildSimplexSteps(solvedProblem, simplexResult) : []),
    [simplexResult, solvedProblem],
  );
  const graphicalResult = useMemo(
    () =>
      solvedProblem
        ? solveGraphically(solvedProblem)
        : solveGraphically({
            optimizationType: "max",
            objectiveCoefficients: [1, 1, 1],
            constraints: [],
          }),
    [solvedProblem],
  );
  const total = simplexSteps.length;
  const visualizationDimension = solvedProblem?.objectiveCoefficients.length ?? 0;
  const threeDimensionalVisualization = useMemo(
    () =>
      solvedProblem && simplexResult
        ? buildThreeDimensionalVisualization(solvedProblem, simplexResult)
        : null,
    [simplexResult, solvedProblem],
  );

  const loadSolvedExample = (example: ExampleModel) => {
    const problem = modelToProblem(example);
    setSelectedId(example.id);
    setDraft(problemToDraft(problem));
    setErrors([]);
    setSolvedProblem(problem);
    setSimplexResult(solveSimplex(problem));
    setSolvedMeta({
      id: example.id,
      name: example.name,
      description: example.description,
      interpretation: example.interpretation,
    });
    setCurrentStep(0);
    setPlaying(false);
    setShowAll(false);
  };

  useEffect(() => {
    if (!playing || showAll || total === 0) return;
    const id = setTimeout(() => {
      setCurrentStep((c) => {
        if (c >= total - 1) {
          setPlaying(false);
          return c;
        }
        return c + 1;
      });
    }, 2000);
    return () => clearTimeout(id);
  }, [playing, currentStep, total, showAll]);

  useEffect(() => {
    if (total === 0) {
      setCurrentStep(0);
      setPlaying(false);
      return;
    }

    setCurrentStep((current) => Math.min(current, total - 1));
  }, [total]);

  return (
    <div className="min-h-screen pb-32">
      <Header />

      <main className="mx-auto max-w-360 px-3 py-4 sm:px-6 sm:py-6">
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(480px,0.82fr)_minmax(0,1.18fr)]">
          {/* Left column */}
          <aside className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:pr-1 scrollbar-thin">
            <ExampleSelector
              examples={exampleModels}
              selectedId={selectedId}
              onSelect={(id) => {
                const example = exampleModels.find((item) => item.id === id);
                if (example) {
                  loadSolvedExample(example);
                }
              }}
            />
            <LinearModelForm
              draft={draft}
              errors={errors}
              onAddVariable={() => {
                setSelectedId(null);
                setPlaying(false);
                setDraft((current) =>
                  resizeDraft(current, current.variableCount + 1, current.constraintCount),
                );
              }}
              onRemoveVariable={() => {
                setSelectedId(null);
                setPlaying(false);
                setDraft((current) =>
                  resizeDraft(current, current.variableCount - 1, current.constraintCount),
                );
              }}
              onAddConstraint={() => {
                setSelectedId(null);
                setPlaying(false);
                setDraft((current) =>
                  resizeDraft(current, current.variableCount, current.constraintCount + 1),
                );
              }}
              onRemoveLastConstraint={() => {
                setSelectedId(null);
                setPlaying(false);
                setDraft((current) => {
                  const nextCount = Math.max(1, current.constraintCount - 1);
                  return {
                    ...resizeDraft(current, current.variableCount, nextCount),
                    constraints: current.constraints.slice(0, nextCount).map((constraint) => ({
                      ...constraint,
                      coefficients: Array.from(
                        { length: current.variableCount },
                        (_, columnIndex) => constraint.coefficients[columnIndex] ?? "",
                      ),
                    })),
                    constraintCount: nextCount,
                  };
                });
              }}
              onRemoveConstraint={(rowIndex) => {
                setSelectedId(null);
                setPlaying(false);
                setDraft((current) => ({
                  ...resizeDraft(current, current.variableCount, current.constraintCount - 1),
                  constraints: current.constraints
                    .filter((_, currentRowIndex) => currentRowIndex !== rowIndex)
                    .map((constraint) => ({
                      ...constraint,
                      coefficients: Array.from(
                        { length: current.variableCount },
                        (_, columnIndex) => constraint.coefficients[columnIndex] ?? "",
                      ),
                    })),
                  constraintCount: Math.max(1, current.constraintCount - 1),
                }));
              }}
              onOptimizationTypeChange={(value) => {
                setSelectedId(null);
                setPlaying(false);
                setDraft((current) => ({ ...current, optimizationType: value }));
              }}
              onObjectiveChange={(index, value) => {
                setSelectedId(null);
                setPlaying(false);
                setDraft((current) => ({
                  ...current,
                  objectiveCoefficients: current.objectiveCoefficients.map((item, itemIndex) =>
                    itemIndex === index ? value : item,
                  ),
                }));
              }}
              onConstraintCoefficientChange={(rowIndex, columnIndex, value) => {
                setSelectedId(null);
                setPlaying(false);
                setDraft((current) => ({
                  ...current,
                  constraints: current.constraints.map((constraint, currentRowIndex) =>
                    currentRowIndex === rowIndex
                      ? {
                          ...constraint,
                          coefficients: constraint.coefficients.map((item, currentColumnIndex) =>
                            currentColumnIndex === columnIndex ? value : item,
                          ),
                        }
                      : constraint,
                  ),
                }));
              }}
              onConstraintRhsChange={(rowIndex, value) => {
                setSelectedId(null);
                setPlaying(false);
                setDraft((current) => ({
                  ...current,
                  constraints: current.constraints.map((constraint, currentRowIndex) =>
                    currentRowIndex === rowIndex ? { ...constraint, rhs: value } : constraint,
                  ),
                }));
              }}
              onConstraintOperatorChange={(rowIndex, value) => {
                setSelectedId(null);
                setPlaying(false);
                setDraft((current) => ({
                  ...current,
                  constraints: current.constraints.map((constraint, currentRowIndex) =>
                    currentRowIndex === rowIndex ? { ...constraint, operator: value as any } : constraint,
                  ),
                }));
              }}
              onSolve={() => {
                const validation = validateDraft(draft);
                if (!validation.isValid || !validation.problem) {
                  setErrors(validation.errors);
                  setPlaying(false);
                  return;
                }

                setErrors([]);
                setSolvedProblem(validation.problem);
                setSimplexResult(solveSimplex(validation.problem));
                if (selectedId) {
                  const example = exampleModels.find((item) => item.id === selectedId);
                  if (example) {
                    setSolvedMeta({
                      id: example.id,
                      name: example.name,
                      description: example.description,
                      interpretation: example.interpretation,
                    });
                  }
                } else {
                  setSolvedMeta({
                    id: "manual-problem",
                    name: "Problema manual",
                    description: "Modelo ingresado y resuelto manualmente por el usuario.",
                    interpretation:
                      "El resultado corresponde a un modelo ingresado manualmente y resuelto con el flujo actual del aplicativo.",
                  });
                }
                setCurrentStep(0);
                setPlaying(false);
                setShowAll(false);
              }}
              onReset={() => {
                setSelectedId(null);
                setDraft(createEmptyDraft());
                setErrors([]);
                setSolvedProblem(null);
                setSimplexResult(null);
                setCurrentStep(0);
                setPlaying(false);
                setShowAll(false);
              }}
            />
          </aside>

          {/* Right column */}
          <div className="min-w-0 space-y-5">
            {solvedProblem && simplexResult && solvedModel ? (
              <>
                {visualizationDimension === 2 ? (
                  <GraphicalMethodSection result={graphicalResult} />
                ) : visualizationDimension === 3 && threeDimensionalVisualization ? (
                  <Suspense
                    fallback={
                      <section className="md-elevated overflow-hidden p-5 sm:p-6">
                        <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Visualización 3D del espacio factible
                        </div>
                        <p className="mt-3 rounded-2xl bg-surface-alt p-4 text-sm leading-relaxed text-muted-foreground">
                          Preparando escena 3D del espacio factible...
                        </p>
                      </section>
                    }
                  >
                    <FeasibleSpace3DSection visualization={threeDimensionalVisualization} />
                  </Suspense>
                ) : visualizationDimension >= 4 ? (
                  <ModelVisualSummarySection problem={solvedProblem} result={simplexResult} />
                ) : null}

                <StepByStepPlayer
                  model={solvedModel}
                  steps={simplexSteps}
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                  showAll={showAll}
                />

                <SolutionShowcase
                  problem={solvedProblem}
                  result={simplexResult}
                  graphicalResult={graphicalResult}
                  interpretation={solvedMeta.interpretation}
                />

                <SensitivityAnalysisSection problem={solvedProblem} result={simplexResult} />
              </>
            ) : (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="md-elevated overflow-hidden p-5 sm:p-6"
              >
                <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Panel de solución
                </div>
                <p className="rounded-2xl bg-surface-alt p-4 text-sm leading-relaxed text-muted-foreground">
                  Ingresa un problema o carga un ejemplo para ver el método Simplex tablero por
                  tablero y, cuando haya dos variables, la resolución por método gráfico.
                </p>
              </motion.section>
            )}
          </div>
        </div>
      </main>

      {total > 0 ? (
        <FloatingStepControls
          current={currentStep}
          total={total}
          playing={playing}
          showAll={showAll}
          onPrev={() => {
            setCurrentStep((c) => Math.max(0, c - 1));
            setPlaying(false);
          }}
          onNext={() => {
            setCurrentStep((c) => Math.min(total - 1, c + 1));
            setPlaying(false);
          }}
          onPlay={() => {
            setPlaying(true);
            setShowAll(false);
          }}
          onPause={() => setPlaying(false)}
          onReset={() => {
            setCurrentStep(0);
            setPlaying(false);
            setShowAll(false);
          }}
          onToggleAll={() => {
            setShowAll((current) => !current);
            setPlaying(false);
            if (!showAll) {
              setCurrentStep(total - 1);
            }
          }}
        />
      ) : null}
    </div>
  );
}
