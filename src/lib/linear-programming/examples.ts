import type { ExampleModel } from "@/lib/linear-programming/types";

export const exampleModels: ExampleModel[] = [
  {
    id: "wyndor",
    name: "Wyndor Glass",
    description:
      "Caso clásico del material de clase con tres restricciones y resolución tabular y gráfica.",
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
    interpretation:
      "Se deben producir 2 lotes del producto 1 y 6 lotes del producto 2. La utilidad máxima es 36. La primera restricción queda con holgura de 2 unidades y las restricciones 2 y 3 se utilizan completamente.",
  },
  {
    id: "word-light",
    name: "Word Light",
    description:
      "Ejemplo algebraico de las diapositivas con solución óptima en el punto (125, 25).",
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
    interpretation:
      "La empresa debe fabricar 125 unidades del producto 1 y 25 unidades del producto 2 para obtener una ganancia máxima de 175. Las restricciones 1 y 2 se utilizan completamente, y la tercera restricción queda con una holgura de 35 unidades.",
  },
  {
    id: "simplex-tabular-material",
    name: "Caso tabular del material",
    description:
      "Ejemplo adicional del material de clase validado con el solver tabular y gráfico actual.",
    variables: ["X1", "X2"],
    objective: { type: "max", coefficients: [5, 4] },
    constraints: [
      { coefficients: [6, 4], operator: "<=", rhs: 24 },
      { coefficients: [1, 2], operator: "<=", rhs: 6 },
      { coefficients: [-1, 1], operator: "<=", rhs: 1 },
      { coefficients: [0, 1], operator: "<=", rhs: 2 },
    ],
    expectedSolution: {
      variables: { X1: 3, X2: 1.5 },
      slacks: { S1: 0, S2: 0, S3: 2.5, S4: 0.5 },
      z: 21,
    },
    interpretation:
      "El óptimo se obtiene en X1 = 3 y X2 = 1.5, con Z = 21. Las restricciones 1 y 2 quedan activas, mientras las restricciones 3 y 4 conservan holguras positivas.",
  },
];
