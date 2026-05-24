import type {
  LinearProgrammingProblem,
  SensitivityAnalysis,
  SimplexResult,
} from "@/lib/linear-programming/types";
import { EPSILON, buildVariableNames, roundForDisplay } from "@/lib/linear-programming/utils";

export const buildSensitivityAnalysis = (
  problem: LinearProgrammingProblem,
  result: SimplexResult,
): SensitivityAnalysis => {
  const finalTableau = result.iterations[result.iterations.length - 1]?.resultTableau;

  if (result.status !== "optimal" || !finalTableau) {
    return {
      available: false,
      message:
        "El análisis de sensibilidad base se genera cuando existe un tablero óptimo final del método Simplex.",
      optimalValue: result.optimalValue,
      basicVariables: [],
      nonBasicVariables: [],
      slackVariables: [],
      activeConstraints: [],
      inactiveConstraints: [],
      constraintRows: [],
      reducedCostRows: [],
      shadowPriceRows: [],
      objectiveRangeRows: [],
      rhsRangeRows: [],
      notes: [],
    };
  }

  const decisionVariables = buildVariableNames("X", problem.objectiveCoefficients.length);
  const slackVariables = buildVariableNames("S", problem.constraints.length);
  const row0 = finalTableau.rows[0];
  const basicVariables = finalTableau.basicVariables.slice(1);
  const allVariables = finalTableau.headers.slice(1, finalTableau.headers.length - 1);
  const nonBasicVariables = allVariables.filter((variable) => !basicVariables.includes(variable));
  const slackVariableValues = slackVariables.map((variable) => ({
    variable,
    value: result.slackVariables[variable] ?? 0,
  }));

  const activeConstraints: string[] = [];
  const inactiveConstraints: string[] = [];

  const constraintRows = problem.constraints.map((constraint, index) => {
    const slack = roundForDisplay(result.slackVariables[`S${index + 1}`] ?? 0);
    const isActive = Math.abs(slack) < EPSILON;
    const label = `R${index + 1}`;

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
        ? "Recurso completamente usado en la solución óptima."
        : "Tiene recurso disponible y no limita el óptimo actual.",
    };
  });

  const reducedCostRows = decisionVariables.map((variable) => {
    const headerIndex = finalTableau.headers.indexOf(variable);
    const reducedCost = roundForDisplay(headerIndex >= 0 ? row0[headerIndex] : 0);
    const isBasic = basicVariables.includes(variable);

    return {
      variable,
      finalValue: roundForDisplay(result.decisionVariables[variable] ?? 0),
      reducedCost,
      status: isBasic ? "Básica" : "No básica",
      interpretation: isBasic
        ? "Permanece en la base actual y por eso su costo reducido es 0."
        : Math.abs(reducedCost) < EPSILON
          ? "Su costo reducido es 0; podría existir un óptimo alterno con la misma base dual."
          : `Necesitaría mejorar ${reducedCost} unidades su contribución a Z para entrar a la base actual.`,
    };
  });

  const shadowPriceRows = problem.constraints.map((_, index) => {
    const label = `R${index + 1}`;
    const slack = roundForDisplay(result.slackVariables[`S${index + 1}`] ?? 0);
    const slackHeaderIndex = finalTableau.headers.indexOf(`S${index + 1}`);
    const shadowPrice = roundForDisplay(slackHeaderIndex >= 0 ? row0[slackHeaderIndex] : 0);
    const isActive = Math.abs(slack) < EPSILON;

    return {
      constraint: label,
      shadowPrice,
      slack,
      status: isActive ? "Activa" : "Con holgura",
      interpretation: isActive
        ? Math.abs(shadowPrice) < EPSILON
          ? "La restricción está activa, pero un cambio marginal no modifica Z en esta base."
          : `Cada unidad adicional del recurso mejoraría Z en ${shadowPrice}, mientras se mantenga la misma base óptima.`
        : "La restricción no es limitante en el óptimo y su impacto marginal actual es nulo.",
    };
  });

  const objectiveRangeRows = decisionVariables.map((variable, index) => ({
    variable,
    currentCoefficient: problem.objectiveCoefficients[index],
    allowableIncrease: "Pendiente de cálculo completo",
    allowableDecrease: "Pendiente de cálculo completo",
    status: "Estructura lista",
  }));

  const rhsRangeRows = problem.constraints.map((constraint, index) => ({
    constraint: `R${index + 1}`,
    rhs: constraint.rhs,
    allowableIncrease: "Pendiente de cálculo completo",
    allowableDecrease: "Pendiente de cálculo completo",
    status: "Estructura lista",
  }));

  return {
    available: true,
    optimalValue: result.optimalValue,
    basicVariables,
    nonBasicVariables,
    slackVariables: slackVariableValues,
    activeConstraints,
    inactiveConstraints,
    constraintRows,
    reducedCostRows,
    shadowPriceRows,
    objectiveRangeRows,
    rhsRangeRows,
    notes: [
      "Los precios sombra se leen en la fila Z bajo las variables de holgura del tablero final para este modelo de maximización con restricciones <=.",
      "Los rangos permisibles completos quedan preparados en la interfaz, pero su cálculo detallado se deja para una ampliación posterior.",
    ],
  };
};
