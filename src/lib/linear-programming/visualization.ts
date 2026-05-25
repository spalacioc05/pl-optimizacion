import type {
  ConstraintPlane3D,
  LinearProgrammingProblem,
  SpacePoint3D,
  SimplexResult,
  ThreeDimensionalStage,
  ThreeDimensionalVisualization,
} from "@/lib/linear-programming/types";
import {
  EPSILON,
  formatConstraint,
  formatNumber,
  roundForDisplay,
} from "@/lib/linear-programming/utils";

const PLANE_COLORS = ["#14b8a6", "#0891b2", "#3b82f6", "#f97316", "#ef4444", "#8b5cf6"];

interface PlaneEquation {
  id: string;
  label: string;
  description: string;
  coefficients: [number, number, number];
  rhs: number;
  kind: "constraint" | "axis";
}

const determinant3 = (matrix: number[][]): number => {
  return (
    matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
    matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
    matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
  );
};

const solve3x3 = (matrix: number[][], rhs: number[]): [number, number, number] | null => {
  const determinant = determinant3(matrix);
  if (Math.abs(determinant) < EPSILON) {
    return null;
  }

  const replaceColumn = (columnIndex: number) =>
    matrix.map((row, rowIndex) =>
      row.map((value, currentColumnIndex) =>
        currentColumnIndex === columnIndex ? rhs[rowIndex] : value,
      ),
    );

  return [0, 1, 2].map((columnIndex) => determinant3(replaceColumn(columnIndex)) / determinant) as [
    number,
    number,
    number,
  ];
};

const isFeasiblePoint = (problem: LinearProgrammingProblem, point: [number, number, number]) => {
  if (point.some((value) => value < -EPSILON)) {
    return false;
  }

  return problem.constraints.every((constraint) => {
    const value = constraint.coefficients.reduce(
      (sum, coefficient, index) => sum + coefficient * point[index],
      0,
    );
    return value <= constraint.rhs + EPSILON;
  });
};

const uniquePoints = (points: Array<[number, number, number]>) => {
  return points.filter(
    (point, index) =>
      points.findIndex(
        (candidate) =>
          Math.abs(candidate[0] - point[0]) < 1e-5 &&
          Math.abs(candidate[1] - point[1]) < 1e-5 &&
          Math.abs(candidate[2] - point[2]) < 1e-5,
      ) === index,
  );
};

const buildPlanes = (problem: LinearProgrammingProblem): PlaneEquation[] => {
  const constraintPlanes = problem.constraints.map((constraint, index) => ({
    id: `constraint-${index + 1}`,
    label: `R${index + 1}`,
    description: formatConstraint(constraint).replace(/<=/g, "≤"),
    coefficients: [
      constraint.coefficients[0] ?? 0,
      constraint.coefficients[1] ?? 0,
      constraint.coefficients[2] ?? 0,
    ] as [number, number, number],
    rhs: constraint.rhs,
    kind: "constraint" as const,
  }));

  const axisPlanes: PlaneEquation[] = [
    {
      id: "axis-x1",
      label: "X1 = 0",
      description: "Plano coordenado donde X1 = 0.",
      coefficients: [1, 0, 0],
      rhs: 0,
      kind: "axis",
    },
    {
      id: "axis-x2",
      label: "X2 = 0",
      description: "Plano coordenado donde X2 = 0.",
      coefficients: [0, 1, 0],
      rhs: 0,
      kind: "axis",
    },
    {
      id: "axis-x3",
      label: "X3 = 0",
      description: "Plano coordenado donde X3 = 0.",
      coefficients: [0, 0, 1],
      rhs: 0,
      kind: "axis",
    },
  ];

  return [...constraintPlanes, ...axisPlanes];
};

const buildConstraintPlaneMeshes = (
  problem: LinearProgrammingProblem,
  bounds: { x: number; y: number; z: number },
): ConstraintPlane3D[] => {
  return problem.constraints.map((constraint, index) => {
    const coefficients: [number, number, number] = [
      constraint.coefficients[0] ?? 0,
      constraint.coefficients[1] ?? 0,
      constraint.coefficients[2] ?? 0,
    ];
    const magnitude = Math.hypot(...coefficients) || 1;
    const normal = coefficients.map((value) => value / magnitude) as [number, number, number];
    const anchor: [number, number, number] =
      Math.abs(coefficients[0]) > EPSILON
        ? [constraint.rhs / coefficients[0], 0, 0]
        : Math.abs(coefficients[1]) > EPSILON
          ? [0, constraint.rhs / coefficients[1], 0]
          : [0, 0, constraint.rhs / Math.max(coefficients[2], EPSILON)];

    return {
      id: `constraint-plane-${index + 1}`,
      label: `R${index + 1}`,
      description: `${formatConstraint(constraint).replace(/<=/g, "≤")} dentro del cubo [0, ${formatNumber(bounds.x)}] x [0, ${formatNumber(bounds.y)}] x [0, ${formatNumber(bounds.z)}].`,
      coefficients,
      rhs: constraint.rhs,
      normal,
      anchor,
      color: PLANE_COLORS[index % PLANE_COLORS.length],
    };
  });
};

const buildThreeDimensionalStages = (
  problem: LinearProgrammingProblem,
  planes: ConstraintPlane3D[],
  points: SpacePoint3D[],
  optimalPoint?: SpacePoint3D,
): ThreeDimensionalStage[] => {
  const evaluationOrder = [...points].sort((left, right) => {
    if (problem.optimizationType === "min") {
      return (
        right.objectiveValue - left.objectiveValue || left.label.localeCompare(right.label, "es")
      );
    }

    return (
      left.objectiveValue - right.objectiveValue || left.label.localeCompare(right.label, "es")
    );
  });

  const stages: ThreeDimensionalStage[] = [
    {
      id: "space",
      title: "Espacio tridimensional",
      description:
        "Se muestran los ejes X1, X2 y X3, junto con la rejilla y la caja de referencia del espacio factible.",
      kind: "space",
      notes: [
        "El gráfico usa una vista cartesiana 3D con fondo claro para mantener coherencia con la aplicación.",
        "La rejilla base y la caja de referencia ayudan a leer escalas y posiciones.",
      ],
    },
  ];

  planes.forEach((plane, index) => {
    stages.push({
      id: `constraint-${index + 1}`,
      title: `${index + 1}. Restricción ${index + 1}`,
      description: `Se incorpora el plano ${plane.label}, que representa ${plane.description}`,
      kind: "constraint",
      focusPlaneId: plane.id,
      revealedPlaneIds: planes.slice(0, index + 1).map((item) => item.id),
      notes: [
        `Plano ${plane.label}: ${formatConstraint(problem.constraints[index]).replace(/<=/g, "≤")}.`,
        "La región factible siempre queda del lado que satisface la desigualdad.",
      ],
    });
  });

  stages.push({
    id: "region",
    title: "Región factible",
    description:
      "Se revelan los vértices factibles detectados por intersección de planos de restricción y planos coordenados.",
    kind: "region",
    revealedPlaneIds: planes.map((plane) => plane.id),
    revealedPointIds: points.map((point) => point.id),
    notes: [
      "En tres variables la región factible es un poliedro. Aquí se visualizan los vértices y planos relevantes obtenidos por el cálculo exacto del modelo.",
      "La escena no inventa superficies adicionales: muestra planos, vértices factibles y el punto óptimo calculado por el solver.",
    ],
  });

  stages.push({
    id: "vertices",
    title: "Vértices factibles",
    description:
      "Cada vértice se etiqueta con una letra para poder comparar coordenadas y valor de Z en el panel lateral.",
    kind: "vertices",
    revealedPlaneIds: planes.map((plane) => plane.id),
    revealedPointIds: points.map((point) => point.id),
    notes: [
      "Los vértices A, B, C, ... son candidatos al óptimo global por la geometría de Programación Lineal.",
    ],
  });

  evaluationOrder.forEach((point, index) => {
    stages.push({
      id: `evaluation-${point.id}`,
      title: `Evaluación de Z en ${point.label}`,
      description: `Se evalúa la función objetivo en ${point.label} = (${formatNumber(point.x)}, ${formatNumber(point.y)}, ${formatNumber(point.z)}), obteniendo Z = ${formatNumber(point.objectiveValue)}.`,
      kind: "evaluation",
      focusPointId: point.id,
      revealedPlaneIds: planes.map((plane) => plane.id),
      revealedPointIds: points.map((candidate) => candidate.id),
      notes: [
        `Sustitución: ${formatNumber(problem.objectiveCoefficients[0])}(${formatNumber(point.x)}) + ${formatNumber(problem.objectiveCoefficients[1])}(${formatNumber(point.y)}) + ${formatNumber(problem.objectiveCoefficients[2])}(${formatNumber(point.z)}) = ${formatNumber(point.objectiveValue)}.`,
        index === evaluationOrder.length - 1
          ? "Esta etapa deja lista la comparación completa de vértices antes de identificar el óptimo."
          : "Se compara este valor con los demás vértices factibles del modelo.",
      ],
    });
  });

  stages.push({
    id: "direction",
    title: "Dirección de optimización",
    description:
      problem.optimizationType === "min"
        ? "La escala de color muestra cómo disminuye Z hasta llegar al vértice óptimo global dentro de la región factible."
        : "La escala de color muestra cómo aumenta Z hasta llegar al vértice óptimo global dentro de la región factible.",
    kind: "direction",
    revealedPlaneIds: planes.map((plane) => plane.id),
    revealedPointIds: points.map((point) => point.id),
    focusPointId: optimalPoint?.id,
    notes: [
      problem.optimizationType === "min"
        ? "Los colores fríos y cálidos permiten seguir la tendencia de la función objetivo sin forzar una flecha geométrica imprecisa."
        : "Los colores fríos y cálidos permiten seguir la tendencia de la función objetivo sin forzar una flecha geométrica imprecisa.",
    ],
  });

  stages.push({
    id: "optimal",
    title: "Punto óptimo",
    description: optimalPoint
      ? `Se resalta el ${problem.optimizationType === "min" ? "mínimo global" : "máximo global"} en (${formatNumber(optimalPoint.x)}, ${formatNumber(optimalPoint.y)}, ${formatNumber(optimalPoint.z)}) con Z = ${formatNumber(optimalPoint.objectiveValue)}.`
      : `Se resalta el vértice de ${problem.optimizationType === "min" ? "mínimo global" : "máximo global"} detectado por el solver.`,
    kind: "optimal",
    focusPointId: optimalPoint?.id,
    revealedPlaneIds: planes.map((plane) => plane.id),
    revealedPointIds: points.map((point) => point.id),
    notes: [
      optimalPoint
        ? `Restricciones activas: ${optimalPoint.activeConstraints.length > 0 ? optimalPoint.activeConstraints.join(", ") : "sin restricciones activas de desigualdad"}.`
        : "El solver determina el óptimo global sobre la región factible.",
      `${problem.optimizationType === "min" ? "Mínimo global" : "Máximo global"} en la región factible.`,
    ],
  });

  stages.push({
    id: "conclusion",
    title: "Conclusión",
    description: `La escena resume planos de restricciones, vértices factibles y el punto de ${problem.optimizationType === "min" ? "mínimo global" : "máximo global"} obtenido por el método Simplex para el modelo de tres variables.`,
    kind: "conclusion",
    focusPointId: optimalPoint?.id,
    revealedPlaneIds: planes.map((plane) => plane.id),
    revealedPointIds: points.map((point) => point.id),
    notes: [
      "La visualización 3D es una lectura geométrica complementaria del resultado tabular, no un cálculo distinto.",
      problem.optimizationType === "min"
        ? "El punto resaltado corresponde al menor valor de Z entre los vértices factibles detectados."
        : "El punto resaltado corresponde al mayor valor de Z entre los vértices factibles detectados.",
    ],
  });

  return stages;
};

export const buildThreeDimensionalVisualization = (
  problem: LinearProgrammingProblem,
  result: SimplexResult,
): ThreeDimensionalVisualization => {
  if (problem.objectiveCoefficients.length !== 3) {
    return {
      available: false,
      message:
        "La visualización 3D solo está disponible cuando el modelo tiene exactamente tres variables de decisión.",
      optimizationType: problem.optimizationType,
      bounds: { x: 0, y: 0, z: 0 },
      planes: [],
      feasiblePoints: [],
      stages: [],
      notes: [],
    };
  }

  const planes = buildPlanes(problem);
  const candidatePoints: Array<[number, number, number]> = [[0, 0, 0]];

  for (let first = 0; first < planes.length; first += 1) {
    for (let second = first + 1; second < planes.length; second += 1) {
      for (let third = second + 1; third < planes.length; third += 1) {
        const point = solve3x3(
          [planes[first].coefficients, planes[second].coefficients, planes[third].coefficients],
          [planes[first].rhs, planes[second].rhs, planes[third].rhs],
        );

        if (point && isFeasiblePoint(problem, point)) {
          candidatePoints.push(
            point.map((value) => roundForDisplay(value)) as [number, number, number],
          );
        }
      }
    }
  }

  const feasibleCandidates = uniquePoints(candidatePoints).map((point, index) => {
    const objectiveValue = roundForDisplay(
      problem.objectiveCoefficients.reduce(
        (sum, coefficient, coefficientIndex) => sum + coefficient * point[coefficientIndex],
        0,
      ),
    );

    const activeConstraints = problem.constraints
      .map((constraint, constraintIndex) => {
        const evaluated = constraint.coefficients.reduce(
          (sum, coefficient, coefficientIndex) => sum + coefficient * point[coefficientIndex],
          0,
        );

        return Math.abs(evaluated - constraint.rhs) < 1e-5 ? `R${constraintIndex + 1}` : null;
      })
      .filter((label): label is string => Boolean(label));

    return {
      id: `point-${index + 1}`,
      label: String.fromCharCode(65 + index),
      x: point[0],
      y: point[1],
      z: point[2],
      objectiveValue,
      activeConstraints,
    } satisfies SpacePoint3D;
  });

  const optimalPointFromResult =
    result.decisionVariables.X1 !== undefined &&
    result.decisionVariables.X2 !== undefined &&
    result.decisionVariables.X3 !== undefined
      ? {
          x: roundForDisplay(result.decisionVariables.X1),
          y: roundForDisplay(result.decisionVariables.X2),
          z: roundForDisplay(result.decisionVariables.X3),
        }
      : null;

  const optimalPoint =
    feasibleCandidates.find(
      (candidate) =>
        optimalPointFromResult !== null &&
        Math.abs(candidate.x - optimalPointFromResult.x) < 1e-5 &&
        Math.abs(candidate.y - optimalPointFromResult.y) < 1e-5 &&
        Math.abs(candidate.z - optimalPointFromResult.z) < 1e-5,
    ) ??
    feasibleCandidates.reduce<SpacePoint3D | undefined>((best, current) => {
      if (!best) {
        return current;
      }

      if (problem.optimizationType === "min") {
        return current.objectiveValue < best.objectiveValue - EPSILON ? current : best;
      }

      return current.objectiveValue > best.objectiveValue + EPSILON ? current : best;
    }, undefined);

  const xBounds = Math.max(
    1,
    ...feasibleCandidates.map((candidate) => candidate.x),
    ...problem.constraints
      .filter((constraint) => (constraint.coefficients[0] ?? 0) > EPSILON)
      .map((constraint) => constraint.rhs / (constraint.coefficients[0] ?? 1)),
  );
  const yBounds = Math.max(
    1,
    ...feasibleCandidates.map((candidate) => candidate.y),
    ...problem.constraints
      .filter((constraint) => (constraint.coefficients[1] ?? 0) > EPSILON)
      .map((constraint) => constraint.rhs / (constraint.coefficients[1] ?? 1)),
  );
  const zBounds = Math.max(
    1,
    ...feasibleCandidates.map((candidate) => candidate.z),
    ...problem.constraints
      .filter((constraint) => (constraint.coefficients[2] ?? 0) > EPSILON)
      .map((constraint) => constraint.rhs / (constraint.coefficients[2] ?? 1)),
  );

  const bounds = {
    x: roundForDisplay(xBounds * 1.15),
    y: roundForDisplay(yBounds * 1.15),
    z: roundForDisplay(zBounds * 1.15),
  };

  return {
    available: true,
    optimizationType: problem.optimizationType,
    bounds,
    planes: buildConstraintPlaneMeshes(problem, bounds),
    feasiblePoints: feasibleCandidates,
    optimalPoint,
    stages: buildThreeDimensionalStages(
      problem,
      buildConstraintPlaneMeshes(problem, bounds),
      feasibleCandidates,
      optimalPoint,
    ),
    notes: [
      `Para tres variables, la región factible vive en 3D y el ${problem.optimizationType === "min" ? "mínimo global" : "máximo global"} de Programación Lineal sigue ocurriendo en un vértice factible cuando existe solución óptima.`,
      "La escena muestra planos de restricciones semitransparentes y los vértices factibles obtenidos por intersección de restricciones y planos coordenados.",
    ],
  };
};
