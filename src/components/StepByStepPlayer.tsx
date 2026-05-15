import { useEffect, useMemo, useState } from 'react';
import {
  LinearProgrammingProblem,
  SimplexIteration,
  SimplexResult,
  SimplexTableau,
} from '../simplex/simplexTypes';
import { formatNumber } from '../simplex/simplexUtils';
import EquationBlock from './EquationBlock';
import OptimizationSpaceChart from './OptimizationSpaceChart';
import ProgressTimeline from './ProgressTimeline';
import SimplexTable from './SimplexTable';
import SolutionSummary from './SolutionSummary';

type PlayerMode = 'idle' | 'guided' | 'all';

type StageKind =
  | 'model'
  | 'augmented'
  | 'chart'
  | 'tableau'
  | 'optimality'
  | 'entering'
  | 'ratios'
  | 'leaving'
  | 'pivot'
  | 'operations'
  | 'updated'
  | 'unbounded'
  | 'solution';

interface PresentationStage {
  id: string;
  shortLabel: string;
  eyebrow: string;
  title: string;
  summary: string;
  kind: StageKind;
  tableau?: SimplexTableau;
  focusIteration?: SimplexIteration;
}

interface StepByStepPlayerProps {
  problem: LinearProgrammingProblem;
  originalModel: string[];
  augmentedModel: string[];
  result: SimplexResult;
  interpretation?: string;
}

const stageStatusText: Record<StageKind, string> = {
  model: 'Modelo cargado',
  augmented: 'Convirtiendo a forma aumentada',
  chart: 'Explorando la región factible',
  tableau: 'Construyendo tablero inicial',
  optimality: 'Verificando optimalidad',
  entering: 'Buscando variable entrante',
  ratios: 'Calculando razones',
  leaving: 'Seleccionando variable saliente',
  pivot: 'Identificando elemento pivote',
  operations: 'Aplicando pivoteo',
  updated: 'Actualizando tablero',
  unbounded: 'El problema no es acotado',
  solution: 'Solución óptima encontrada',
};

const buildIterationSummary = (iteration: SimplexIteration) => {
  const pivotColumn = iteration.pivotColumnIndex !== undefined
    ? iteration.tableau.headers[iteration.pivotColumnIndex]
    : 'No aplica';
  const pivotRow = iteration.pivotRowIndex !== undefined
    ? iteration.tableau.basicVariables[iteration.pivotRowIndex]
    : 'No aplica';

  return [
    { label: 'Variable entrante', value: iteration.enteringVariable ?? 'No aplica' },
    { label: 'Variable saliente', value: iteration.leavingVariable ?? 'No aplica' },
    { label: 'Columna pivote', value: pivotColumn },
    { label: 'Fila pivote', value: pivotRow },
    { label: 'Elemento pivote', value: iteration.pivotValue !== undefined ? formatNumber(iteration.pivotValue) : 'No aplica' },
  ];
};

const StepByStepPlayer = ({
  problem,
  originalModel,
  augmentedModel,
  result,
  interpretation,
}: StepByStepPlayerProps) => {
  const [mode, setMode] = useState<PlayerMode>('idle');
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  const stages = useMemo<PresentationStage[]>(() => {
    const nextStages: PresentationStage[] = [
      {
        id: 'original-model',
        shortLabel: 'Modelo',
        eyebrow: 'Etapa 1',
        title: 'Modelo original',
        summary: 'Se presenta el modelo en forma básica tal como lo ingresa el usuario, sin variables de holgura.',
        kind: 'model',
      },
      {
        id: 'augmented-model',
        shortLabel: 'Forma aumentada',
        eyebrow: 'Etapa 2',
        title: 'Conversión a forma aumentada',
        summary: 'Se agregan variables de holgura con costo cero para construir la base inicial del método Simplex.',
        kind: 'augmented',
      },
    ];

    if (problem.objectiveCoefficients.length === 2) {
      nextStages.push({
        id: 'optimization-space',
        shortLabel: 'Gráfica 2D',
        eyebrow: 'Apoyo gráfico',
        title: 'Espacio de optimización',
        summary: 'Para dos variables se dibujan las restricciones, la región factible y el punto óptimo global en la región factible.',
        kind: 'chart',
      });
    }

    if (result.iterations[0]) {
      nextStages.push({
        id: 'initial-tableau',
        shortLabel: 'Tablero inicial',
        eyebrow: 'Etapa 3',
        title: 'Tablero inicial',
        summary: 'El método arranca con las variables de holgura como base y con la fila Z preparada para la prueba de optimalidad.',
        kind: 'tableau',
        tableau: result.iterations[0].tableau,
        focusIteration: result.iterations[0],
      });
    }

    for (let index = 1; index < result.iterations.length; index += 1) {
      const currentIteration = result.iterations[index];
      const previousIteration = result.iterations[index - 1];
      const labelPrefix = `Iteración ${currentIteration.iterationNumber}`;

      nextStages.push(
        {
          id: `optimality-${currentIteration.iterationNumber}`,
          shortLabel: `Ópt. I${currentIteration.iterationNumber}`,
          eyebrow: `${labelPrefix} · Etapa 4`,
          title: 'Prueba de optimalidad',
          summary: 'Se inspecciona la fila Z del tablero actual. Si hay coeficientes negativos, todavía es posible mejorar el valor de Z.',
          kind: 'optimality',
          tableau: previousIteration.tableau,
          focusIteration: currentIteration,
        },
        {
          id: `entering-${currentIteration.iterationNumber}`,
          shortLabel: `Entra I${currentIteration.iterationNumber}`,
          eyebrow: `${labelPrefix} · Etapa 5`,
          title: 'Variable que entra',
          summary: 'Se escoge la variable con el coeficiente más negativo en la fila Z, porque es la que más mejora la función objetivo.',
          kind: 'entering',
          tableau: previousIteration.tableau,
          focusIteration: currentIteration,
        },
        {
          id: `ratios-${currentIteration.iterationNumber}`,
          shortLabel: `Razones I${currentIteration.iterationNumber}`,
          eyebrow: `${labelPrefix} · Etapa 6`,
          title: 'Cálculo de razones',
          summary: 'Se divide el lado derecho entre cada coeficiente positivo de la columna pivote para conservar factibilidad.',
          kind: 'ratios',
          tableau: previousIteration.tableau,
          focusIteration: currentIteration,
        },
      );

      if (currentIteration.pivotRowIndex !== undefined && currentIteration.leavingVariable) {
        nextStages.push(
          {
            id: `leaving-${currentIteration.iterationNumber}`,
            shortLabel: `Sale I${currentIteration.iterationNumber}`,
            eyebrow: `${labelPrefix} · Etapa 7`,
            title: 'Variable que sale',
            summary: 'La menor razón positiva define qué variable básica abandona la base sin perder factibilidad.',
            kind: 'leaving',
            tableau: previousIteration.tableau,
            focusIteration: currentIteration,
          },
          {
            id: `pivot-${currentIteration.iterationNumber}`,
            shortLabel: `Pivote I${currentIteration.iterationNumber}`,
            eyebrow: `${labelPrefix} · Etapa 8`,
            title: 'Elemento pivote',
            summary: 'La intersección entre la fila y la columna pivote determina el elemento que se normaliza para actualizar la base.',
            kind: 'pivot',
            tableau: previousIteration.tableau,
            focusIteration: currentIteration,
          },
          {
            id: `operations-${currentIteration.iterationNumber}`,
            shortLabel: `Renglones I${currentIteration.iterationNumber}`,
            eyebrow: `${labelPrefix} · Etapa 9`,
            title: 'Operaciones de renglón',
            summary: 'Se convierte el pivote en 1 y se anulan los demás coeficientes de la columna pivote mediante operaciones elementales.',
            kind: 'operations',
            focusIteration: currentIteration,
          },
          {
            id: `updated-${currentIteration.iterationNumber}`,
            shortLabel: `Tablero I${currentIteration.iterationNumber}`,
            eyebrow: `${labelPrefix} · Etapa 10`,
            title: 'Nuevo tablero',
            summary: currentIteration.isOptimal
              ? 'El tablero actualizado ya cumple la condición de optimalidad.'
              : 'El tablero actualizado mejora la solución, pero todavía requiere otra iteración.',
            kind: 'updated',
            tableau: currentIteration.tableau,
            focusIteration: currentIteration,
          },
        );
      } else {
        nextStages.push({
          id: `unbounded-${currentIteration.iterationNumber}`,
          shortLabel: `Estado I${currentIteration.iterationNumber}`,
          eyebrow: `${labelPrefix} · Estado final`,
          title: 'Problema no acotado',
          summary: 'No existe una variable saliente válida, por lo que la solución puede crecer indefinidamente en la dirección de mejora.',
          kind: 'unbounded',
          tableau: previousIteration.tableau,
          focusIteration: currentIteration,
        });
      }
    }

    nextStages.push({
      id: 'final-solution',
      shortLabel: 'Solución',
      eyebrow: 'Etapa final',
      title: result.status === 'optimal' ? 'Solución óptima' : 'Estado final del modelo',
      summary: result.status === 'optimal'
        ? 'Se resume el valor óptimo de Z, las variables de decisión, las holguras y la interpretación del resultado.'
        : 'Se resume el estado final del proceso Simplex para el modelo ingresado.',
      kind: 'solution',
      focusIteration: result.iterations[result.iterations.length - 1],
    });

    return nextStages;
  }, [problem, result]);

  useEffect(() => {
    setMode('idle');
    setActiveStageIndex(0);
  }, [result]);

  const lastStageIndex = stages.length - 1;
  const revealedIndex = mode === 'all' ? lastStageIndex : mode === 'guided' ? activeStageIndex : -1;
  const visibleStages = mode === 'all'
    ? stages
    : mode === 'guided'
      ? stages.slice(0, activeStageIndex + 1)
      : [];
  const currentStage = mode === 'idle' ? null : stages[activeStageIndex];
  const statusLabel = currentStage ? stageStatusText[currentStage.kind] : 'Listo para explicar el procedimiento';

  const handleStart = () => {
    setMode('guided');
    setActiveStageIndex(0);
  };

  const handlePrevious = () => {
    if (mode === 'idle') {
      return;
    }

    setMode('guided');
    setActiveStageIndex((current) => Math.max(0, current - 1));
  };

  const handleNext = () => {
    if (mode === 'idle') {
      handleStart();
      return;
    }

    setMode('guided');
    setActiveStageIndex((current) => Math.min(lastStageIndex, current + 1));
  };

  const handleRestart = () => {
    setMode('guided');
    setActiveStageIndex(0);
  };

  const handleShowAll = () => {
    setMode('all');
    setActiveStageIndex(lastStageIndex);
  };

  const handleSelectStage = (index: number) => {
    if (mode === 'idle' || index > revealedIndex) {
      return;
    }

    setActiveStageIndex(index);
  };

  const renderIterationMeta = (iteration: SimplexIteration) => (
    <div className="stage-meta-grid">
      {buildIterationSummary(iteration).map((item) => (
        <div key={`${iteration.iterationNumber}-${item.label}`} className="meta-item stage-meta-item">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );

  const renderRatios = (iteration: SimplexIteration) => (
    <section className="detail-block ratio-block">
      <h4>Razones calculadas</h4>
      <ul>
        {iteration.ratios.map((ratio) => (
          <li
            key={`${iteration.iterationNumber}-${ratio.basicVariable}`}
            className={[
              'ratio-item',
              iteration.leavingVariable === ratio.basicVariable ? 'selected-ratio-item' : '',
            ].join(' ').trim() || undefined}
          >
            <strong>{`${ratio.basicVariable}:`}</strong>
            <span>{ratio.expression}</span>
          </li>
        ))}
      </ul>
    </section>
  );

  const renderStage = (stage: PresentationStage, index: number) => {
    const isActive = mode !== 'idle' && index === activeStageIndex;
    const iteration = stage.focusIteration;

    if (stage.kind === 'model') {
      return (
        <section key={stage.id} className={[ 'panel', 'presentation-stage', isActive ? 'active-presentation-stage' : '' ].join(' ').trim()}>
          <div className="panel-header compact-header">
            <div>
              <p className="eyebrow">{stage.eyebrow}</p>
              <h2>{stage.title}</h2>
            </div>
            <span className="status-badge working">Modelo cargado</span>
          </div>
          <p className="panel-copy presentation-stage-copy">{stage.summary}</p>
          <EquationBlock
            title="Forma básica ingresada"
            description="La aplicación recibe el modelo original y conserva la convención del material de clase: maximización, restricciones ≤ y variables no negativas."
            lines={originalModel}
            badge="Forma básica"
          />
        </section>
      );
    }

    if (stage.kind === 'augmented') {
      return (
        <section key={stage.id} className={[ 'panel', 'presentation-stage', isActive ? 'active-presentation-stage' : '' ].join(' ').trim()}>
          <div className="panel-header compact-header">
            <div>
              <p className="eyebrow">{stage.eyebrow}</p>
              <h2>{stage.title}</h2>
            </div>
            <span className="status-badge working">Holguras iniciales</span>
          </div>
          <p className="panel-copy presentation-stage-copy">{stage.summary}</p>
          <EquationBlock
            title="Modelo equivalente para el tablero"
            description="Las variables de holgura tienen costo 0 en la función objetivo y conforman la base inicial del algoritmo."
            lines={augmentedModel}
            badge="Forma aumentada"
          />
        </section>
      );
    }

    if (stage.kind === 'chart') {
      return (
        <div key={stage.id} className={[ 'presentation-stage-shell', isActive ? 'active-presentation-stage' : '' ].join(' ').trim()}>
          <OptimizationSpaceChart problem={problem} result={result} />
        </div>
      );
    }

    if (stage.kind === 'solution') {
      return (
        <div key={stage.id} className={[ 'presentation-stage-shell', isActive ? 'active-presentation-stage' : '' ].join(' ').trim()}>
          <SolutionSummary result={result} interpretation={interpretation} />
        </div>
      );
    }

    if (!iteration || !stage.tableau) {
      return null;
    }

    const tableau = stage.tableau;

    if (stage.kind === 'operations') {
      return (
        <section key={stage.id} className={[ 'panel', 'presentation-stage', isActive ? 'active-presentation-stage' : '' ].join(' ').trim()}>
          <div className="panel-header compact-header">
            <div>
              <p className="eyebrow">{stage.eyebrow}</p>
              <h2>{stage.title}</h2>
            </div>
            <span className="status-badge working">Pivoteo</span>
          </div>
          <p className="panel-copy presentation-stage-copy">{stage.summary}</p>
          {renderIterationMeta(iteration)}
          <div className="iteration-details-grid">
            <section className="detail-block technical-block">
              <h4>Operaciones de renglón</h4>
              <ul className="operation-list">
                {iteration.rowOperations.map((operation) => (
                  <li key={`${iteration.iterationNumber}-${operation}`} className="operation-line">{operation}</li>
                ))}
              </ul>
            </section>
            <section className="detail-block reading-block">
              <h4>Explicación didáctica</h4>
              <ul className="explanation-list">
                {iteration.explanation.map((item) => (
                  <li key={`${iteration.iterationNumber}-${item}`} className="explanation-step">{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </section>
      );
    }

    if (stage.kind === 'unbounded') {
      return (
        <section key={stage.id} className={[ 'panel', 'presentation-stage', isActive ? 'active-presentation-stage' : '' ].join(' ').trim()}>
          <div className="panel-header compact-header">
            <div>
              <p className="eyebrow">{stage.eyebrow}</p>
              <h2>{stage.title}</h2>
            </div>
            <span className="status-badge warning">No acotado</span>
          </div>
          <p className="panel-copy presentation-stage-copy">{stage.summary}</p>
          {renderIterationMeta(iteration)}
          <SimplexTable tableau={stage.tableau} iteration={{ pivotColumnIndex: iteration.pivotColumnIndex, ratios: iteration.ratios }} />
          {renderRatios(iteration)}
        </section>
      );
    }

    const negativeObjectiveValues = tableau.rows[0]
      .slice(1, tableau.headers.length - 1)
      .map((value, valueIndex) => ({
        header: tableau.headers[valueIndex + 1],
        value,
      }))
      .filter((item) => item.value < 0);
    const leavingRatio = iteration.ratios.find((ratio) => ratio.basicVariable === iteration.leavingVariable)?.value;

    return (
      <section key={stage.id} className={[ 'panel', 'presentation-stage', isActive ? 'active-presentation-stage' : '' ].join(' ').trim()}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow">{stage.eyebrow}</p>
            <h2>{stage.title}</h2>
          </div>
          <span className={`status-badge ${stage.kind === 'updated' && iteration.isOptimal ? 'optimal' : 'working'}`}>
            {stage.kind === 'updated' && iteration.isOptimal ? 'Óptima' : 'En explicación'}
          </span>
        </div>
        <p className="panel-copy presentation-stage-copy">{stage.summary}</p>
        {renderIterationMeta(iteration)}

        {stage.kind === 'optimality' && negativeObjectiveValues.length > 0 ? (
          <div className="stage-highlight-grid">
            {negativeObjectiveValues.map((item) => (
              <div key={`${stage.id}-${item.header}`} className="detail-block stage-highlight-card">
                <span>Coeficiente negativo en Z</span>
                <strong>{`${item.header} = ${formatNumber(item.value)}`}</strong>
              </div>
            ))}
          </div>
        ) : null}

        {stage.kind === 'entering' ? (
          <div className="stage-highlight-grid">
            <div className="detail-block stage-highlight-card">
              <span>Variable entrante</span>
              <strong>{iteration.enteringVariable ?? 'No aplica'}</strong>
            </div>
            <div className="detail-block stage-highlight-card">
              <span>Criterio</span>
              <strong>Coeficiente más negativo en la fila Z</strong>
            </div>
          </div>
        ) : null}

        {stage.kind === 'leaving' ? (
          <div className="stage-highlight-grid">
            <div className="detail-block stage-highlight-card">
              <span>Variable saliente</span>
              <strong>{iteration.leavingVariable ?? 'No aplica'}</strong>
            </div>
            <div className="detail-block stage-highlight-card">
              <span>Razón mínima positiva</span>
              <strong>{leavingRatio !== null && leavingRatio !== undefined ? formatNumber(leavingRatio) : 'No aplica'}</strong>
            </div>
          </div>
        ) : null}

        {stage.kind === 'pivot' ? (
          <div className="stage-highlight-grid">
            <div className="detail-block stage-highlight-card">
              <span>Elemento pivote</span>
              <strong>{iteration.pivotValue !== undefined ? formatNumber(iteration.pivotValue) : 'No aplica'}</strong>
            </div>
            <div className="detail-block stage-highlight-card">
              <span>Base que se actualiza</span>
              <strong>{`${iteration.leavingVariable ?? 'No aplica'} → ${iteration.enteringVariable ?? 'No aplica'}`}</strong>
            </div>
          </div>
        ) : null}

        <SimplexTable
          tableau={stage.tableau}
          iteration={{
            pivotColumnIndex: stage.kind === 'updated' ? undefined : iteration.pivotColumnIndex,
            pivotRowIndex: stage.kind === 'updated' ? undefined : iteration.pivotRowIndex,
            ratios: iteration.ratios,
          }}
          highlightNegativeObjective={stage.kind === 'optimality'}
        />

        {stage.kind === 'ratios' || stage.kind === 'leaving' ? renderRatios(iteration) : null}

        {stage.kind === 'updated' ? (
          <section className="detail-block reading-block">
            <h4>Lectura del nuevo tablero</h4>
            <ul className="explanation-list">
              {iteration.explanation.map((item) => (
                <li key={`${iteration.iterationNumber}-${item}`} className="explanation-step">{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    );
  };

  return (
    <>
      <section className="panel step-controller-panel section-emphasis">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Secuencia visual</p>
            <h2>Explicación paso a paso</h2>
          </div>
          <span className={`status-badge ${mode === 'idle' ? 'working' : currentStage?.kind === 'solution' ? 'optimal' : 'working'}`}>
            {statusLabel}
          </span>
        </div>

        <p className="panel-copy">
          Avanza como en clase: modelo original, forma aumentada, tablero inicial, prueba de optimalidad, razones, pivoteo y solución final.
        </p>

        <div className="step-summary-grid">
          <div className="detail-block step-summary-card">
            <span>Etapas disponibles</span>
            <strong>{stages.length}</strong>
          </div>
          <div className="detail-block step-summary-card">
            <span>Iteraciones Simplex</span>
            <strong>{Math.max(result.iterations.length - 1, 0)}</strong>
          </div>
          <div className="detail-block step-summary-card">
            <span>Modo actual</span>
            <strong>{mode === 'idle' ? 'Preparado' : mode === 'guided' ? 'Guiado' : 'Mostrar todo'}</strong>
          </div>
        </div>

        <ProgressTimeline
          stages={stages}
          activeIndex={activeStageIndex}
          revealedIndex={revealedIndex}
          idle={mode === 'idle'}
          onSelectStage={handleSelectStage}
        />

        <div className="step-controls-row">
          <button type="button" className="button button-primary" onClick={handleStart}>
            Iniciar explicación paso a paso
          </button>
          <button type="button" className="button button-secondary" onClick={handlePrevious} disabled={mode === 'idle' || activeStageIndex === 0}>
            Anterior
          </button>
          <button type="button" className="button button-secondary" onClick={handleNext} disabled={mode === 'all' || activeStageIndex === lastStageIndex}>
            Siguiente
          </button>
          <button type="button" className="button button-secondary" onClick={handleRestart} disabled={mode === 'idle'}>
            Reiniciar explicación
          </button>
          <button type="button" className="button button-secondary" onClick={handleShowAll}>
            Mostrar todo
          </button>
        </div>
      </section>

      {mode === 'idle' ? (
        <section className="panel empty-panel section-emphasis">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Modo didáctico</p>
              <h2>La explicación se desbloquea por etapas</h2>
            </div>
          </div>
          <div className="empty-state-grid">
            <p>
              Presiona <strong>Iniciar explicación paso a paso</strong> para recorrer la solución como en las diapositivas de clase, o usa <strong>Mostrar todo</strong> si prefieres revisar el procedimiento completo de una vez.
            </p>
            <div className="empty-state-note">
              <strong>Alcance del sprint 1</strong>
              <span>Este primer sprint solo soporta problemas de maximización con restricciones ≤, lado derecho positivo y variables no negativas.</span>
            </div>
          </div>
        </section>
      ) : (
        <div className="step-stage-stack">
          {visibleStages.map((stage, index) => renderStage(stage, index))}
        </div>
      )}
    </>
  );
};

export default StepByStepPlayer;