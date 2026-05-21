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
  negativeColumns?: number[];
}

export interface StepSummary {
  basicVariables: string[];
  nonBasicVariables: string[];
  solution: Record<string, number>;
  objectiveValue: number;
  status: string;
  reason: string;
  enteringVariable?: string;
  leavingVariable?: string;
  pivotValue?: number;
  pivotPosition?: string;
  mostNegativeVariable?: string;
  mostNegativeValue?: number;
}

export interface SolverStep {
  id: string;
  title: string;
  subtitle: string;
  explanation: string;
  kind: SolverStepKind;
  table?: SimplexBoardData;
  tableCaption?: string;
  comparison?: {
    before: SimplexBoardData;
    after: SimplexBoardData;
    beforeCaption: string;
    afterCaption: string;
  };
  operations?: string[];
  ratios?: Array<{ row: string; value: string; min?: boolean }>;
  highlights?: { entering?: string; leaving?: string; pivot?: number };
  summary?: StepSummary;
}

export interface GraphicalIntercept {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface GraphicalLine {
  id: string;
  label: string;
  tooltip: string;
  explanation: string;
  feasibleSideLabel: string;
  coefficients: [number, number];
  rhs: number;
  points: [{ x: number; y: number }, { x: number; y: number }];
  intercepts: GraphicalIntercept[];
}

export interface GraphicalVertex {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  substitution: string;
  status: "Factible" | "Óptimo";
}

export interface GraphicalLevelLine {
  id: string;
  label: string;
  zValue: number;
  vertexId?: string;
  description: string;
  tooltip: string;
  points: [{ x: number; y: number }, { x: number; y: number }];
}

export type GraphicalStageKind =
  | "plane"
  | "constraint"
  | "region"
  | "vertices"
  | "evaluation"
  | "objective"
  | "direction"
  | "optimal"
  | "conclusion";

export interface GraphicalStage {
  id: string;
  title: string;
  description: string;
  kind: GraphicalStageKind;
  constraintIndex?: number;
  focusLineId?: string;
  focusVertexId?: string;
  focusLevelId?: string;
  revealedVertexIds?: string[];
  revealedLevelIds?: string[];
  notes?: string[];
}

export interface GraphicalResult {
  available: boolean;
  message?: string;
  lines: GraphicalLine[];
  vertices: GraphicalVertex[];
  feasiblePolygon: GraphicalVertex[];
  levelLines: GraphicalLevelLine[];
  optimalVertex?: GraphicalVertex;
  xMax: number;
  yMax: number;
  stages: GraphicalStage[];
}
