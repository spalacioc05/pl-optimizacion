import type {
  LinearProgrammingProblem,
  MatrixTable,
  SensitivityAnalysis,
  SensitivityBasicSolutionRow,
  SensitivityInterpretationRow,
  SensitivityMatrixData,
  SimplexResult,
  VectorTable,
} from "@/lib/linear-programming/types";
import {
  EPSILON,
  buildVariableNames,
  formatNumber,
  normalizeNumber,
  roundForDisplay,
  toCanonicalMaximizationProblem,
} from "@/lib/linear-programming/utils";

const createEmptyMatrixTable = (title: string): MatrixTable => ({
  title,
  rowLabels: [],
  columnLabels: [],
  values: [],
});

const createEmptyVectorTable = (title: string): VectorTable => ({
  title,
  labels: [],
  values: [],
});

const createUnavailableMatrixData = (message: string): SensitivityMatrixData => ({
  available: false,
  message,
  augmentedMatrix: createEmptyMatrixTable("Matriz aumentada A_aug = [A | I]"),
  basisMatrix: createEmptyMatrixTable("Matriz base B"),
  basisInverse: createEmptyMatrixTable("Inversa de la base B⁻¹"),
  basicCosts: createEmptyVectorTable("Vector Cb"),
  rhsVector: createEmptyVectorTable("Vector b"),
  basicSolution: createEmptyVectorTable("Solución básica Xb = B⁻¹b"),
  shadowPrices: createEmptyVectorTable("Vector de precios sombra π"),
});

const cleanNumber = (value: number): number => roundForDisplay(normalizeNumber(value));

const matrixToRoundedValues = (matrix: number[][]): number[][] =>
  matrix.map((row) => row.map((value) => cleanNumber(value)));

const vectorToRoundedValues = (vector: number[]): number[] =>
  vector.map((value) => cleanNumber(value));

const buildAugmentedMatrix = (problem: LinearProgrammingProblem) => {
  const decisionCount = problem.objectiveCoefficients.length;
  const constraintCount = problem.constraints.length;
  const decisionVariables = buildVariableNames("X", decisionCount);
  const slackVariables = buildVariableNames("S", constraintCount);
  const rowLabels = buildVariableNames("S", constraintCount).map((_, index) => `R${index + 1}`);
  const values = problem.constraints.map((constraint, rowIndex) => [
    ...constraint.coefficients,
    ...Array.from({ length: constraintCount }, (_, slackIndex) =>
      slackIndex === rowIndex ? 1 : 0,
    ),
  ]);

  return {
    columnLabels: [...decisionVariables, ...slackVariables],
    rowLabels,
    values,
  };
};

const invertMatrix = (matrix: number[][]): number[][] | null => {
  const size = matrix.length;

  if (size === 0 || matrix.some((row) => row.length !== size)) {
    return null;
  }

  const augmented = matrix.map((row, rowIndex) => [
    ...row.map((value) => normalizeNumber(value)),
    ...Array.from({ length: size }, (_, columnIndex) => (rowIndex === columnIndex ? 1 : 0)),
  ]);

  for (let columnIndex = 0; columnIndex < size; columnIndex += 1) {
    let pivotRowIndex = columnIndex;

    for (let rowIndex = columnIndex; rowIndex < size; rowIndex += 1) {
      if (
        Math.abs(augmented[rowIndex][columnIndex]) > Math.abs(augmented[pivotRowIndex][columnIndex])
      ) {
        pivotRowIndex = rowIndex;
      }
    }

    if (Math.abs(augmented[pivotRowIndex][columnIndex]) < EPSILON) {
      return null;
    }

    if (pivotRowIndex !== columnIndex) {
      [augmented[columnIndex], augmented[pivotRowIndex]] = [
        augmented[pivotRowIndex],
        augmented[columnIndex],
      ];
    }

    const pivotValue = augmented[columnIndex][columnIndex];
    for (let currentColumn = 0; currentColumn < size * 2; currentColumn += 1) {
      augmented[columnIndex][currentColumn] = normalizeNumber(
        augmented[columnIndex][currentColumn] / pivotValue,
      );
    }

    for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
      if (rowIndex === columnIndex) {
        continue;
      }

      const factor = augmented[rowIndex][columnIndex];
      if (Math.abs(factor) < EPSILON) {
        continue;
      }

      for (let currentColumn = 0; currentColumn < size * 2; currentColumn += 1) {
        augmented[rowIndex][currentColumn] = normalizeNumber(
          augmented[rowIndex][currentColumn] - factor * augmented[columnIndex][currentColumn],
        );
      }
    }
  }

  return augmented.map((row) => row.slice(size).map((value) => normalizeNumber(value)));
};

const multiplyMatrixVector = (matrix: number[][], vector: number[]): number[] =>
  matrix.map((row) =>
    normalizeNumber(row.reduce((sum, value, index) => sum + value * (vector[index] ?? 0), 0)),
  );

const multiplyRowVectorMatrix = (vector: number[], matrix: number[][]): number[] =>
  Array.from({ length: matrix[0]?.length ?? 0 }, (_, columnIndex) =>
    normalizeNumber(
      vector.reduce(
        (sum, value, rowIndex) => sum + value * (matrix[rowIndex]?.[columnIndex] ?? 0),
        0,
      ),
    ),
  );

const getVariableValue = (variable: string, result: SimplexResult): number => {
  if (variable.startsWith("X")) {
    return result.decisionVariables[variable] ?? 0;
  }

  if (variable.startsWith("S")) {
    return result.slackVariables[variable] ?? 0;
  }

  return 0;
};

const getVariableCost = (variable: string, problem: LinearProgrammingProblem): number => {
  if (variable.startsWith("X")) {
    const index = Number(variable.slice(1)) - 1;
    return problem.objectiveCoefficients[index] ?? 0;
  }

  return 0;
};

const formatBound = (value: number, direction: "increase" | "decrease"): string => {
  if (!Number.isFinite(value)) {
    return direction === "increase" ? "Sin límite" : "Sin límite";
  }

  return formatNumber(value);
};

const formatRange = (currentValue: number, lowerDelta: number, upperDelta: number): string => {
  const lower = Number.isFinite(lowerDelta) ? formatNumber(currentValue + lowerDelta) : "-∞";
  const upper = Number.isFinite(upperDelta) ? formatNumber(currentValue + upperDelta) : "+∞";

  return `[${lower}, ${upper}]`;
};

export const buildSensitivityAnalysis = (
  problem: LinearProgrammingProblem,
  result: SimplexResult,
): SensitivityAnalysis => {
  const finalTableau = result.iterations[result.iterations.length - 1]?.resultTableau;

  if (result.status !== "optimal" || !finalTableau) {
    const unavailableMatrixMessage =
      "La matriz de sensibilidad requiere un tablero óptimo final del método Simplex.";

    return {
      available: false,
      message:
        "El análisis de sensibilidad base se genera cuando existe un tablero óptimo final del método Simplex.",
      optimalValue: result.optimalValue,
      basicVariables: [],
      nonBasicVariables: [],
      slackVariables: [],
      basicSolutionRows: [],
      activeConstraints: [],
      inactiveConstraints: [],
      constraintRows: [],
      reducedCostRows: [],
      shadowPriceRows: [],
      objectiveRangeRows: [],
      rhsRangeRows: [],
      sensitivityMatrix: createUnavailableMatrixData(unavailableMatrixMessage),
      interpretationRows: [],
      reducedCostConvention: "No disponible",
      notes: [],
    };
  }

  const canonicalProblem = toCanonicalMaximizationProblem(problem);
  const decisionVariables = buildVariableNames("X", problem.objectiveCoefficients.length);
  const slackVariables = buildVariableNames("S", problem.constraints.length);
  const basicVariables = finalTableau.basicVariables.slice(1);
  const allVariables = finalTableau.headers.slice(1, finalTableau.headers.length - 1);
  const nonBasicVariables = allVariables.filter((variable) => !basicVariables.includes(variable));
  const slackVariableValues = slackVariables.map((variable) => ({
    variable,
    value: result.slackVariables[variable] ?? 0,
  }));
  const augmentedMatrix = buildAugmentedMatrix(problem);
  const rhsVector = problem.constraints.map((constraint) => constraint.rhs);
  const basisColumnIndices = basicVariables.map((variable) =>
    augmentedMatrix.columnLabels.indexOf(variable),
  );
  const basisMatrixValues = augmentedMatrix.values.map((row) =>
    basisColumnIndices.map((columnIndex) => row[columnIndex] ?? 0),
  );
  const basisInverseValues = invertMatrix(basisMatrixValues);

  if (!basisInverseValues || basisColumnIndices.some((columnIndex) => columnIndex < 0)) {
    const matrixMessage = "No fue posible calcular B⁻¹ porque la matriz base no es invertible.";

    return {
      available: true,
      optimalValue: result.optimalValue,
      basicVariables,
      nonBasicVariables,
      slackVariables: slackVariableValues,
      basicSolutionRows: [],
      activeConstraints: [],
      inactiveConstraints: [],
      constraintRows: [],
      reducedCostRows: [],
      shadowPriceRows: [],
      objectiveRangeRows: [],
      rhsRangeRows: [],
      sensitivityMatrix: createUnavailableMatrixData(matrixMessage),
      interpretationRows: [
        {
          subject: "Base óptima",
          value: basicVariables.join(", "),
          interpretation:
            "El tablero final sí identificó la base óptima, pero no fue posible invertir B para completar la matriz de sensibilidad.",
        },
      ],
      reducedCostConvention:
        problem.optimizationType === "min"
          ? "El tablero óptimo corresponde al problema equivalente W = -Z."
          : "El tablero interno usa la convención Z - Cx = 0.",
      notes: [matrixMessage],
    };
  }

  const basicCosts = basicVariables.map((variable) => getVariableCost(variable, canonicalProblem));
  const basicSolutionValues = multiplyMatrixVector(basisInverseValues, rhsVector);
  const shadowPrices = multiplyRowVectorMatrix(basicCosts, basisInverseValues);
  const basicSolutionRows: SensitivityBasicSolutionRow[] = basicVariables.map(
    (variable, index) => ({
      variable,
      value: cleanNumber(basicSolutionValues[index] ?? 0),
    }),
  );

  const activeConstraints: string[] = [];
  const inactiveConstraints: string[] = [];

  const constraintRows = problem.constraints.map((constraint, index) => {
    const slack = roundForDisplay(result.slackVariables[`S${index + 1}`] ?? 0);
    const isActive = Math.abs(slack) < EPSILON;
    const label = `R${index + 1}`;
    const shadowPrice = cleanNumber(shadowPrices[index] ?? 0);

    if (isActive) {
      activeConstraints.push(label);
    } else {
      inactiveConstraints.push(label);
    }

    return {
      constraint: label,
      rhs: constraint.rhs,
      slack,
      status: isActive ? "Activa" : "No activa",
      interpretation: isActive
        ? problem.optimizationType === "min"
          ? "La restricción está activa. El valor marginal se calcula sobre la forma equivalente usada internamente y debe interpretarse con cautela respecto al signo del modelo original."
          : shadowPrice > EPSILON
            ? `Un aumento unitario del recurso puede mejorar el valor objetivo en ${formatNumber(shadowPrice)}, mientras se mantenga la misma base óptima.`
            : "Este recurso no tiene impacto marginal bajo la base óptima actual."
        : "La restricción no es limitante en el óptimo actual.",
    };
  });

  const reducedCostRows = allVariables.map((variable) => {
    const columnIndex = augmentedMatrix.columnLabels.indexOf(variable);
    const column = augmentedMatrix.values.map((row) => row[columnIndex] ?? 0);
    const objectiveCoefficient = getVariableCost(variable, canonicalProblem);
    const weightedContribution = normalizeNumber(
      shadowPrices.reduce((sum, value, rowIndex) => sum + value * (column[rowIndex] ?? 0), 0),
    );
    const reducedCost = cleanNumber(objectiveCoefficient - weightedContribution);
    const tableauValue = cleanNumber(weightedContribution - objectiveCoefficient);
    const isBasic = basicVariables.includes(variable);
    const isMinimization = problem.optimizationType === "min";

    return {
      variable,
      finalValue: cleanNumber(getVariableValue(variable, result)),
      objectiveCoefficient: cleanNumber(objectiveCoefficient),
      weightedContribution: cleanNumber(weightedContribution),
      tableauValue,
      reducedCost,
      status: isBasic ? "Básica" : "No básica",
      interpretation: isBasic
        ? "Permanece en la base actual y por eso su costo reducido es 0."
        : isMinimization
          ? "Se calcula sobre la forma equivalente W = -Z. La lectura se muestra de manera técnica para no forzar una interpretación económica directa del signo en el modelo original."
          : Math.abs(reducedCost) < EPSILON
            ? "Su costo reducido es 0; podría existir un óptimo alterno con la misma base dual."
            : "No mejora la función objetivo bajo la base óptima actual.",
    };
  });

  const shadowPriceRows = problem.constraints.map((_, index) => {
    const label = `R${index + 1}`;
    const slack = roundForDisplay(result.slackVariables[`S${index + 1}`] ?? 0);
    const shadowPrice = cleanNumber(shadowPrices[index] ?? 0);
    const isActive = Math.abs(slack) < EPSILON;
    const isMinimization = problem.optimizationType === "min";

    return {
      constraint: label,
      shadowPrice,
      slack,
      status: isActive ? "Activa" : "Con holgura",
      interpretation: isActive
        ? isMinimization
          ? "Los precios sombra se calculan sobre la forma equivalente usada internamente. La interpretación económica debe revisarse según el signo del modelo original."
          : Math.abs(shadowPrice) < EPSILON
            ? "La restricción está activa, pero un cambio marginal no modifica Z en esta base."
            : `Cada unidad adicional del recurso mejoraría Z en ${shadowPrice}, mientras se mantenga la misma base óptima.`
        : isMinimization
          ? "La restricción no es limitante y su lectura marginal se mantiene solo como referencia del modelo equivalente transformado."
          : "La restricción no es limitante en el óptimo y su impacto marginal actual es nulo.",
    };
  });

  const objectiveRangeRows = decisionVariables.map((variable, index) => ({
    variable,
    currentCoefficient: problem.objectiveCoefficients[index],
    allowableIncrease: "Pendiente de cálculo completo",
    allowableDecrease: "Pendiente de cálculo completo",
    range: "Pendiente de cálculo completo",
    status: "Estructura lista",
  }));

  const rhsRangeRows = problem.constraints.map((constraint, columnIndex) => {
    let lowerDelta = Number.NEGATIVE_INFINITY;
    let upperDelta = Number.POSITIVE_INFINITY;

    basisInverseValues.forEach((row, rowIndex) => {
      const direction = row[columnIndex] ?? 0;
      const currentValue = basicSolutionValues[rowIndex] ?? 0;

      if (direction > EPSILON) {
        lowerDelta = Math.max(lowerDelta, -currentValue / direction);
      } else if (direction < -EPSILON) {
        upperDelta = Math.min(upperDelta, -currentValue / direction);
      }
    });

    const allowableIncrease =
      upperDelta === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Math.max(0, upperDelta);
    const allowableDecrease =
      lowerDelta === Number.NEGATIVE_INFINITY ? Number.POSITIVE_INFINITY : Math.max(0, -lowerDelta);

    return {
      constraint: `R${columnIndex + 1}`,
      rhs: constraint.rhs,
      allowableIncrease: formatBound(allowableIncrease, "increase"),
      allowableDecrease: formatBound(allowableDecrease, "decrease"),
      range: formatRange(constraint.rhs, lowerDelta, upperDelta),
      status: "Calculado",
    };
  });

  const sensitivityMatrix: SensitivityMatrixData = {
    available: true,
    augmentedMatrix: {
      title: "Matriz aumentada A_aug = [A | I]",
      rowLabels: augmentedMatrix.rowLabels,
      columnLabels: augmentedMatrix.columnLabels,
      values: matrixToRoundedValues(augmentedMatrix.values),
    },
    basisMatrix: {
      title: "Matriz base B",
      rowLabels: augmentedMatrix.rowLabels,
      columnLabels: basicVariables,
      values: matrixToRoundedValues(basisMatrixValues),
    },
    basisInverse: {
      title: "Inversa de la base B⁻¹",
      rowLabels: augmentedMatrix.rowLabels,
      columnLabels: basicVariables,
      values: matrixToRoundedValues(basisInverseValues),
    },
    basicCosts: {
      title: "Vector Cb",
      labels: basicVariables,
      values: vectorToRoundedValues(basicCosts),
    },
    rhsVector: {
      title: "Vector b",
      labels: augmentedMatrix.rowLabels,
      values: vectorToRoundedValues(rhsVector),
    },
    basicSolution: {
      title: "Solución básica Xb = B⁻¹b",
      labels: basicVariables,
      values: vectorToRoundedValues(basicSolutionValues),
    },
    shadowPrices: {
      title: "Vector de precios sombra π = CbᵀB⁻¹",
      labels: augmentedMatrix.rowLabels,
      values: vectorToRoundedValues(shadowPrices),
    },
  };

  const interpretationRows: SensitivityInterpretationRow[] = [
    {
      subject: "Base óptima",
      value: basicVariables.join(", "),
      interpretation:
        "La base óptima se toma directamente del tablero final y define el orden de las columnas de B y B⁻¹.",
    },
    {
      subject: "Convención de costos reducidos",
      value:
        problem.optimizationType === "min"
          ? "Tabla equivalente W = -Z"
          : "Tabla interna Z - Cx = 0",
      interpretation:
        problem.optimizationType === "min"
          ? "El costo reducido interpretado se calcula sobre la forma equivalente usada por el solver; la lectura económica del signo debe compararse con el modelo original."
          : "La columna 'Tabla final' muestra πAj - Cj, mientras que 'Costo reducido interpretado' muestra Cj - πAj.",
    },
    {
      subject: "Solución básica actual",
      value: basicSolutionRows
        .map((row) => `${row.variable} = ${formatNumber(row.value)}`)
        .join(", "),
      interpretation:
        "Los valores de Xb obtenidos con B⁻¹b deben coincidir con la solución óptima reportada por el método Simplex.",
    },
    {
      subject: "Restricciones activas",
      value: activeConstraints.length > 0 ? activeConstraints.join(", ") : "Ninguna",
      interpretation:
        "Las restricciones activas son las que tienen holgura cero y determinan localmente la base óptima actual.",
    },
    {
      subject: "Restricciones con holgura",
      value: inactiveConstraints.length > 0 ? inactiveConstraints.join(", ") : "Ninguna",
      interpretation:
        "Las restricciones con holgura no son limitantes en el óptimo actual y por ello su impacto marginal puede ser nulo.",
    },
  ];

  return {
    available: true,
    optimalValue: result.optimalValue,
    basicVariables,
    nonBasicVariables,
    slackVariables: slackVariableValues,
    basicSolutionRows,
    activeConstraints,
    inactiveConstraints,
    constraintRows,
    reducedCostRows,
    shadowPriceRows,
    objectiveRangeRows,
    rhsRangeRows,
    sensitivityMatrix,
    interpretationRows,
    reducedCostConvention:
      problem.optimizationType === "min"
        ? "El tablero óptimo corresponde a la forma equivalente W = -Z. Se muestran tanto el valor de la tabla final como el costo reducido interpretado Cj - πAj."
        : "La tabla final usa la convención Z - Cx = 0, por lo que el valor mostrado en el tablero coincide con πAj - Cj y el costo reducido interpretado se reporta como Cj - πAj.",
    notes: [
      problem.optimizationType === "min"
        ? "El modelo original se transformó a maximización de -Z; por eso esta lectura base interpreta el tablero óptimo equivalente antes de volver al signo original de la función objetivo."
        : "La matriz de sensibilidad se reconstruye a partir de la base óptima del tablero Simplex y de la matriz aumentada A_aug = [A | I].",
      problem.optimizationType === "min"
        ? "Para minimización, los precios sombra y costos reducidos se muestran como referencia del modelo equivalente W = -Z sin forzar una interpretación económica del signo en el problema original."
        : "Los precios sombra se calculan como π = CbᵀB⁻¹ y los costos reducidos interpretados como Cj - πAj.",
      "Los rangos permisibles del lado derecho se calculan manteniendo Xb' = B⁻¹b' ≥ 0 con la misma base óptima.",
      "Los rangos de coeficientes de la función objetivo quedan preparados y documentados como pendiente de cálculo completo para no inventar resultados no validados.",
    ],
  };
};
