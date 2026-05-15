import { useMemo, useState } from 'react';
import ExampleSelector from './components/ExampleSelector';
import ProblemForm from './components/ProblemForm';
import StepByStepPlayer from './components/StepByStepPlayer';
import { exampleProblems } from './simplex/examples';
import { solveSimplex } from './simplex/simplexSolver';
import {
  ExampleProblem,
  LinearProgrammingProblem,
  ProblemDraft,
  SimplexResult,
} from './simplex/simplexTypes';
import {
  createEmptyDraft,
  formatConstraint,
  formatObjectiveFunction,
  problemToDraft,
  resizeDraft,
  validateDraft,
} from './simplex/simplexUtils';

const exampleInsights = {
  wyndor: {
    interpretation:
      'Se deben fabricar 2 lotes del producto 1 y 6 lotes del producto 2. La ganancia máxima es 36. La primera restricción queda con holgura de 2 unidades y las restricciones 2 y 3 se usan completamente.',
  },
  'word-light': {
    interpretation:
      'La empresa debe fabricar 125 unidades del producto 1 y 25 unidades del producto 2 para obtener una ganancia máxima de 175. Las restricciones 1 y 2 quedan completamente utilizadas, y la restricción 3 queda con una holgura de 35 unidades.',
  },
  'simplex-tabular-material': {
    interpretation:
      'El óptimo se obtiene en el punto X1 = 3 y X2 = 1.5, con valor Z = 21. Las restricciones 1 y 2 quedan activas, mientras las restricciones 3 y 4 conservan holguras de 2.5 y 0.5 respectivamente.',
  },
} as const;

const heroScopeItems = ['Maximización', 'Restricciones ≤', 'Variables ≥ 0', 'Tablero Simplex', 'Sprint 1'];

const toDisplayMath = (value: string): string => value.replace(/<=/g, '≤').replace(/>=/g, '≥');

const App = () => {
  const [draft, setDraft] = useState<ProblemDraft>(createEmptyDraft());
  const [errors, setErrors] = useState<string[]>([]);
  const [solvedProblem, setSolvedProblem] = useState<LinearProgrammingProblem | null>(null);
  const [result, setResult] = useState<SimplexResult | null>(null);
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null);

  const handleVariableCountChange = (value: number) => {
    setSelectedExampleId(null);
    setDraft((current) => resizeDraft(current, Number.isNaN(value) ? 1 : value, current.constraintCount));
  };

  const handleConstraintCountChange = (value: number) => {
    setSelectedExampleId(null);
    setDraft((current) => resizeDraft(current, current.variableCount, Number.isNaN(value) ? 1 : value));
  };

  const handleObjectiveChange = (index: number, value: string) => {
    setSelectedExampleId(null);
    setDraft((current) => ({
      ...current,
      objectiveCoefficients: current.objectiveCoefficients.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const handleConstraintCoefficientChange = (rowIndex: number, columnIndex: number, value: string) => {
    setSelectedExampleId(null);
    setDraft((current) => ({
      ...current,
      constraints: current.constraints.map((constraint, currentRowIndex) => (
        currentRowIndex === rowIndex
          ? {
              ...constraint,
              coefficients: constraint.coefficients.map((item, currentColumnIndex) => (
                currentColumnIndex === columnIndex ? value : item
              )),
            }
          : constraint
      )),
    }));
  };

  const handleConstraintRhsChange = (rowIndex: number, value: string) => {
    setSelectedExampleId(null);
    setDraft((current) => ({
      ...current,
      constraints: current.constraints.map((constraint, currentRowIndex) => (
        currentRowIndex === rowIndex
          ? {
              ...constraint,
              rhs: value,
            }
          : constraint
      )),
    }));
  };

  const handleReset = () => {
    setDraft(createEmptyDraft());
    setErrors([]);
    setSolvedProblem(null);
    setResult(null);
    setSelectedExampleId(null);
  };

  const solveCurrentProblem = (nextDraft: ProblemDraft = draft) => {
    const validation = validateDraft(nextDraft);

    if (!validation.isValid || !validation.problem) {
      setErrors(validation.errors);
      setSolvedProblem(null);
      setResult(null);
      return;
    }

    const simplexResult = solveSimplex(validation.problem);
    setErrors([]);
    setSolvedProblem(validation.problem);
    setResult(simplexResult);
  };

  const handleExampleSelect = (example: ExampleProblem) => {
    const nextDraft = problemToDraft(example.problem);
    setDraft(nextDraft);
    setSelectedExampleId(example.id);
    solveCurrentProblem(nextDraft);
  };

  const selectedInsight = useMemo(
    () => (
      selectedExampleId && selectedExampleId in exampleInsights
        ? exampleInsights[selectedExampleId as keyof typeof exampleInsights]
        : undefined
    ),
    [selectedExampleId],
  );

  const originalModel = useMemo(() => {
    if (!solvedProblem) {
      return [];
    }

    return [
      formatObjectiveFunction(solvedProblem),
      ...solvedProblem.constraints.map((constraint) => formatConstraint(constraint)),
      'Xi >= 0 para toda variable.',
    ];
  }, [solvedProblem]);

  const displayedOriginalModel = useMemo(
    () => originalModel.map((line) => toDisplayMath(line)),
    [originalModel],
  );

  const displayedAugmentedModel = useMemo(() => {
    if (!result) {
      return [];
    }

    return [result.augmentedObjective, ...result.augmentedConstraints].map((line) => toDisplayMath(line));
  }, [result]);

  return (
    <div className="app-shell">
      <header className="hero-panel">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-copy">
          <p className="eyebrow">Primer sprint académico</p>
          <span className="hero-kicker">Aplicación web para investigación de operaciones</span>
          <h1>Solver de Programación Lineal</h1>
          <h2 className="hero-subtitle">Método Simplex paso a paso</h2>
          <p>
            Ingresa un modelo en forma básica y observa la conversión a forma aumentada, los tableros Simplex y la solución óptima.
          </p>
          <div className="hero-chip-row">
            {heroScopeItems.map((item) => (
              <span key={item} className="hero-scope-chip">{item}</span>
            ))}
          </div>
        </div>
        <div className="hero-note">
          <div className="hero-note-header">
            <span className="pill-label">Alcance del sprint</span>
            <strong>Método Simplex normal</strong>
          </div>
          <p>Maximización, restricciones ≤, lado derecho positivo y variables no negativas.</p>
          <div className="hero-stats-grid">
            <div className="hero-stat">
              <span>Objetivo</span>
              <strong>Resolver y explicar</strong>
            </div>
            <div className="hero-stat">
              <span>Entrada</span>
              <strong>Forma básica</strong>
            </div>
            <div className="hero-stat">
              <span>Salida</span>
              <strong>Solución óptima</strong>
            </div>
          </div>
        </div>
      </header>

      <main className="main-layout">
        <div className="left-column">
          <ExampleSelector examples={exampleProblems} onSelect={handleExampleSelect} />
          <ProblemForm
            draft={draft}
            errors={errors}
            onVariableCountChange={handleVariableCountChange}
            onConstraintCountChange={handleConstraintCountChange}
            onObjectiveChange={handleObjectiveChange}
            onConstraintCoefficientChange={handleConstraintCoefficientChange}
            onConstraintRhsChange={handleConstraintRhsChange}
            onSubmit={() => solveCurrentProblem()}
            onReset={handleReset}
          />
        </div>

        <div className="right-column">
          <section className="panel help-panel accent-surface">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Apoyo conceptual</p>
                <h2>¿Cómo funciona el método Simplex?</h2>
              </div>
            </div>
            <p>
              El método Simplex parte de una solución básica factible inicial, generalmente usando variables de holgura. Luego mejora la solución iterativamente seleccionando una variable que entra a la base y una variable que sale. Cada iteración corresponde a moverse de un vértice factible a otro, hasta encontrar una solución donde ya no es posible mejorar la función objetivo.
            </p>
          </section>

          {solvedProblem && result ? (
            <>
              <StepByStepPlayer
                problem={solvedProblem}
                originalModel={displayedOriginalModel}
                augmentedModel={displayedAugmentedModel}
                result={result}
                interpretation={selectedInsight?.interpretation}
              />
            </>
          ) : (
            <section className="panel empty-panel section-emphasis">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Visualización</p>
                  <h2>Resultados paso a paso</h2>
                </div>
              </div>
              <div className="empty-state-grid">
                <p>
                  Resuelve un problema o carga un ejemplo para ver la forma aumentada, el tablero inicial, cada iteración Simplex y la solución óptima con interpretación.
                </p>
                <div className="empty-state-note">
                  <strong>Qué verás aquí</strong>
                  <span>Modelo original, conversión a forma aumentada, tableros Simplex y resumen final del resultado.</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
