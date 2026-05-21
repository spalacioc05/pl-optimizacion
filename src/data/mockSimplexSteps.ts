export interface SimplexTable {
  headers: string[];
  rows: Array<{
    label: string;
    values: number[];
    isPivotRow?: boolean;
  }>;
  pivotCol?: number; // index in values (0-based excluding label)
  pivotRow?: number;
}

export interface SolverStep {
  id: number;
  title: string;
  subtitle: string;
  explanation: string;
  kind:
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
    | "final";
  table?: SimplexTable;
  operations?: string[];
  ratios?: Array<{ row: string; value: string; min?: boolean }>;
  highlights?: { entering?: string; leaving?: string; pivot?: number };
}

// Wyndor steps
export const wyndorSteps: SolverStep[] = [
  {
    id: 1,
    title: "Paso 1 — Modelo original",
    subtitle: "Planteamiento del problema",
    kind: "model",
    explanation:
      "Comenzamos con la formulación matemática del problema. Tenemos una función objetivo a maximizar sujeta a restricciones lineales y no negatividad.",
  },
  {
    id: 2,
    title: "Paso 2 — Forma aumentada",
    subtitle: "Introducción de variables de holgura",
    kind: "augmented",
    explanation:
      "Convertimos cada restricción ≤ en una igualdad agregando variables de holgura S1, S2, S3 ≥ 0.",
    operations: ["X1 + S1 = 4", "2X2 + S2 = 12", "3X1 + 2X2 + S3 = 18", "Z − 3X1 − 5X2 = 0"],
  },
  {
    id: 3,
    title: "Paso 3 — Tablero inicial",
    subtitle: "Iteración 0",
    kind: "tableau",
    explanation:
      "Las variables básicas iniciales son las holguras S1, S2 y S3. Z = 0 en el origen (0, 0).",
    table: {
      headers: ["Base", "Z", "X1", "X2", "S1", "S2", "S3", "LD"],
      rows: [
        { label: "Z", values: [1, -3, -5, 0, 0, 0, 0] },
        { label: "S1", values: [0, 1, 0, 1, 0, 0, 4] },
        { label: "S2", values: [0, 0, 2, 0, 1, 0, 12] },
        { label: "S3", values: [0, 3, 2, 0, 0, 1, 18] },
      ],
    },
  },
  {
    id: 4,
    title: "Paso 4 — Prueba de optimalidad",
    subtitle: "Revisamos la fila Z",
    kind: "optimality",
    explanation:
      "Hay coeficientes negativos en la fila Z (−3 y −5), por lo tanto la solución actual no es óptima.",
    table: {
      headers: ["Base", "Z", "X1", "X2", "S1", "S2", "S3", "LD"],
      rows: [
        { label: "Z", values: [1, -3, -5, 0, 0, 0, 0] },
        { label: "S1", values: [0, 1, 0, 1, 0, 0, 4] },
        { label: "S2", values: [0, 0, 2, 0, 1, 0, 12] },
        { label: "S3", values: [0, 3, 2, 0, 0, 1, 18] },
      ],
      pivotCol: 2,
    },
  },
  {
    id: 5,
    title: "Paso 5 — Variable que entra",
    subtitle: "X2 entra a la base",
    kind: "entering",
    explanation:
      "X2 tiene el coeficiente más negativo (−5) en la fila Z, por lo que entra a la base.",
    highlights: { entering: "X2" },
    table: {
      headers: ["Base", "Z", "X1", "X2", "S1", "S2", "S3", "LD"],
      rows: [
        { label: "Z", values: [1, -3, -5, 0, 0, 0, 0] },
        { label: "S1", values: [0, 1, 0, 1, 0, 0, 4] },
        { label: "S2", values: [0, 0, 2, 0, 1, 0, 12] },
        { label: "S3", values: [0, 3, 2, 0, 0, 1, 18] },
      ],
      pivotCol: 2,
    },
  },
  {
    id: 6,
    title: "Paso 6 — Cálculo de razones",
    subtitle: "LD / Columna pivote (positivos)",
    kind: "ratios",
    explanation: "Se calculan las razones para determinar la variable que sale.",
    ratios: [
      { row: "S1", value: "4 / 0 = ∞" },
      { row: "S2", value: "12 / 2 = 6", min: true },
      { row: "S3", value: "18 / 2 = 9" },
    ],
    table: {
      headers: ["Base", "Z", "X1", "X2", "S1", "S2", "S3", "LD"],
      rows: [
        { label: "Z", values: [1, -3, -5, 0, 0, 0, 0] },
        { label: "S1", values: [0, 1, 0, 1, 0, 0, 4] },
        { label: "S2", values: [0, 0, 2, 0, 1, 0, 12], isPivotRow: true },
        { label: "S3", values: [0, 3, 2, 0, 0, 1, 18] },
      ],
      pivotCol: 2,
      pivotRow: 2,
    },
  },
  {
    id: 7,
    title: "Paso 7 — Variable que sale",
    subtitle: "S2 sale de la base",
    kind: "leaving",
    explanation: "S2 tiene la menor razón positiva (6). Por lo tanto sale de la base.",
    highlights: { entering: "X2", leaving: "S2", pivot: 2 },
  },
  {
    id: 8,
    title: "Paso 8 — Elemento pivote",
    subtitle: "Pivote = 2",
    kind: "pivot",
    explanation: "El elemento pivote es la intersección de la columna X2 y la fila S2: el valor 2.",
    highlights: { entering: "X2", leaving: "S2", pivot: 2 },
  },
  {
    id: 9,
    title: "Paso 9 — Operaciones de renglón",
    subtitle: "Iteración 1",
    kind: "operations",
    explanation:
      "Normalizamos la fila pivote dividiendo entre 2, y hacemos ceros en la columna X2 del resto de filas.",
    operations: [
      "X2 = S2 / 2",
      "Z = Z + 5 · X2(fila pivote)",
      "S3 = S3 − 2 · X2(fila pivote)",
      "S1 sin cambios (coeficiente en X2 = 0)",
    ],
  },
  {
    id: 10,
    title: "Paso 10 — Nuevo tablero",
    subtitle: "Iteración 1 — Z = 30",
    kind: "newTableau",
    explanation:
      "Aún hay un coeficiente negativo (−3) en X1, por lo que continuamos. Entra X1, sale S3 (razón mínima 6/3 = 2). Pivote = 3.",
    table: {
      headers: ["Base", "Z", "X1", "X2", "S1", "S2", "S3", "LD"],
      rows: [
        { label: "Z", values: [1, -3, 0, 0, 2.5, 0, 30] },
        { label: "S1", values: [0, 1, 0, 1, 0, 0, 4] },
        { label: "X2", values: [0, 0, 1, 0, 0.5, 0, 6] },
        { label: "S3", values: [0, 3, 0, 0, -1, 1, 6], isPivotRow: true },
      ],
      pivotCol: 1,
      pivotRow: 3,
    },
  },
  {
    id: 11,
    title: "Paso final — Solución óptima",
    subtitle: "Iteración 2 — Todos los coeficientes ≥ 0",
    kind: "final",
    explanation:
      "Se alcanza el óptimo. Z = 36, X1 = 2, X2 = 6. Máximo global en la región factible.",
    table: {
      headers: ["Base", "Z", "X1", "X2", "S1", "S2", "S3", "LD"],
      rows: [
        { label: "Z", values: [1, 0, 0, 0, 1.5, 1, 36] },
        { label: "S1", values: [0, 0, 0, 1, 1 / 3, -1 / 3, 2] },
        { label: "X2", values: [0, 0, 1, 0, 0.5, 0, 6] },
        { label: "X1", values: [0, 1, 0, 0, -1 / 3, 1 / 3, 2] },
      ],
    },
  },
];
