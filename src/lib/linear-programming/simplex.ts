import type {
  LinearProgrammingProblem,
  RatioDetail,
  SimplexIteration,
  SimplexResult,
  SimplexTableau,
  SolverStep,
} from "@/lib/linear-programming/types";
import {
  EPSILON,
  buildSlackInterpretation,
  buildSolutionInterpretation,
  buildVariableNames,
  cloneTableau,
  formatAugmentedConstraint,
  formatAugmentedObjective,
  formatConstraint,
  formatNumber,
  formatObjectiveFunction,
  getBasicVariableValues,
  normalizeNumber,
  ratioValuesForBoard,
  roundForDisplay,
  tableauToBoard,
} from "@/lib/linear-programming/utils";

interface TableauState {
  tableau: SimplexTableau;
  basisIndices: number[];
}

const buildInitialState = (problem: LinearProgrammingProblem): TableauState => {
  const variableCount = problem.objectiveCoefficients.length;
  const constraintCount = problem.constraints.length;
  const decisionVariables = buildVariableNames("X", variableCount);
  const slackVariables = buildVariableNames("S", constraintCount);
  const headers = ["Z", ...decisionVariables, ...slackVariables, "LD"];

  const rows: number[][] = [];
  rows.push([
    1,
    ...problem.objectiveCoefficients.map((coefficient) => -coefficient),
    ...Array.from({ length: constraintCount }, () => 0),
    0,
  ]);

  problem.constraints.forEach((constraint, rowIndex) => {
    const slackEntries = Array.from({ length: constraintCount }, (_, slackIndex) =>
      slackIndex === rowIndex ? 1 : 0,
    );
    rows.push([0, ...constraint.coefficients, ...slackEntries, constraint.rhs]);
  });

  return {
    tableau: {
      headers,
      basicVariables: ["Z", ...slackVariables],
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
  const rawRatios = tableau.rows.slice(1).map((row, rowIndex) => {
    const pivotColumnValue = row[pivotColumnIndex];
    const rhs = row[rhsIndex];

    if (pivotColumnValue <= EPSILON) {
      return {
        basicVariable: tableau.basicVariables[rowIndex + 1],
        value: null,
        expression: `${formatNumber(rhs)} / ${formatNumber(pivotColumnValue)} no aplica`,
        isMinimum: false,
      };
    }

    const value = roundForDisplay(rhs / pivotColumnValue);
    return {
      basicVariable: tableau.basicVariables[rowIndex + 1],
      value,
      expression: `${formatNumber(rhs)} / ${formatNumber(pivotColumnValue)} = ${formatNumber(rhs / pivotColumnValue)}`,
      isMinimum: false,
    };
  });

  const positiveValues = rawRatios
    .map((ratio) => ratio.value)
    .filter((value): value is number => value !== null);
  const minimum = positiveValues.length > 0 ? Math.min(...positiveValues) : null;

  return rawRatios.map((ratio) => ({
    ...ratio,
    isMinimum:
      minimum !== null && ratio.value !== null && Math.abs(ratio.value - minimum) < EPSILON,
  }));
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

  tableau.rows[pivotRowIndex] = tableau.rows[pivotRowIndex].map((value) =>
    normalizeNumber(value / pivotValue),
  );
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
    tableau.rows[rowIndex] = row.map((value, columnIndex) =>
      normalizeNumber(value - factor * tableau.rows[pivotRowIndex][columnIndex]),
    );

    const signal = factor > 0 ? "-" : "+";
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
  const decisionVariables = buildVariableNames("X", decisionCount).reduce<Record<string, number>>(
    (accumulator, variable) => {
      accumulator[variable] = values[variable] ?? 0;
      return accumulator;
    },
    {},
  );
  const slackVariables = buildVariableNames("S", slackCount).reduce<Record<string, number>>(
    (accumulator, variable) => {
      accumulator[variable] = values[variable] ?? 0;
      return accumulator;
    },
    {},
  );

  return {
    decisionVariables,
    slackVariables,
    optimalValue: roundForDisplay(tableau.rows[0][tableau.headers.length - 1]),
  };
};

const buildInitialExplanation = (
  problem: LinearProgrammingProblem,
  tableau: SimplexTableau,
): string[] => {
  const rhsIndex = tableau.headers.length - 1;
  const basicSolution = tableau.basicVariables
    .slice(1)
    .map(
      (basicVariable, rowIndex) =>
        `${basicVariable} = ${formatNumber(tableau.rows[rowIndex + 1][rhsIndex])}`,
    );

  return [
    "La solución básica factible inicial usa las variables de holgura como variables básicas.",
    `Las variables de decisión empiezan en cero: ${buildVariableNames(
      "X",
      problem.objectiveCoefficients.length,
    )
      .map((name) => `${name} = 0`)
      .join(", ")}.`,
    `Las variables básicas iniciales son: ${basicSolution.join(", ")}.`,
    "Como existen coeficientes negativos en la fila Z, la solución aún no es óptima.",
  ];
};

export const solveSimplex = (problem: LinearProgrammingProblem): SimplexResult => {
  const iterations: SimplexIteration[] = [];
  const initialState = buildInitialState(problem);
  const initialTableau = cloneTableau(initialState.tableau);

  iterations.push({
    iterationNumber: 0,
    sourceTableau: initialTableau,
    resultTableau: initialTableau,
    ratios: initialState.tableau.basicVariables.slice(1).map((basicVariable) => ({
      basicVariable,
      value: null,
      expression: "La razón se calcula cuando ya existe una columna pivote.",
      isMinimum: false,
    })),
    rowOperations: [],
    explanation: buildInitialExplanation(problem, initialState.tableau),
    status: hasNegativeInObjective(initialState.tableau) ? "initial" : "optimal",
    statusLabel: "Solución básica factible inicial",
  });

  let currentState = initialState;
  let iterationNumber = 1;

  while (hasNegativeInObjective(currentState.tableau)) {
    const pivotColumnIndex = getEnteringColumnIndex(currentState.tableau);
    const enteringVariable = currentState.tableau.headers[pivotColumnIndex];
    const ratios = buildRatioDetails(currentState.tableau, pivotColumnIndex);
    const pivotRowIndex = getLeavingRowIndex(ratios);
    const sourceTableau = cloneTableau(currentState.tableau);

    if (pivotRowIndex === null) {
      const explanation = [
        `La variable que entra es ${enteringVariable} porque tiene el coeficiente más negativo en la fila Z.`,
        "Ninguna fila de restricción tiene coeficiente positivo en la columna pivote, por lo tanto el problema es no acotado.",
      ];

      iterations.push({
        iterationNumber,
        sourceTableau,
        resultTableau: sourceTableau,
        enteringVariable,
        pivotColumnIndex,
        ratios,
        rowOperations: [],
        explanation,
        status: "unbounded",
        statusLabel: "Problema no acotado",
      });

      return {
        iterations,
        optimalValue: 0,
        decisionVariables: {},
        slackVariables: {},
        status: "unbounded",
        message: "El problema es no acotado para el método Simplex normal.",
        augmentedObjective: formatAugmentedObjective(problem),
        augmentedConstraints: problem.constraints.map((constraint, index) =>
          formatAugmentedConstraint(constraint, index),
        ),
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

    const { nextState, rowOperations } = pivotTableau(
      currentState,
      pivotRowIndex,
      pivotColumnIndex,
    );
    const isOptimal = !hasNegativeInObjective(nextState.tableau);
    if (isOptimal) {
      explanation.push(
        "Después de actualizar el tablero, ya no hay coeficientes negativos en la fila Z. La solución es óptima.",
      );
    } else {
      explanation.push(
        "Después de actualizar el tablero, aún quedan coeficientes negativos en la fila Z y se requiere otra iteración.",
      );
    }

    iterations.push({
      iterationNumber,
      sourceTableau,
      resultTableau: cloneTableau(nextState.tableau),
      enteringVariable,
      leavingVariable,
      pivotColumnIndex,
      pivotRowIndex,
      pivotValue: roundForDisplay(pivotValue),
      ratios,
      rowOperations,
      explanation,
      status: isOptimal ? "optimal" : "processing",
      statusLabel: isOptimal ? "Iteración óptima" : "Iteración de mejora",
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
    status: "optimal",
    message: [
      buildSolutionInterpretation(solution.decisionVariables, solution.optimalValue),
      buildSlackInterpretation(solution.slackVariables),
    ].join(" "),
    augmentedObjective: formatAugmentedObjective(problem),
    augmentedConstraints: problem.constraints.map((constraint, index) =>
      formatAugmentedConstraint(constraint, index),
    ),
  };
};

export const buildSimplexSteps = (
  problem: LinearProgrammingProblem,
  result: SimplexResult,
): SolverStep[] => {
  const steps: SolverStep[] = [
    {
      id: "model",
      title: "Paso 1 — Modelo original",
      subtitle: "Planteamiento del problema",
      explanation:
        "Comenzamos con la formulación matemática del problema. El usuario ingresa el modelo en forma básica, sin holguras y antes de construir el tablero Simplex.",
      kind: "model",
    },
    {
      id: "augmented",
      title: "Paso 2 — Forma aumentada",
      subtitle: "Introducción de variables de holgura",
      explanation:
        "Convertimos cada restricción ≤ en una igualdad agregando variables de holgura con costo cero para formar la base inicial.",
      kind: "augmented",
      operations: [
        ...problem.constraints.map((constraint, index) =>
          formatAugmentedConstraint(constraint, index),
        ),
        formatAugmentedObjective(problem),
      ],
    },
  ];

  const initialIteration = result.iterations[0];
  if (initialIteration) {
    steps.push({
      id: "tableau-initial",
      title: "Paso 3 — Tablero inicial",
      subtitle: "Iteración 0",
      explanation:
        "Las variables de holgura forman la base inicial. Desde este tablero se verifica la optimalidad y se decide si el método debe continuar.",
      kind: "tableau",
      table: tableauToBoard(initialIteration.resultTableau),
    });
  }

  for (let index = 1; index < result.iterations.length; index += 1) {
    const iteration = result.iterations[index];
    const ratios = ratioValuesForBoard(iteration.ratios, iteration.sourceTableau.rows.length);

    steps.push(
      {
        id: `optimality-${iteration.iterationNumber}`,
        title: `Iteración ${iteration.iterationNumber} — Prueba de optimalidad`,
        subtitle: "Revisión de la fila Z",
        explanation:
          "Se revisa la fila Z. Si existe algún coeficiente negativo, todavía se puede mejorar el valor de la función objetivo.",
        kind: "optimality",
        table: tableauToBoard(iteration.sourceTableau, {
          pivotColumnIndex: iteration.pivotColumnIndex,
          ratios,
        }),
      },
      {
        id: `entering-${iteration.iterationNumber}`,
        title: `Iteración ${iteration.iterationNumber} — Variable que entra`,
        subtitle: "Selección de columna pivote",
        explanation:
          iteration.explanation[0] ??
          "Se elige la variable con el coeficiente más negativo en la fila Z.",
        kind: "entering",
        table: tableauToBoard(iteration.sourceTableau, {
          pivotColumnIndex: iteration.pivotColumnIndex,
          ratios,
        }),
        highlights: { entering: iteration.enteringVariable },
      },
      {
        id: `ratios-${iteration.iterationNumber}`,
        title: `Iteración ${iteration.iterationNumber} — Cálculo de razones`,
        subtitle: "LD / coeficiente positivo de la columna pivote",
        explanation:
          iteration.explanation[1] ?? "Se calculan las razones para conservar la factibilidad.",
        kind: "ratios",
        table: tableauToBoard(iteration.sourceTableau, {
          pivotColumnIndex: iteration.pivotColumnIndex,
          pivotRowIndex: iteration.pivotRowIndex,
          ratios,
        }),
        ratios: iteration.ratios.map((ratio) => ({
          row: ratio.basicVariable,
          value: ratio.expression,
          min: ratio.isMinimum,
        })),
      },
    );

    if (iteration.status === "unbounded") {
      steps.push({
        id: `unbounded-${iteration.iterationNumber}`,
        title: `Iteración ${iteration.iterationNumber} — Problema no acotado`,
        subtitle: "No existe variable saliente válida",
        explanation: iteration.explanation.join(" "),
        kind: "unbounded",
        table: tableauToBoard(iteration.sourceTableau, {
          pivotColumnIndex: iteration.pivotColumnIndex,
          ratios,
        }),
      });
      break;
    }

    steps.push(
      {
        id: `leaving-${iteration.iterationNumber}`,
        title: `Iteración ${iteration.iterationNumber} — Variable que sale`,
        subtitle: "Selección de fila pivote",
        explanation:
          iteration.explanation[2] ?? "Sale la variable asociada a la menor razón positiva.",
        kind: "leaving",
        table: tableauToBoard(iteration.sourceTableau, {
          pivotColumnIndex: iteration.pivotColumnIndex,
          pivotRowIndex: iteration.pivotRowIndex,
          ratios,
        }),
        ratios: iteration.ratios.map((ratio) => ({
          row: ratio.basicVariable,
          value: ratio.expression,
          min: ratio.isMinimum,
        })),
        highlights: {
          entering: iteration.enteringVariable,
          leaving: iteration.leavingVariable,
        },
      },
      {
        id: `pivot-${iteration.iterationNumber}`,
        title: `Iteración ${iteration.iterationNumber} — Elemento pivote`,
        subtitle: "Intersección entre fila y columna pivote",
        explanation:
          iteration.explanation[3] ?? "El elemento pivote define el renglón que se normaliza.",
        kind: "pivot",
        table: tableauToBoard(iteration.sourceTableau, {
          pivotColumnIndex: iteration.pivotColumnIndex,
          pivotRowIndex: iteration.pivotRowIndex,
          ratios,
        }),
        highlights: {
          entering: iteration.enteringVariable,
          leaving: iteration.leavingVariable,
          pivot: iteration.pivotValue,
        },
      },
      {
        id: `operations-${iteration.iterationNumber}`,
        title: `Iteración ${iteration.iterationNumber} — Operaciones de renglón`,
        subtitle: "Pivoteo y actualización del tablero",
        explanation:
          iteration.explanation[4] ??
          "Se normaliza la fila pivote y se hacen ceros en el resto de la columna pivote.",
        kind: "operations",
        operations: iteration.rowOperations,
      },
      {
        id: `new-tableau-${iteration.iterationNumber}`,
        title: `Iteración ${iteration.iterationNumber} — Nuevo tablero`,
        subtitle:
          iteration.status === "optimal" ? "Se alcanza la solución óptima" : "El método continúa",
        explanation:
          iteration.explanation[iteration.explanation.length - 1] ??
          "Se analiza el tablero actualizado.",
        kind: "newTableau",
        table: tableauToBoard(iteration.resultTableau),
      },
    );
  }

  steps.push({
    id: "final",
    title: "Paso final — Solución óptima",
    subtitle:
      result.status === "optimal" ? "Todos los coeficientes en Z son no negativos" : "Estado final",
    explanation: result.message,
    kind: "final",
    table:
      result.iterations.length > 0
        ? tableauToBoard(result.iterations[result.iterations.length - 1].resultTableau)
        : undefined,
  });

  return steps;
};

export const buildOriginalModelLines = (problem: LinearProgrammingProblem): string[] => [
  formatObjectiveFunction(problem),
  ...problem.constraints.map((constraint) => formatConstraint(constraint)),
  `X${problem.objectiveCoefficients.length > 1 ? "i" : "1"} >= 0 para toda variable.`,
];
