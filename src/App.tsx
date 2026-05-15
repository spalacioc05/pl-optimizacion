import { useMemo, useState } from 'react';
import ExampleSelector from './components/ExampleSelector';
import IterationCard from './components/IterationCard';
import ModelReferenceCard from './components/ModelReferenceCard';
import ProblemForm from './components/ProblemForm';
import SolutionSummary from './components/SolutionSummary';
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

const exampleVisualReferences = {
  wyndor: {
    title: 'Wyndor Glass',
    expectedPoint: { x: 2, y: 6 },
    axisMax: { x: 6, y: 8 },
    expectedResultLines: ['X1 = 2', 'X2 = 6', 'Z = 36', 'S1 = 2', 'S2 = 0', 'S3 = 0'],
    interpretation:
      'Se deben fabricar 2 lotes del producto 1 y 6 lotes del producto 2. La ganancia máxima es 36. La primera restricción queda con holgura de 2 unidades y las restricciones 2 y 3 se usan completamente.',
  },
  'word-light': {
    title: 'Word Light',
    expectedPoint: { x: 125, y: 25 },
    axisMax: { x: 160, y: 80 },
    expectedResultLines: ['X1 = 125', 'X2 = 25', 'Z = 175', 'S1 = 0', 'S2 = 0', 'S3 = 35'],
    interpretation:
      'La empresa debe fabricar 125 unidades del producto 1 y 25 unidades del producto 2 para obtener una ganancia máxima de 175. Las restricciones 1 y 2 quedan completamente utilizadas, y la restricción 3 queda con una holgura de 35 unidades.',
  },
} as const;

const App = () => {
  const [draft, setDraft] = useState<ProblemDraft>(createEmptyDraft());
  const [errors, setErrors] = useState<string[]>([]);
  const [solvedProblem, setSolvedProblem] = useState<LinearProgrammingProblem | null>(null);
  const [result, setResult] = useState<SimplexResult | null>(null);
  const [selectedExampleId, setSelectedExampleId] = useState<keyof typeof exampleVisualReferences | null>(null);

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
    setSelectedExampleId(example.id as keyof typeof exampleVisualReferences);
    solveCurrentProblem(nextDraft);
  };

  const selectedReference = useMemo(
    () => (selectedExampleId ? exampleVisualReferences[selectedExampleId] : undefined),
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

  return (
    <div className="app-shell">
      <header className="hero-panel">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-copy">
          <p className="eyebrow">Primer sprint académico</p>
          <span className="hero-kicker">Aplicación web para investigación de operaciones</span>
          <h1>Solver de Programación Lineal</h1>
          <h2 className="hero-subtitle">Método Simplex paso a paso para modelos de maximización</h2>
          <p>
            Ingresa un modelo en forma básica y observa la conversión a forma aumentada, los tableros Simplex y la solución óptima.
          </p>
          <div className="hero-highlights">
            <div className="hero-highlight-card">
              <strong>Visualización tablero a tablero</strong>
              <span>Cada iteración muestra variable entrante, saliente, pivote y operaciones de renglón.</span>
            </div>
            <div className="hero-highlight-card">
              <strong>Preparado para siguientes sprints</strong>
              <span>Estructura modular lista para extenderse a nuevos métodos y reportes.</span>
            </div>
          </div>
        </div>
        <div className="hero-note">
          <div className="hero-note-header">
            <span className="pill-label">Alcance del sprint</span>
            <strong>Método Simplex normal</strong>
          </div>
          <p>Maximización, restricciones &lt;=, lado derecho positivo y variables no negativas.</p>
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
              <section className="panel model-panel section-emphasis">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Paso 1</p>
                    <h2>Modelo original</h2>
                  </div>
                </div>
                <div className="equation-list">
                  {originalModel.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </section>

              <section className="panel model-panel section-emphasis">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Paso 2</p>
                    <h2>Conversión a forma aumentada</h2>
                  </div>
                  <p className="panel-copy">
                    Las variables de holgura se agregan a las restricciones &lt;=, tienen coeficiente 1 en su propia restricción, 0 en las demás y costo 0 en la función objetivo.
                  </p>
                </div>
                <div className="equation-list">
                  <p>{result.augmentedObjective}</p>
                  {result.augmentedConstraints.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </section>

              {solvedProblem.objectiveCoefficients.length === 2 ? (
                <ModelReferenceCard variableCount={2} reference={selectedReference} />
              ) : null}

              <section className="iterations-section">
                {result.iterations.map((iteration) => (
                  <IterationCard key={`iteration-${iteration.iterationNumber}`} iteration={iteration} />
                ))}
              </section>

              <SolutionSummary result={result} interpretation={selectedReference?.interpretation} />
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
