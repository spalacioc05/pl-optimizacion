export interface LinearModel {
  id: string;
  name: string;
  description: string;
  objective: { type: "max" | "min"; coefficients: number[] };
  variables: string[];
  constraints: Array<{
    coefficients: number[];
    operator: "<=" | ">=" | "=";
    rhs: number;
  }>;
  expectedSolution: {
    variables: Record<string, number>;
    slacks: Record<string, number>;
    z: number;
  };
}

export const mockExamples: LinearModel[] = [
  {
    id: "wyndor",
    name: "Wyndor Glass",
    description: "Producción de productos en una fábrica con tres plantas.",
    variables: ["X1", "X2"],
    objective: { type: "max", coefficients: [3, 5] },
    constraints: [
      { coefficients: [1, 0], operator: "<=", rhs: 4 },
      { coefficients: [0, 2], operator: "<=", rhs: 12 },
      { coefficients: [3, 2], operator: "<=", rhs: 18 },
    ],
    expectedSolution: {
      variables: { X1: 2, X2: 6 },
      slacks: { S1: 2, S2: 0, S3: 0 },
      z: 36,
    },
  },
  {
    id: "wordlight",
    name: "Word Light",
    description: "Asignación óptima de recursos en una campaña publicitaria.",
    variables: ["X1", "X2"],
    objective: { type: "max", coefficients: [1, 2] },
    constraints: [
      { coefficients: [1, 3], operator: "<=", rhs: 200 },
      { coefficients: [2, 2], operator: "<=", rhs: 300 },
      { coefficients: [0, 1], operator: "<=", rhs: 60 },
    ],
    expectedSolution: {
      variables: { X1: 125, X2: 25 },
      slacks: { S1: 0, S2: 0, S3: 35 },
      z: 175,
    },
  },
];
