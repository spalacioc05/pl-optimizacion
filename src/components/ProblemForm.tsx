import ObjectiveFunctionInput from './ObjectiveFunctionInput';
import ConstraintsInput from './ConstraintsInput';
import { ProblemDraft } from '../simplex/simplexTypes';

interface ProblemFormProps {
  draft: ProblemDraft;
  errors: string[];
  onVariableCountChange: (value: number) => void;
  onConstraintCountChange: (value: number) => void;
  onObjectiveChange: (index: number, value: string) => void;
  onConstraintCoefficientChange: (rowIndex: number, columnIndex: number, value: string) => void;
  onConstraintRhsChange: (rowIndex: number, value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
}

const ProblemForm = ({
  draft,
  errors,
  onVariableCountChange,
  onConstraintCountChange,
  onObjectiveChange,
  onConstraintCoefficientChange,
  onConstraintRhsChange,
  onSubmit,
  onReset,
}: ProblemFormProps) => {
  return (
    <section className="panel panel-form">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Pantalla principal</p>
          <h2>Modelo en forma básica</h2>
        </div>
        <p className="panel-copy">
          Ingresa el problema de programación lineal antes de agregar holguras. El solver convertirá el modelo y mostrará cada tablero Simplex.
        </p>
      </div>

      <div className="dimension-grid">
        <label className="coefficient-field compact-field">
          <span>Número de variables</span>
          <input
            type="number"
            min="1"
            value={draft.variableCount}
            onChange={(event) => onVariableCountChange(Number(event.target.value))}
          />
        </label>
        <label className="coefficient-field compact-field">
          <span>Número de restricciones</span>
          <input
            type="number"
            min="1"
            value={draft.constraintCount}
            onChange={(event) => onConstraintCountChange(Number(event.target.value))}
          />
        </label>
        <div className="fixed-option-card">
          <span className="fixed-option-label">Tipo de modelo</span>
          <strong>Maximización con restricciones &lt;=</strong>
        </div>
      </div>

      <ObjectiveFunctionInput coefficients={draft.objectiveCoefficients} onCoefficientChange={onObjectiveChange} />
      <ConstraintsInput
        constraints={draft.constraints}
        onCoefficientChange={onConstraintCoefficientChange}
        onRhsChange={onConstraintRhsChange}
      />

      {errors.length > 0 ? (
        <div className="alert-list" role="alert">
          <h3>Revisa estos datos antes de resolver</h3>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="actions-row">
        <button type="button" className="button button-secondary" onClick={onReset}>
          Limpiar formulario
        </button>
        <button type="button" className="button button-primary" onClick={onSubmit}>
          Resolver con Método Simplex
        </button>
      </div>
    </section>
  );
};

export default ProblemForm;
