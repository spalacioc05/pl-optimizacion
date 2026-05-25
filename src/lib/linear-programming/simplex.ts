import type {
  LinearProgrammingProblem,
  RatioDetail,
  SimplexIteration,
  SimplexResult,
  SimplexTableau,
  StepSummary,
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
  formatCanonicalObjectiveFunction,
  formatConstraint,
  formatNumber,
  formatObjectiveFunction,
  getBasicVariableValues,
  getOptimizationVerb,
  mapCanonicalOptimalValueToOriginal,
  minimizationTransformationMessage,
  normalizeNumber,
  ratioValuesForBoard,
  roundForDisplay,
  tableauToBoard,
  toCanonicalMaximizationProblem,
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

const getMostNegativeCoefficient = (
  tableau: SimplexTableau,
): { variable: string; value: number } | undefined => {
  const rhsIndex = tableau.headers.length - 1;
  let selected: { variable: string; value: number } | undefined;

  for (let columnIndex = 1; columnIndex < rhsIndex; columnIndex += 1) {
    const value = tableau.rows[0][columnIndex];
    if (value < -EPSILON && (!selected || value < selected.value)) {
      selected = {
        variable: tableau.headers[columnIndex],
        value: roundForDisplay(value),
      };
    }
  }

  return selected;
};

const buildStepSummary = (
  tableau: SimplexTableau,
  options: {
    reason: string;
    status: string;
    enteringVariable?: string;
    leavingVariable?: string;
    pivotValue?: number;
    pivotRowIndex?: number;
    pivotColumnIndex?: number;
  },
): StepSummary => {
  const basicVariables = tableau.basicVariables.slice(1);
  const allVariables = tableau.headers.slice(1, tableau.headers.length - 1);
  const nonBasicVariables = allVariables.filter((variable) => !basicVariables.includes(variable));
  const solution = allVariables.reduce<Record<string, number>>((accumulator, variable) => {
    const values = getBasicVariableValues(tableau);
    accumulator[variable] = values[variable] ?? 0;
    return accumulator;
  }, {});
  const mostNegative = getMostNegativeCoefficient(tableau);

  return {
    basicVariables,
    nonBasicVariables,
    solution,
    objectiveValue: roundForDisplay(tableau.rows[0][tableau.headers.length - 1]),
    status: options.status,
    reason: options.reason,
    enteringVariable: options.enteringVariable,
    leavingVariable: options.leavingVariable,
    pivotValue: options.pivotValue,
    pivotPosition:
      options.pivotRowIndex !== undefined && options.pivotColumnIndex !== undefined
        ? `${tableau.basicVariables[options.pivotRowIndex]} / ${tableau.headers[options.pivotColumnIndex]}`
        : undefined,
    mostNegativeVariable: mostNegative?.variable,
    mostNegativeValue: mostNegative?.value,
  };
};

export const solveSimplex = (problem: LinearProgrammingProblem): SimplexResult => {
  const canonicalProblem = toCanonicalMaximizationProblem(problem);
  const iterations: SimplexIteration[] = [];
  const initialState = buildInitialState(canonicalProblem);
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
    explanation: buildInitialExplanation(canonicalProblem, initialState.tableau),
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
        optimizationType: problem.optimizationType,
        decisionVariables: {},
        slackVariables: {},
        status: "unbounded",
        message: "El problema es no acotado para el método Simplex normal.",
        augmentedObjective: formatAugmentedObjective(problem),
        augmentedConstraints: problem.constraints.map((constraint, index) =>
          formatAugmentedConstraint(constraint, index),
        ),
        transformationNote:
          problem.optimizationType === "min" ? minimizationTransformationMessage : undefined,
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
  const optimalValue = mapCanonicalOptimalValueToOriginal(problem, solution.optimalValue);

  return {
    iterations,
    optimalValue,
    optimizationType: problem.optimizationType,
    decisionVariables: solution.decisionVariables,
    slackVariables: solution.slackVariables,
    status: "optimal",
    message: [
      buildSolutionInterpretation(
        solution.decisionVariables,
        optimalValue,
        problem.optimizationType,
      ),
      buildSlackInterpretation(solution.slackVariables),
    ].join(" "),
    augmentedObjective: formatAugmentedObjective(problem),
    augmentedConstraints: problem.constraints.map((constraint, index) =>
      formatAugmentedConstraint(constraint, index),
    ),
    transformationNote:
      problem.optimizationType === "min" ? minimizationTransformationMessage : undefined,
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
        problem.optimizationType === "min"
          ? "Primero transformamos la minimización a maximización de -Z y luego convertimos cada restricción ≤ en una igualdad agregando variables de holgura con costo cero para formar la base inicial."
          : "Convertimos cada restricción ≤ en una igualdad agregando variables de holgura con costo cero para formar la base inicial.",
      kind: "augmented",
      operations: [
        ...(problem.optimizationType === "min"
          ? [
              `Modelo original: ${formatObjectiveFunction(problem)}`,
              `Transformación interna: ${formatCanonicalObjectiveFunction(problem)}`,
              minimizationTransformationMessage,
            ]
          : []),
        ...problem.constraints.map((constraint, index) =>
          formatAugmentedConstraint(constraint, index),
        ),
        `${problem.optimizationType === "min" ? "Tablero equivalente" : "Función objetivo aumentada"}: ${formatAugmentedObjective(problem)}`,
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
      tableCaption: "Solución básica factible inicial",
      summary: buildStepSummary(initialIteration.resultTableau, {
        status: "No óptima",
        reason:
          "La base inicial usa variables de holgura. Todavía hay coeficientes negativos en la fila Z, por lo que el método debe iterar.",
      }),
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
        tableCaption: "Antes de seleccionar la variable entrante",
        summary: buildStepSummary(iteration.sourceTableau, {
          status: "No óptima",
          reason:
            iteration.enteringVariable && iteration.pivotColumnIndex !== undefined
              ? `En la fila Z, el coeficiente más negativo es ${formatNumber(
                  iteration.sourceTableau.rows[0][iteration.pivotColumnIndex],
                )}, correspondiente a ${iteration.enteringVariable}.`
              : "Aún existen coeficientes negativos en la fila Z.",
          enteringVariable: iteration.enteringVariable,
          pivotColumnIndex: iteration.pivotColumnIndex,
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
        tableCaption: "La columna pivote queda resaltada",
        summary: buildStepSummary(iteration.sourceTableau, {
          status: "Selección de variable entrante",
          reason:
            iteration.enteringVariable && iteration.pivotColumnIndex !== undefined
              ? `En la fila Z, el coeficiente más negativo es ${formatNumber(
                  iteration.sourceTableau.rows[0][iteration.pivotColumnIndex],
                )}, correspondiente a ${iteration.enteringVariable}. Por eso ${iteration.enteringVariable} entra a la base.`
              : "Se elige la variable con el coeficiente más negativo en la fila Z.",
          enteringVariable: iteration.enteringVariable,
          pivotColumnIndex: iteration.pivotColumnIndex,
        }),
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
        tableCaption: "Se usan solo coeficientes positivos de la columna pivote",
        summary: buildStepSummary(iteration.sourceTableau, {
          status: "Cálculo de razones",
          reason: `Calculamos las razones LD / ${iteration.enteringVariable} para conservar la factibilidad y detectar la fila pivote.`,
          enteringVariable: iteration.enteringVariable,
          pivotColumnIndex: iteration.pivotColumnIndex,
          leavingVariable: iteration.leavingVariable,
          pivotRowIndex: iteration.pivotRowIndex,
        }),
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
        tableCaption: "No existe fila pivote válida",
        summary: buildStepSummary(iteration.sourceTableau, {
          status: "No acotado",
          reason:
            "No hay coeficientes positivos en la columna pivote, así que no existe una variable saliente que mantenga la factibilidad.",
          enteringVariable: iteration.enteringVariable,
          pivotColumnIndex: iteration.pivotColumnIndex,
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
        tableCaption: "La menor razón positiva define la fila pivote",
        summary: buildStepSummary(iteration.sourceTableau, {
          status: "Selección de variable saliente",
          reason:
            iteration.leavingVariable && iteration.enteringVariable
              ? `${iteration.leavingVariable} tiene la menor razón positiva en la columna ${iteration.enteringVariable}, por eso sale de la base.`
              : "La menor razón positiva determina la variable saliente.",
          enteringVariable: iteration.enteringVariable,
          leavingVariable: iteration.leavingVariable,
          pivotColumnIndex: iteration.pivotColumnIndex,
          pivotRowIndex: iteration.pivotRowIndex,
        }),
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
        tableCaption: "El pivote es la intersección entre fila y columna pivote",
        summary: buildStepSummary(iteration.sourceTableau, {
          status: "Elemento pivote identificado",
          reason:
            iteration.pivotValue !== undefined &&
            iteration.enteringVariable &&
            iteration.leavingVariable
              ? `El pivote es ${formatNumber(iteration.pivotValue)}, ubicado en la fila ${iteration.leavingVariable} y columna ${iteration.enteringVariable}.`
              : "Se identifica el elemento pivote antes de operar el tablero.",
          enteringVariable: iteration.enteringVariable,
          leavingVariable: iteration.leavingVariable,
          pivotValue: iteration.pivotValue,
          pivotColumnIndex: iteration.pivotColumnIndex,
          pivotRowIndex: iteration.pivotRowIndex,
        }),
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
        comparison: {
          before: tableauToBoard(iteration.sourceTableau, {
            pivotColumnIndex: iteration.pivotColumnIndex,
            pivotRowIndex: iteration.pivotRowIndex,
            ratios,
          }),
          after: tableauToBoard(iteration.resultTableau),
          beforeCaption: "Tablero antes del pivoteo",
          afterCaption: "Tablero después del pivoteo",
        },
        summary: buildStepSummary(iteration.sourceTableau, {
          status: "Operaciones de renglón",
          reason:
            iteration.pivotValue !== undefined
              ? `Dividimos la fila pivote entre ${formatNumber(iteration.pivotValue)} y luego hacemos ceros en el resto de la columna pivote.`
              : "Se actualiza el tablero mediante operaciones elementales de renglón.",
          enteringVariable: iteration.enteringVariable,
          leavingVariable: iteration.leavingVariable,
          pivotValue: iteration.pivotValue,
          pivotColumnIndex: iteration.pivotColumnIndex,
          pivotRowIndex: iteration.pivotRowIndex,
        }),
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
        tableCaption:
          iteration.status === "optimal"
            ? "Tablero actualizado y óptimo"
            : "Tablero actualizado para la siguiente iteración",
        summary: buildStepSummary(iteration.resultTableau, {
          status: iteration.status === "optimal" ? "Óptima" : "Factible mejorada",
          reason:
            iteration.status === "optimal"
              ? "Ya no hay coeficientes negativos en la fila Z, así que el método se detiene con una solución óptima."
              : "La base se actualizó, pero todavía quedan coeficientes negativos en la fila Z.",
        }),
      },
    );
  }

  steps.push({
    id: "final",
    title: "Paso final — Solución óptima",
    subtitle:
      result.status === "optimal" ? "Todos los coeficientes en Z son no negativos" : "Estado final",
    explanation:
      result.transformationNote && result.status === "optimal"
        ? `${result.transformationNote} ${result.message}`
        : result.message,
    kind: "final",
    table:
      result.iterations.length > 0
        ? tableauToBoard(result.iterations[result.iterations.length - 1].resultTableau)
        : undefined,
    tableCaption: "Tablero final",
    summary:
      result.iterations.length > 0
        ? buildStepSummary(result.iterations[result.iterations.length - 1].resultTableau, {
            status: result.status === "optimal" ? "Óptima" : "Estado final",
            reason: result.message,
          })
        : undefined,
  });

  return steps;
};

export const buildOriginalModelLines = (problem: LinearProgrammingProblem): string[] => [
  formatObjectiveFunction(problem),
  ...(problem.optimizationType === "min"
    ? [formatCanonicalObjectiveFunction(problem), minimizationTransformationMessage]
    : []),
  ...problem.constraints.map((constraint) => formatConstraint(constraint)),
  `Objetivo: ${getOptimizationVerb(problem.optimizationType)} Z con variables no negativas.`,
  `X${problem.objectiveCoefficients.length > 1 ? "i" : "1"} >= 0 para toda variable.`,
];
