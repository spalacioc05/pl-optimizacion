import { motion } from "framer-motion";
import type { LinearProgrammingDraft } from "@/lib/linear-programming/types";

interface Props {
  draft: LinearProgrammingDraft;
  errors: string[];
  onAddVariable: () => void;
  onRemoveVariable: () => void;
  onAddConstraint: () => void;
  onRemoveConstraint: (rowIndex: number) => void;
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
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-foreground shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {label}
    </button>
  );
}

export function LinearModelForm({
  draft,
  errors,
  onAddVariable,
  onRemoveVariable,
  onAddConstraint,
  onRemoveConstraint,
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
          <p className="text-xs text-muted-foreground/80">Edita coeficientes o usa un ejemplo</p>
        </div>
      </div>

      {/* Config */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl bg-surface-alt p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Variables
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-primary-dark">
                {draft.variableCount}
              </div>
            </div>
            <div className="grid gap-2">
              <ActionButton label="Agregar variable" onClick={onAddVariable} />
              <ActionButton
                label="Quitar variable"
                onClick={onRemoveVariable}
                disabled={draft.variableCount <= 1}
              />
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-surface-alt p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Restricciones
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-primary-dark">
                {draft.constraintCount}
              </div>
            </div>
            <div className="grid gap-2">
              <ActionButton label="Agregar restricción" onClick={onAddConstraint} />
              <div className="rounded-xl bg-surface px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                Quitar desde cada card
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-surface-alt p-3 sm:col-span-2 xl:col-span-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo
          </div>
          <div className="mt-1 rounded-xl bg-surface px-3 py-2 text-sm font-semibold text-primary-dark">
            Maximización con restricciones ≤
          </div>
          <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Forma básica antes de pasar a forma aumentada. Variables no negativas y lados derechos
            mayores o iguales a cero.
          </div>
        </div>
      </div>

      {draft.variableCount !== 2 ? (
        <div className="mb-4 rounded-2xl border border-accent/20 bg-accent/5 p-3 text-sm text-primary-dark">
          El método gráfico requiere exactamente dos variables. Si agregas una tercera variable, la
          resolución seguirá por Simplex tabular.
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
          <span className="font-semibold text-primary">Max Z =</span>
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
    </section>
  );
}
