export type OptimizationType = "max";
export type ConstraintOperator = "<=";

export interface LinearConstraint {
  coefficients: number[];
  operator: ConstraintOperator;
  rhs: number;
}

export interface LinearModel {
  id: string;
  name: string;
  description: string;
  objective: {
    type: OptimizationType;
    coefficients: number[];
  };
  variables: string[];
  constraints: LinearConstraint[];
}

export interface ExpectedSolution {
  variables: Record<string, number>;
  slacks: Record<string, number>;
  z: number;
}

export interface ExampleModel extends LinearModel {
  expectedSolution: ExpectedSolution;
  interpretation: string;
}

export interface LinearProgrammingProblem {
  optimizationType: OptimizationType;
  objectiveCoefficients: number[];
  constraints: LinearConstraint[];
}

export interface DraftConstraint {
  coefficients: string[];
  operator: ConstraintOperator;
  rhs: string;
}

export interface LinearProgrammingDraft {
  variableCount: number;
  constraintCount: number;
  optimizationType: OptimizationType;
  constraintOperator: ConstraintOperator;
  objectiveCoefficients: string[];
  constraints: DraftConstraint[];
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
  isMinimum: boolean;
}

export interface SimplexIteration {
  iterationNumber: number;
  sourceTableau: SimplexTableau;
  resultTableau: SimplexTableau;
  enteringVariable?: string;
  leavingVariable?: string;
  pivotColumnIndex?: number;
  pivotRowIndex?: number;
  pivotValue?: number;
  ratios: RatioDetail[];
  rowOperations: string[];
  explanation: string[];
  status: "initial" | "processing" | "optimal" | "unbounded";
  statusLabel: string;
}

export interface SimplexResult {
  status: "optimal" | "unbounded" | "error";
  message: string;
  iterations: SimplexIteration[];
  optimalValue: number;
  decisionVariables: Record<string, number>;
  slackVariables: Record<string, number>;
  augmentedObjective: string;
  augmentedConstraints: string[];
}

export type SolverStepKind =
  | "model"
  | "augmented"
  | "tableau"
  | "optimality"
  | "entering"
  | "ratios"
  | "leaving"
  | "pivot"
  | "operations"
  | "newTableau"
  | "final"
  | "unbounded";

export interface SimplexBoardRow {
  label: string;
  values: number[];
  isPivotRow?: boolean;
}

export interface SimplexBoardData {
  headers: string[];
  rows: SimplexBoardRow[];
  pivotCol?: number;
  pivotRow?: number;
}

export interface SolverStep {
  id: string;
  title: string;
  subtitle: string;
  explanation: string;
  kind: SolverStepKind;
  table?: SimplexBoardData;
  operations?: string[];
  ratios?: Array<{ row: string; value: string; min?: boolean }>;
  highlights?: { entering?: string; leaving?: string; pivot?: number };
}

export interface GraphicalLine {
  id: string;
  label: string;
  coefficients: [number, number];
  rhs: number;
  points: [{ x: number; y: number }, { x: number; y: number }];
}

export interface GraphicalVertex {
  id: string;
  x: number;
  y: number;
  z: number;
}

export type GraphicalStageKind =
  | "plane"
  | "axes"
  | "constraint"
  | "region"
  | "vertices"
  | "evaluation"
  | "objective"
  | "optimal"
  | "conclusion";

export interface GraphicalStage {
  id: string;
  title: string;
  description: string;
  kind: GraphicalStageKind;
  constraintIndex?: number;
}

export interface GraphicalResult {
  available: boolean;
  message?: string;
  lines: GraphicalLine[];
  vertices: GraphicalVertex[];
  feasiblePolygon: GraphicalVertex[];
  optimalVertex?: GraphicalVertex;
  xMax: number;
  yMax: number;
  stages: GraphicalStage[];
}
