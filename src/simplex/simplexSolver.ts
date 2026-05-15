import {
  LinearProgrammingProblem,
  RatioDetail,
  SimplexIteration,
  SimplexResult,
  SimplexTableau,
} from './simplexTypes';
import {
  EPSILON,
  buildSlackInterpretation,
  buildSolutionInterpretation,
  buildVariableNames,
  cloneTableau,
  formatAugmentedConstraint,
  formatAugmentedObjective,
  formatNumber,
  getBasicVariableValues,
  normalizeNumber,
  roundForDisplay,
} from './simplexUtils';

interface TableauState {
  tableau: SimplexTableau;
  basisIndices: number[];
}

const buildInitialState = (problem: LinearProgrammingProblem): TableauState => {
  const variableCount = problem.objectiveCoefficients.length;
  const constraintCount = problem.constraints.length;
  const decisionVariables = buildVariableNames('X', variableCount);
  const slackVariables = buildVariableNames('S', constraintCount);
  const headers = ['Z', ...decisionVariables, ...slackVariables, 'LD'];

  const rows: number[][] = [];
  rows.push([
    1,
    ...problem.objectiveCoefficients.map((coefficient) => -coefficient),
    ...Array.from({ length: constraintCount }, () => 0),
    0,
  ]);

  problem.constraints.forEach((constraint, rowIndex) => {
    const slackEntries = Array.from({ length: constraintCount }, (_, slackIndex) => (slackIndex === rowIndex ? 1 : 0));
    rows.push([0, ...constraint.coefficients, ...slackEntries, constraint.rhs]);
  });

  return {
    tableau: {
      headers,
      basicVariables: ['Z', ...slackVariables],
      rows,
    },
    basisIndices: Array.from({ length: constraintCount }, (_, index) => 1 + variableCount + index),
  };
};

const hasNegativeInObjective = (tableau: SimplexTableau): boolean => {
  const rhsIndex = tableau.headers.length - 1;
  return tableau.rows[0].slice(1, rhsIndex).some((value) => value < -EPSILON);
};

const getEnteringColumnIndex = (tableau: SimplexTableau): number => {
  const rhsIndex = tableau.headers.length - 1;
  let selectedIndex = 1;
  let minimumValue = tableau.rows[0][1];

  for (let columnIndex = 2; columnIndex < rhsIndex; columnIndex += 1) {
    const currentValue = tableau.rows[0][columnIndex];
    if (currentValue < minimumValue - EPSILON) {
      minimumValue = currentValue;
      selectedIndex = columnIndex;
    }
  }

  return selectedIndex;
};

const buildRatioDetails = (tableau: SimplexTableau, pivotColumnIndex: number): RatioDetail[] => {
  const rhsIndex = tableau.headers.length - 1;

  return tableau.rows.slice(1).map((row, rowIndex) => {
    const pivotColumnValue = row[pivotColumnIndex];
    const rhs = row[rhsIndex];

    if (pivotColumnValue <= EPSILON) {
      return {
        basicVariable: tableau.basicVariables[rowIndex + 1],
        value: null,
        expression: `${formatNumber(rhs)} / ${formatNumber(pivotColumnValue)} no aplica`,
      };
    }

    return {
      basicVariable: tableau.basicVariables[rowIndex + 1],
      value: roundForDisplay(rhs / pivotColumnValue),
      expression: `${formatNumber(rhs)} / ${formatNumber(pivotColumnValue)} = ${formatNumber(rhs / pivotColumnValue)}`,
    };
  });
};

const getLeavingRowIndex = (ratios: RatioDetail[]): number | null => {
  let selectedRow: number | null = null;
  let minimumRatio = Number.POSITIVE_INFINITY;

  ratios.forEach((ratio, rowIndex) => {
    if (ratio.value !== null && ratio.value < minimumRatio - EPSILON) {
      minimumRatio = ratio.value;
      selectedRow = rowIndex + 1;
    }
  });

  return selectedRow;
};

const pivotTableau = (
  state: TableauState,
  pivotRowIndex: number,
  pivotColumnIndex: number,
): { nextState: TableauState; rowOperations: string[] } => {
  const tableau = cloneTableau(state.tableau);
  const pivotValue = tableau.rows[pivotRowIndex][pivotColumnIndex];
  const rowOperations: string[] = [];
  const pivotRowLabel = tableau.basicVariables[pivotRowIndex];

  tableau.rows[pivotRowIndex] = tableau.rows[pivotRowIndex].map((value) => normalizeNumber(value / pivotValue));
  rowOperations.push(`${pivotRowLabel} = ${pivotRowLabel} / ${formatNumber(pivotValue)}`);

  tableau.rows.forEach((row, rowIndex) => {
    if (rowIndex === pivotRowIndex) {
      return;
    }

    const factor = row[pivotColumnIndex];
    if (Math.abs(factor) < EPSILON) {
      return;
    }

    const rowLabel = tableau.basicVariables[rowIndex];
    tableau.rows[rowIndex] = row.map(
      (value, columnIndex) => normalizeNumber(value - factor * tableau.rows[pivotRowIndex][columnIndex]),
    );

    const signal = factor > 0 ? '-' : '+';
    rowOperations.push(
      `${rowLabel} = ${rowLabel} ${signal} ${formatNumber(Math.abs(factor))} * ${tableau.headers[pivotColumnIndex]}(fila pivote)`,
    );
  });

  tableau.basicVariables[pivotRowIndex] = tableau.headers[pivotColumnIndex];
  const nextBasisIndices = [...state.basisIndices];
  nextBasisIndices[pivotRowIndex - 1] = pivotColumnIndex;

  return {
    nextState: {
      tableau,
      basisIndices: nextBasisIndices,
    },
    rowOperations,
  };
};

const extractSolution = (tableau: SimplexTableau, decisionCount: number, slackCount: number) => {
  const values = getBasicVariableValues(tableau);
  const decisionVariables = buildVariableNames('X', decisionCount).reduce<Record<string, number>>((accumulator, variable) => {
    accumulator[variable] = values[variable] ?? 0;
    return accumulator;
  }, {});
  const slackVariables = buildVariableNames('S', slackCount).reduce<Record<string, number>>((accumulator, variable) => {
    accumulator[variable] = values[variable] ?? 0;
    return accumulator;
  }, {});

  return {
    decisionVariables,
    slackVariables,
    optimalValue: roundForDisplay(tableau.rows[0][tableau.headers.length - 1]),
  };
};

const buildInitialExplanation = (problem: LinearProgrammingProblem, tableau: SimplexTableau): string[] => {
  const rhsIndex = tableau.headers.length - 1;
  const basicSolution = tableau.basicVariables.slice(1).map((basicVariable, rowIndex) => (
    `${basicVariable} = ${formatNumber(tableau.rows[rowIndex + 1][rhsIndex])}`
  ));

  return [
    'La solución básica factible inicial usa las variables de holgura como variables básicas.',
    `Las variables de decisión empiezan en cero: ${buildVariableNames('X', problem.objectiveCoefficients.length).map((name) => `${name} = 0`).join(', ')}.`,
    `Las variables básicas iniciales son: ${basicSolution.join(', ')}.`,
    'Como existen coeficientes negativos en la fila Z, la solución aún no es óptima.',
  ];
};

export const solveSimplex = (problem: LinearProgrammingProblem): SimplexResult => {
  const iterations: SimplexIteration[] = [];
  const initialState = buildInitialState(problem);

  iterations.push({
    iterationNumber: 0,
    tableau: cloneTableau(initialState.tableau),
    ratios: initialState.tableau.basicVariables.slice(1).map((basicVariable) => ({
      basicVariable,
      value: null,
      expression: 'La razón se calcula cuando ya existe una columna pivote.',
    })),
    rowOperations: [],
    explanation: buildInitialExplanation(problem, initialState.tableau),
    isOptimal: false,
    statusLabel: 'Solución básica factible inicial',
  });

  let currentState = initialState;
  let iterationNumber = 1;

  while (hasNegativeInObjective(currentState.tableau)) {
    const pivotColumnIndex = getEnteringColumnIndex(currentState.tableau);
    const enteringVariable = currentState.tableau.headers[pivotColumnIndex];
    const ratios = buildRatioDetails(currentState.tableau, pivotColumnIndex);
    const pivotRowIndex = getLeavingRowIndex(ratios);

    if (pivotRowIndex === null) {
      const explanation = [
        `La variable que entra es ${enteringVariable} porque tiene el coeficiente más negativo en la fila Z.`,
        'Ninguna fila de restricción tiene coeficiente positivo en la columna pivote, por lo tanto el problema es no acotado.',
      ];

      iterations.push({
        iterationNumber,
        tableau: cloneTableau(currentState.tableau),
        enteringVariable,
        pivotColumnIndex,
        ratios,
        rowOperations: [],
        explanation,
        isOptimal: false,
        statusLabel: 'Problema no acotado',
      });

      return {
        iterations,
        optimalValue: 0,
        decisionVariables: {},
        slackVariables: {},
        status: 'unbounded',
        message: 'El problema es no acotado para el método Simplex normal.',
        augmentedObjective: formatAugmentedObjective(problem),
        augmentedConstraints: problem.constraints.map((constraint, index) => formatAugmentedConstraint(constraint, index)),
      };
    }

    const leavingVariable = currentState.tableau.basicVariables[pivotRowIndex];
    const pivotValue = currentState.tableau.rows[pivotRowIndex][pivotColumnIndex];
    const explanation = [
      `En esta iteración, la variable que entra es ${enteringVariable} porque tiene el coeficiente más negativo en la fila Z: ${formatNumber(currentState.tableau.rows[0][pivotColumnIndex])}.`,
      `Calculamos las razones usando la columna ${enteringVariable}.`,
      `Sale ${leavingVariable} porque tiene la menor razón positiva.`,
      `El elemento pivote es ${formatNumber(pivotValue)}.`,
      `Normalizamos la fila pivote y luego hacemos cero el resto de la columna ${enteringVariable}.`,
    ];

    const { nextState, rowOperations } = pivotTableau(currentState, pivotRowIndex, pivotColumnIndex);
    const isOptimal = !hasNegativeInObjective(nextState.tableau);
    if (isOptimal) {
      explanation.push('Después de actualizar el tablero, ya no hay coeficientes negativos en la fila Z. La solución es óptima.');
    } else {
      explanation.push('Después de actualizar el tablero, aún quedan coeficientes negativos en la fila Z y se requiere otra iteración.');
    }

    iterations.push({
      iterationNumber,
      tableau: cloneTableau(nextState.tableau),
      enteringVariable,
      leavingVariable,
      pivotColumnIndex,
      pivotRowIndex,
      pivotValue: roundForDisplay(pivotValue),
      ratios,
      rowOperations,
      explanation,
      isOptimal,
      statusLabel: isOptimal ? 'Iteración óptima' : 'Iteración de mejora',
    });

    currentState = nextState;
    iterationNumber += 1;
  }

  const solution = extractSolution(
    currentState.tableau,
    problem.objectiveCoefficients.length,
    problem.constraints.length,
  );

  return {
    iterations,
    optimalValue: solution.optimalValue,
    decisionVariables: solution.decisionVariables,
    slackVariables: solution.slackVariables,
    status: 'optimal',
    message: [
      buildSolutionInterpretation(solution.decisionVariables, solution.optimalValue),
      buildSlackInterpretation(solution.slackVariables),
    ].join(' '),
    augmentedObjective: formatAugmentedObjective(problem),
    augmentedConstraints: problem.constraints.map((constraint, index) => formatAugmentedConstraint(constraint, index)),
  };
};
