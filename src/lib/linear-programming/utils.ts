import type {
  DraftConstraint,
  ExampleModel,
  LinearConstraint,
  LinearModel,
  LinearProgrammingDraft,
  LinearProgrammingProblem,
  SimplexBoardData,
  SimplexTableau,
  ValidationResult,
} from "@/lib/linear-programming/types";

export const EPSILON = 1e-9;

export const sprintScopeMessage =
  "Este sprint solo soporta problemas de maximización con restricciones ≤, lado derecho positivo y variables no negativas.";

export const buildVariableNames = (prefix: "X" | "S", count: number): string[] =>
  Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`);

export const normalizeNumber = (value: number): number => {
  if (Math.abs(value) < EPSILON) {
    return 0;
  }

  return Number(value.toFixed(10));
};

export const roundForDisplay = (value: number): number => {
  const normalized = normalizeNumber(value);
  return Number(normalized.toFixed(4));
};

export const formatNumber = (value: number): string => {
  const rounded = roundForDisplay(value);

  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  return rounded
    .toFixed(4)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
};

export const createEmptyDraft = (
  variableCount = 2,
  constraintCount = 3,
): LinearProgrammingDraft => ({
  variableCount,
  constraintCount,
  optimizationType: "max",
  constraintOperator: "<=",
  objectiveCoefficients: Array.from({ length: variableCount }, () => ""),
  constraints: Array.from({ length: constraintCount }, () => ({
    coefficients: Array.from({ length: variableCount }, () => ""),
    operator: "<=",
    rhs: "",
  })),
});

export const resizeDraft = (
  draft: LinearProgrammingDraft,
  variableCount: number,
  constraintCount: number,
): LinearProgrammingDraft => {
  const nextVariableCount = Math.max(
    1,
    Number.isFinite(variableCount) ? Math.trunc(variableCount) : 1,
  );
  const nextConstraintCount = Math.max(
    1,
    Number.isFinite(constraintCount) ? Math.trunc(constraintCount) : 1,
  );

  return {
    ...draft,
    variableCount: nextVariableCount,
    constraintCount: nextConstraintCount,
    objectiveCoefficients: Array.from(
      { length: nextVariableCount },
      (_, index) => draft.objectiveCoefficients[index] ?? "",
    ),
    constraints: Array.from({ length: nextConstraintCount }, (_, rowIndex) => ({
      operator: "<=",
      rhs: draft.constraints[rowIndex]?.rhs ?? "",
      coefficients: Array.from(
        { length: nextVariableCount },
        (_, columnIndex) => draft.constraints[rowIndex]?.coefficients[columnIndex] ?? "",
      ),
    })),
  };
};

export const problemToDraft = (problem: LinearProgrammingProblem): LinearProgrammingDraft => ({
  variableCount: problem.objectiveCoefficients.length,
  constraintCount: problem.constraints.length,
  optimizationType: "max",
  constraintOperator: "<=",
  objectiveCoefficients: problem.objectiveCoefficients.map((value) => String(value)),
  constraints: problem.constraints.map((constraint) => ({
    coefficients: constraint.coefficients.map((value) => String(value)),
    operator: "<=",
    rhs: String(constraint.rhs),
  })),
});

export const modelToProblem = (model: LinearModel): LinearProgrammingProblem => ({
  optimizationType: model.objective.type,
  objectiveCoefficients: [...model.objective.coefficients],
  constraints: model.constraints.map((constraint) => ({
    coefficients: [...constraint.coefficients],
    operator: constraint.operator,
    rhs: constraint.rhs,
  })),
});

export const problemToModel = (
  problem: LinearProgrammingProblem,
  metadata?: Partial<Pick<LinearModel, "id" | "name" | "description">>,
): LinearModel => ({
  id: metadata?.id ?? "manual-problem",
  name: metadata?.name ?? "Problema manual",
  description: metadata?.description ?? "Modelo ingresado manualmente por el usuario.",
  objective: {
    type: "max",
    coefficients: [...problem.objectiveCoefficients],
  },
  variables: buildVariableNames("X", problem.objectiveCoefficients.length),
  constraints: problem.constraints.map((constraint) => ({
    coefficients: [...constraint.coefficients],
    operator: constraint.operator,
    rhs: constraint.rhs,
  })),
});

const parseNumericArray = (values: string[], errorMessage: string, errors: string[]): number[] => {
  const hasInvalidValue = values.some(
    (value) => value.trim() === "" || Number.isNaN(Number(value)),
  );

  if (hasInvalidValue) {
    errors.push(errorMessage);
  }

  return values.map((value) => (value.trim() === "" ? 0 : Number(value)));
};

export const validateDraft = (draft: LinearProgrammingDraft): ValidationResult => {
  const errors: string[] = [];

  if (draft.optimizationType !== "max" || draft.constraintOperator !== "<=") {
    errors.push(sprintScopeMessage);
  }

  if (draft.variableCount < 1) {
    errors.push("Debe existir al menos una variable.");
  }

  if (draft.constraintCount < 1) {
    errors.push("Debe existir al menos una restricción.");
  }

  if (draft.objectiveCoefficients.length !== draft.variableCount) {
    errors.push("Todos los coeficientes deben mantenerse coherentes con el número de variables.");
  }

  if (draft.constraints.length !== draft.constraintCount) {
    errors.push("Debe existir al menos una restricción.");
  }

  if (
    draft.constraints.some((constraint) => constraint.coefficients.length !== draft.variableCount)
  ) {
    errors.push("Todos los coeficientes deben mantenerse coherentes con el número de variables.");
  }

  const objectiveCoefficients = parseNumericArray(
    draft.objectiveCoefficients,
    "Todos los coeficientes deben ser numéricos.",
    errors,
  );

  const constraints: LinearConstraint[] = draft.constraints.map((constraint, rowIndex) => {
    const coefficients = parseNumericArray(
      constraint.coefficients,
      `Todos los coeficientes de la restricción ${rowIndex + 1} deben ser numéricos.`,
      errors,
    );
    const rhs = constraint.rhs.trim() === "" ? Number.NaN : Number(constraint.rhs);

    if (Number.isNaN(rhs)) {
      errors.push(`El lado derecho de la restricción ${rowIndex + 1} debe ser numérico.`);
    } else if (rhs < 0) {
      errors.push(
        `El lado derecho de la restricción ${rowIndex + 1} debe ser mayor o igual a cero.`,
      );
    }

    if (constraint.operator !== "<=") {
      errors.push(sprintScopeMessage);
    }

    return {
      coefficients,
      operator: "<=",
      rhs: Number.isNaN(rhs) ? 0 : rhs,
    };
  });

  const hasAnyValue =
    draft.objectiveCoefficients.some((value) => value.trim() !== "") ||
    draft.constraints.some(
      (constraint) =>
        constraint.rhs.trim() !== "" ||
        constraint.coefficients.some((value) => value.trim() !== ""),
    );

  if (!hasAnyValue) {
    errors.push(
      "No se puede resolver un problema vacío. Ingresa al menos un conjunto completo de coeficientes.",
    );
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors: Array.from(new Set(errors)),
    };
  }

  return {
    isValid: true,
    errors: [],
    problem: {
      optimizationType: "max",
      objectiveCoefficients,
      constraints,
    },
  };
};

export const formatTerm = (
  coefficient: number,
  variableLabel: string,
  omitUnitCoefficient = false,
): string => {
  const absolute = Math.abs(coefficient);
  const coefficientText = omitUnitCoefficient && absolute === 1 ? "" : formatNumber(absolute);
  return `${coefficientText}${variableLabel}`;
};

export const formatLinearExpression = (
  coefficients: number[],
  variableLabels: string[],
): string => {
  const terms = coefficients
    .map((coefficient, index) => ({ coefficient, variable: variableLabels[index] }))
    .filter(({ coefficient }) => normalizeNumber(coefficient) !== 0)
    .map(({ coefficient, variable }, index) => {
      const sign = coefficient < 0 ? "-" : index > 0 ? "+" : "";
      return `${sign}${sign ? " " : ""}${formatTerm(coefficient, variable, true)}`.trim();
    });

  return terms.length > 0 ? terms.join(" ") : "0";
};

export const formatObjectiveFunction = (problem: LinearProgrammingProblem): string => {
  const variables = buildVariableNames("X", problem.objectiveCoefficients.length);
  return `Max Z = ${formatLinearExpression(problem.objectiveCoefficients, variables)}`;
};

export const formatConstraint = (constraint: LinearConstraint): string => {
  const variables = buildVariableNames("X", constraint.coefficients.length);
  return `${formatLinearExpression(constraint.coefficients, variables)} <= ${formatNumber(constraint.rhs)}`;
};

const formatEquationTail = (coefficients: number[], variableLabels: string[]): string => {
  return coefficients
    .map((coefficient, index) => {
      const sign = coefficient >= 0 ? "+" : "-";
      return `${sign} ${formatTerm(coefficient, variableLabels[index], true)}`;
    })
    .join(" ");
};

export const formatAugmentedObjective = (problem: LinearProgrammingProblem): string => {
  const variables = buildVariableNames("X", problem.objectiveCoefficients.length);
  const objectiveTerms = problem.objectiveCoefficients.map((coefficient) => -coefficient);
  return `Z ${formatEquationTail(objectiveTerms, variables)} = 0`;
};

export const formatAugmentedConstraint = (
  constraint: LinearConstraint,
  slackIndex: number,
): string => {
  const variableNames = buildVariableNames("X", constraint.coefficients.length);
  const leftSide = formatLinearExpression(
    [...constraint.coefficients, 1],
    [...variableNames, `S${slackIndex + 1}`],
  );
  return `${leftSide} = ${formatNumber(constraint.rhs)}`;
};

export const cloneTableau = (tableau: SimplexTableau): SimplexTableau => ({
  headers: [...tableau.headers],
  basicVariables: [...tableau.basicVariables],
  rows: tableau.rows.map((row) => [...row]),
});

export const getBasicVariableValues = (tableau: SimplexTableau): Record<string, number> => {
  const rhsIndex = tableau.headers.length - 1;

  return tableau.basicVariables.reduce<Record<string, number>>(
    (accumulator, basicVariable, rowIndex) => {
      accumulator[basicVariable] = roundForDisplay(tableau.rows[rowIndex][rhsIndex]);
      return accumulator;
    },
    {},
  );
};

export const buildSolutionInterpretation = (
  decisionVariables: Record<string, number>,
  optimalValue: number,
): string => {
  const items = Object.entries(decisionVariables)
    .sort(([left], [right]) => left.localeCompare(right, "es"))
    .map(([name, value]) => `${name} = ${formatNumber(value)}`)
    .join(", ");

  return `La solución óptima se alcanza con ${items}, obteniendo Z = ${formatNumber(optimalValue)}.`;
};

export const buildSlackInterpretation = (slackVariables: Record<string, number>): string => {
  const items = Object.entries(slackVariables)
    .sort(([left], [right]) => left.localeCompare(right, "es"))
    .map(([name, value]) => `${name} = ${formatNumber(value)}`)
    .join(", ");

  return `Las variables de holgura quedan en ${items}.`;
};

export const tableauToBoard = (
  tableau: SimplexTableau,
  options?: {
    pivotColumnIndex?: number;
    pivotRowIndex?: number;
    ratios?: Array<number | null>;
  },
): SimplexBoardData => {
  const ratioValues = options?.ratios ?? tableau.rows.map(() => null);

  return {
    headers: ["VB", ...tableau.headers, "Razón"],
    rows: tableau.rows.map((row, rowIndex) => ({
      label: tableau.basicVariables[rowIndex],
      values: [...row, ratioValues[rowIndex] ?? Number.NaN],
      isPivotRow: options?.pivotRowIndex === rowIndex,
    })),
    pivotCol: options?.pivotColumnIndex,
    pivotRow: options?.pivotRowIndex,
    negativeColumns: tableau.rows[0]
      .map((value, columnIndex) => ({ value, columnIndex }))
      .filter(
        ({ value, columnIndex }) =>
          columnIndex > 0 && columnIndex < tableau.headers.length - 1 && value < -EPSILON,
      )
      .map(({ columnIndex }) => columnIndex),
  };
};

export const ratioValuesForBoard = (
  ratioValues: Array<{ value: number | null }>,
  rowCount: number,
): Array<number | null> => {
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    if (rowIndex === 0) {
      return null;
    }

    return ratioValues[rowIndex - 1]?.value ?? null;
  });
};

export const buildExpectedSummary = (example: ExampleModel): string => {
  const variables = Object.entries(example.expectedSolution.variables)
    .map(([name, value]) => `${name} = ${formatNumber(value)}`)
    .join(", ");
  return `${variables}, Z = ${formatNumber(example.expectedSolution.z)}`;
};

export const buildDraftConstraint = (variableCount: number): DraftConstraint => ({
  coefficients: Array.from({ length: variableCount }, () => ""),
  operator: "<=",
  rhs: "",
});
