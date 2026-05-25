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
    const isMinimization = problem.optimizationType === "min";

    return {
      variable,
      finalValue: roundForDisplay(result.decisionVariables[variable] ?? 0),
      reducedCost,
      status: isBasic ? "Básica" : "No básica",
      interpretation: isBasic
        ? "Permanece en la base actual y por eso su costo reducido es 0."
        : isMinimization
          ? "La lectura del costo reducido corresponde al modelo equivalente W = -Z usado por el solver. La interpretación económica directa para la minimización original queda indicada solo como referencia técnica."
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
    const isMinimization = problem.optimizationType === "min";

    return {
      constraint: label,
      shadowPrice,
      slack,
      status: isActive ? "Activa" : "Con holgura",
      interpretation: isActive
        ? isMinimization
          ? "El valor mostrado proviene del tablero equivalente W = -Z. Se conserva como referencia numérica, pero la interpretación directa del signo para la minimización original se deja pendiente para evitar conclusiones incorrectas."
          : Math.abs(shadowPrice) < EPSILON
            ? "La restricción está activa, pero un cambio marginal no modifica Z en esta base."
            : `Cada unidad adicional del recurso mejoraría Z en ${shadowPrice}, mientras se mantenga la misma base óptima.`
        : isMinimization
          ? "La restricción no es limitante y su lectura marginal se mantiene solo como referencia del modelo equivalente transformado."
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
      problem.optimizationType === "min"
        ? "El modelo original se transformó a maximización de -Z; por eso esta lectura base interpreta el tablero óptimo equivalente antes de volver al signo original de la función objetivo."
        : "Los precios sombra se leen en la fila Z bajo las variables de holgura del tablero final para este modelo de maximización con restricciones <=.",
      problem.optimizationType === "min"
        ? "Para minimización, los precios sombra y costos reducidos se muestran como referencia del modelo equivalente W = -Z sin forzar una interpretación económica del signo en el problema original."
        : "Los costos reducidos y precios sombra se presentan con interpretación operativa directa para el modelo original.",
      "Los rangos permisibles completos quedan preparados en la interfaz, pero su cálculo detallado se deja para una ampliación posterior.",
    ],
  };
};
