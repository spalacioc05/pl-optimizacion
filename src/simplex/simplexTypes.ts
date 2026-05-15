export type OptimizationType = 'max';

export type ConstraintType = '<=';

export interface Constraint {
  coefficients: number[];
  type: ConstraintType;
  rhs: number;
}

export interface LinearProgrammingProblem {
  optimizationType: OptimizationType;
  objectiveCoefficients: number[];
  constraints: Constraint[];
}

export interface ProblemDraftConstraint {
  coefficients: string[];
  type: ConstraintType;
  rhs: string;
}

export interface ProblemDraft {
  variableCount: number;
  constraintCount: number;
  optimizationType: OptimizationType;
  constraintType: ConstraintType;
  objectiveCoefficients: string[];
  constraints: ProblemDraftConstraint[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  problem?: LinearProgrammingProblem;
}

export interface SimplexTableau {
  headers: string[];
  basicVariables: string[];
  rows: number[][];
}

export interface RatioDetail {
  basicVariable: string;
  value: number | null;
  expression: string;
}

export interface SimplexIteration {
  iterationNumber: number;
  tableau: SimplexTableau;
  enteringVariable?: string;
  leavingVariable?: string;
  pivotColumnIndex?: number;
  pivotRowIndex?: number;
  pivotValue?: number;
  ratios: RatioDetail[];
  rowOperations: string[];
  explanation: string[];
  isOptimal: boolean;
  statusLabel: string;
}

export interface SimplexResult {
  iterations: SimplexIteration[];
  optimalValue: number;
  decisionVariables: Record<string, number>;
  slackVariables: Record<string, number>;
  status: 'optimal' | 'unbounded' | 'error';
  message: string;
  augmentedObjective: string;
  augmentedConstraints: string[];
}

export interface ExampleProblem {
  id: string;
  title: string;
  description: string;
  problem: LinearProgrammingProblem;
  expectedSummary: string;
}
