import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { LinearProgrammingDraft } from "@/lib/linear-programming/types";
import { minimizationTransformationMessage } from "@/lib/linear-programming/utils";

interface Props {
  draft: LinearProgrammingDraft;
  errors: string[];
  onAddVariable: () => void;
  onRemoveVariable: () => void;
  onAddConstraint: () => void;
  onRemoveLastConstraint: () => void;
  onRemoveConstraint: (rowIndex: number) => void;
  onOptimizationTypeChange: (value: LinearProgrammingDraft["optimizationType"]) => void;
  onObjectiveChange: (index: number, value: string) => void;
  onConstraintCoefficientChange: (rowIndex: number, columnIndex: number, value: string) => void;
  onConstraintRhsChange: (rowIndex: number, value: string) => void;
  onSolve: () => void;
  onReset: () => void;
}

function CoefInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-14 rounded-lg border border-input bg-surface px-2 text-center font-mono text-sm shadow-elevation-1 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/40"
    />
  );
}

function ActionButton({
  label,
  onClick,
  disabled = false,
  primary = false,
  className = "",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 w-full items-center justify-center whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:shadow-elevation-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-45 ${
        primary ? "gradient-primary text-primary-foreground" : "bg-surface text-foreground"
      } ${className}`}
    >
      {label}
    </button>
  );
}

function OverviewCard({
  title,
  value,
  description,
  children,
  className = "",
  compact = false,
}: {
  title: string;
  value?: string | number;
  description: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm ${className}`}
    >
      <div className={`flex h-full flex-col gap-4 ${compact ? "min-h-0" : "min-h-[164px]"}`}>
        <div className="min-w-0 space-y-2">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </div>
          {value !== undefined ? (
            <div className="font-mono text-4xl font-bold leading-none text-primary-dark">
              {value}
            </div>
          ) : null}
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className="mt-auto min-w-0">{children}</div>
      </div>
    </div>
  );
}

export function LinearModelForm({
  draft,
  errors,
  onAddVariable,
  onRemoveVariable,
  onAddConstraint,
  onRemoveLastConstraint,
  onRemoveConstraint,
  onOptimizationTypeChange,
  onObjectiveChange,
  onConstraintCoefficientChange,
  onConstraintRhsChange,
  onSolve,
  onReset,
}: Props) {
  return (
    <section className="md-surface p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Modelo lineal
          </h2>
          <p className="text-xs text-muted-foreground/80">
            Edita la función objetivo, variables y restricciones del problema.
          </p>
        </div>
      </div>

      <div className="mb-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <OverviewCard
            title="Variables"
            value={draft.variableCount}
            description="Ajusta las variables del modelo."
          >
            <div className="flex flex-wrap gap-2">
              <ActionButton
                label="Agregar"
                onClick={onAddVariable}
                primary
                className="min-w-[110px] flex-1"
              />
              <ActionButton
                label="Quitar"
                onClick={onRemoveVariable}
                disabled={draft.variableCount <= 1}
                className="min-w-[110px] flex-1"
              />
            </div>
          </OverviewCard>

          <OverviewCard
            title="Restricciones"
            value={draft.constraintCount}
            description="Modifica la cantidad de restricciones del modelo."
          >
            <div className="flex flex-wrap gap-2">
              <ActionButton
                label="Agregar"
                onClick={onAddConstraint}
                primary
                className="min-w-[110px] flex-1"
              />
              <ActionButton
                label="Quitar"
                onClick={onRemoveLastConstraint}
                disabled={draft.constraintCount <= 1}
                className="min-w-[110px] flex-1"
              />
            </div>
          </OverviewCard>
        </div>

        <OverviewCard
          title="Tipo de optimización"
          description="Define si el modelo busca un máximo o un mínimo."
          compact
        >
          <div className="space-y-3 md:flex md:items-center md:justify-between md:gap-4 md:space-y-0">
            <div className="grid min-w-0 grid-cols-2 gap-2 rounded-2xl bg-surface p-1 shadow-elevation-1 md:flex-1">
              {(
                [
                  { value: "max", label: "Maximizar" },
                  { value: "min", label: "Minimizar" },
                ] as const
              ).map((option) => {
                const active = draft.optimizationType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onOptimizationTypeChange(option.value)}
                    className={`min-w-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                      active
                        ? "gradient-primary text-primary-foreground shadow-elevation-1"
                        : "bg-transparent text-muted-foreground hover:bg-surface-alt"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground md:max-w-72">
              Forma básica antes de la forma aumentada.
            </p>
          </div>
        </OverviewCard>
      </div>

      {draft.variableCount !== 2 ? (
        <div className="mb-4 rounded-2xl border border-accent/20 bg-accent/5 p-3 text-sm text-primary-dark">
          {draft.variableCount === 3
            ? "El plano cartesiano 2D requiere exactamente dos variables. Con tres variables se activa la visualización 3D del espacio factible."
            : "La visualización geométrica completa solo está disponible hasta tres variables. Con cuatro o más variables se mostrará un resumen visual algebraico junto con Simplex tabular y sensibilidad."}
        </div>
      ) : null}

      {/* Objective */}
      <div className="mb-4 rounded-3xl bg-linear-to-br from-secondary/40 to-surface-alt p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark">
            Función objetivo
          </div>
          <div className="rounded-full bg-surface px-3 py-1 font-mono text-[11px] font-semibold text-primary-dark">
            Configuración del modelo
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-sm leading-loose">
          <span className="font-semibold text-primary">
            {draft.optimizationType === "min" ? "Min Z =" : "Max Z ="}
          </span>
          {draft.objectiveCoefficients.map((coefficient, index) => (
            <span
              key={index}
              className="flex items-center gap-2 rounded-2xl bg-surface/85 px-2.5 py-2 shadow-elevation-1"
            >
              {index > 0 && <span className="text-muted-foreground">+</span>}
              <CoefInput
                value={coefficient}
                onChange={(value) => onObjectiveChange(index, value)}
              />
              <span className="text-foreground">{`X${index + 1}`}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Constraints */}
      <div className="mb-4 rounded-3xl bg-surface-alt p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Restricciones
            </div>
            <div className="mt-1 text-xs text-muted-foreground/80">
              Cada restricción se mantiene sincronizada con el número actual de variables.
            </div>
          </div>
          <ActionButton label="Agregar restricción" onClick={onAddConstraint} />
        </div>
        <div className="space-y-3">
          {draft.constraints.map((constraint, rowIndex) => (
            <motion.div
              key={rowIndex}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowIndex * 0.04 }}
              className="rounded-2xl bg-surface p-3 shadow-elevation-1"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Restricción {rowIndex + 1}
                </div>
                <ActionButton
                  label="Quitar"
                  onClick={() => onRemoveConstraint(rowIndex)}
                  disabled={draft.constraintCount <= 1}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-sm leading-loose">
                {constraint.coefficients.map((coefficient, columnIndex) => (
                  <span
                    key={columnIndex}
                    className="flex items-center gap-2 rounded-2xl bg-surface-alt px-2.5 py-2"
                  >
                    {columnIndex > 0 && <span className="text-muted-foreground">+</span>}
                    <CoefInput
                      value={coefficient}
                      onChange={(value) =>
                        onConstraintCoefficientChange(rowIndex, columnIndex, value)
                      }
                    />
                    <span>{`X${columnIndex + 1}`}</span>
                  </span>
                ))}
                <span className="rounded-xl bg-secondary px-3 py-2 font-semibold text-secondary-foreground">
                  ≤
                </span>
                <span className="rounded-2xl bg-surface-alt px-2.5 py-2">
                  <CoefInput
                    value={constraint.rhs}
                    onChange={(value) => onConstraintRhsChange(rowIndex, value)}
                  />
                </span>
              </div>
            </motion.div>
          ))}
          <div className="mt-2 text-[11px] text-muted-foreground">
            {Array.from({ length: draft.variableCount }, (_, index) => `X${index + 1}`).join(", ")}{" "}
            ≥ 0
          </div>
        </div>
      </div>

      {errors.length > 0 ? (
        <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider">
            Revisa estos datos antes de resolver
          </div>
          <ul className="space-y-1">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-alt px-5 py-3 text-sm font-semibold text-foreground shadow-elevation-1 transition-shadow hover:shadow-elevation-2"
        >
          Limpiar formulario
        </button>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSolve}
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elevation-2 transition-shadow hover:shadow-elevation-3"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M5 3l14 9-14 9V3z" strokeLinejoin="round" />
          </svg>
          Resolver con Método Simplex
        </motion.button>
      </div>

      <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Acciones: agrega o elimina variables y restricciones manteniendo coherencia automática en el
        modelo antes de resolver.
      </div>

      {draft.optimizationType === "min" ? (
        <div className="mt-3 rounded-2xl border border-accent/20 bg-accent/5 p-3 text-sm text-primary-dark">
          {minimizationTransformationMessage}
        </div>
      ) : null}
    </section>
  );
}
