import {
  Constraint,
  LinearProgrammingProblem,
  ProblemDraft,
  SimplexTableau,
  ValidationResult,
} from './simplexTypes';

export const EPSILON = 1e-9;

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

  return rounded.toFixed(4).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
};

export const buildVariableNames = (prefix: 'X' | 'S', count: number): string[] =>
  Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`);

export const createEmptyDraft = (variableCount = 2, constraintCount = 3): ProblemDraft => ({
  variableCount,
  constraintCount,
  optimizationType: 'max',
  constraintType: '<=',
  objectiveCoefficients: Array.from({ length: variableCount }, () => ''),
  constraints: Array.from({ length: constraintCount }, () => ({
    coefficients: Array.from({ length: variableCount }, () => ''),
    type: '<=',
    rhs: '',
  })),
});

export const resizeDraft = (
  draft: ProblemDraft,
  variableCount: number,
  constraintCount: number,
): ProblemDraft => {
  const nextVariableCount = Math.max(1, variableCount);
  const nextConstraintCount = Math.max(1, constraintCount);

  return {
    ...draft,
    variableCount: nextVariableCount,
    constraintCount: nextConstraintCount,
    objectiveCoefficients: Array.from({ length: nextVariableCount }, (_, index) => draft.objectiveCoefficients[index] ?? ''),
    constraints: Array.from({ length: nextConstraintCount }, (_, rowIndex) => ({
      type: '<=',
      rhs: draft.constraints[rowIndex]?.rhs ?? '',
      coefficients: Array.from(
        { length: nextVariableCount },
        (_, columnIndex) => draft.constraints[rowIndex]?.coefficients[columnIndex] ?? '',
      ),
    })),
  };
};

export const problemToDraft = (problem: LinearProgrammingProblem): ProblemDraft => ({
  variableCount: problem.objectiveCoefficients.length,
  constraintCount: problem.constraints.length,
  optimizationType: 'max',
  constraintType: '<=',
  objectiveCoefficients: problem.objectiveCoefficients.map((value) => String(value)),
  constraints: problem.constraints.map((constraint) => ({
    coefficients: constraint.coefficients.map((value) => String(value)),
    type: '<=',
    rhs: String(constraint.rhs),
  })),
});

const parseNumericArray = (values: string[], errorMessage: string, errors: string[]): number[] => {
  const parsed = values.map((value) => Number(value));

  if (parsed.some((value) => Number.isNaN(value))) {
    errors.push(errorMessage);
  }

  return parsed;
};

export const validateDraft = (draft: ProblemDraft): ValidationResult => {
  const errors: string[] = [];
  const sprintScopeMessage = 'Este primer sprint solo soporta problemas de maximización con restricciones ≤, lado derecho positivo y variables no negativas.';

  if (draft.optimizationType !== 'max' || draft.constraintType !== '<=') {
    errors.push(sprintScopeMessage);
  }

  if (draft.variableCount < 1) {
    errors.push('El número de variables debe ser mayor o igual a 1.');
  }

  if (draft.constraintCount < 1) {
    errors.push('El número de restricciones debe ser mayor o igual a 1.');
  }

  const objectiveCoefficients = parseNumericArray(
    draft.objectiveCoefficients,
    'Todos los coeficientes de la función objetivo deben ser numéricos.',
    errors,
  );

  const constraints: Constraint[] = draft.constraints.map((constraint, rowIndex) => {
    const coefficients = parseNumericArray(
      constraint.coefficients,
      `Todos los coeficientes de la restricción ${rowIndex + 1} deben ser numéricos.`,
      errors,
    );
    const rhs = Number(constraint.rhs);

    if (Number.isNaN(rhs)) {
      errors.push(`El lado derecho de la restricción ${rowIndex + 1} debe ser numérico.`);
    } else if (rhs < 0) {
      errors.push(sprintScopeMessage);
      errors.push(`El lado derecho de la restricción ${rowIndex + 1} debe ser mayor o igual a cero.`);
    }

    if (constraint.type !== '<=') {
      errors.push(sprintScopeMessage);
    }

    return {
      coefficients,
      type: '<=',
      rhs: Number.isNaN(rhs) ? 0 : rhs,
    };
  });

  const hasAnyValue = draft.objectiveCoefficients.some((value) => value.trim() !== '')
    || draft.constraints.some(
      (constraint) => constraint.rhs.trim() !== '' || constraint.coefficients.some((value) => value.trim() !== ''),
    );

  if (!hasAnyValue) {
    errors.push('No se puede resolver un problema vacío. Ingresa al menos un conjunto completo de coeficientes.');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    errors: [],
    problem: {
      optimizationType: 'max',
      objectiveCoefficients,
      constraints,
    },
  };
};

export const formatTerm = (coefficient: number, variableLabel: string, omitUnitCoefficient = false): string => {
  const absolute = Math.abs(coefficient);
  const coefficientText = omitUnitCoefficient && absolute === 1 ? '' : formatNumber(absolute);
  return `${coefficientText}${variableLabel}`;
};

export const formatLinearExpression = (coefficients: number[], variableLabels: string[]): string => {
  const terms = coefficients
    .map((coefficient, index) => ({
      coefficient,
      variable: variableLabels[index],
    }))
    .filter(({ coefficient }) => normalizeNumber(coefficient) !== 0)
    .map(({ coefficient, variable }, index) => {
      const sign = coefficient < 0 ? '-' : index > 0 ? '+' : '';
      return `${sign}${sign ? ' ' : ''}${formatTerm(coefficient, variable, true)}`.trim();
    });

  return terms.length > 0 ? terms.join(' ') : '0';
};

export const formatObjectiveFunction = (problem: LinearProgrammingProblem): string => {
  const variables = buildVariableNames('X', problem.objectiveCoefficients.length);
  return `Max Z = ${formatLinearExpression(problem.objectiveCoefficients, variables)}`;
};

export const formatConstraint = (constraint: Constraint): string => {
  const variables = buildVariableNames('X', constraint.coefficients.length);
  return `${formatLinearExpression(constraint.coefficients, variables)} <= ${formatNumber(constraint.rhs)}`;
};

export const formatAugmentedObjective = (problem: LinearProgrammingProblem): string => {
  const variables = buildVariableNames('X', problem.objectiveCoefficients.length);
  const objectiveTerms = problem.objectiveCoefficients.map((coefficient) => -coefficient);
  return `Z ${formatEquationTail(objectiveTerms, variables)} = 0`;
};

export const formatAugmentedConstraint = (constraint: Constraint, slackIndex: number): string => {
  const variableNames = buildVariableNames('X', constraint.coefficients.length);
  const leftSide = formatLinearExpression(
    [...constraint.coefficients, 1],
    [...variableNames, `S${slackIndex + 1}`],
  );
  return `${leftSide} = ${formatNumber(constraint.rhs)}`;
};

const formatEquationTail = (coefficients: number[], variableLabels: string[]): string => {
  return coefficients
    .map((coefficient, index) => {
      const sign = coefficient >= 0 ? '+' : '-';
      return `${sign} ${formatTerm(coefficient, variableLabels[index], true)}`;
    })
    .join(' ');
};

export const cloneTableau = (tableau: SimplexTableau): SimplexTableau => ({
  headers: [...tableau.headers],
  basicVariables: [...tableau.basicVariables],
  rows: tableau.rows.map((row) => [...row]),
});

export const getBasicVariableValues = (tableau: SimplexTableau): Record<string, number> => {
  const rhsIndex = tableau.headers.length - 1;

  return tableau.basicVariables.reduce<Record<string, number>>((accumulator, basicVariable, rowIndex) => {
    accumulator[basicVariable] = roundForDisplay(tableau.rows[rowIndex][rhsIndex]);
    return accumulator;
  }, {});
};

export const buildSolutionInterpretation = (
  variables: Record<string, number>,
  optimalValue: number,
): string => {
  const variableSummary = Object.entries(variables)
    .map(([name, value]) => `${name} = ${formatNumber(value)}`)
    .join(', ');

  return `La solución óptima indica que ${variableSummary}, obteniendo un valor óptimo de Z = ${formatNumber(optimalValue)}.`;
};

export const buildSlackInterpretation = (slackVariables: Record<string, number>): string => {
  const entries = Object.entries(slackVariables);

  if (entries.length === 0) {
    return 'No hay variables de holgura registradas.';
  }

  return entries
    .map(([name, value], index) => {
      if (value === 0) {
        return `${name} = 0, por lo tanto la restricción ${index + 1} se utiliza completamente.`;
      }

      return `${name} = ${formatNumber(value)}, lo que representa recurso no utilizado en la restricción ${index + 1}.`;
    })
    .join(' ');
};
