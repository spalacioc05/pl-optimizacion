interface ConstraintsInputProps {
  constraints: Array<{
    coefficients: string[];
    rhs: string;
  }>;
  onCoefficientChange: (rowIndex: number, columnIndex: number, value: string) => void;
  onRhsChange: (rowIndex: number, value: string) => void;
}

const ConstraintsInput = ({ constraints, onCoefficientChange, onRhsChange }: ConstraintsInputProps) => {
  return (
    <section className="form-section">
      <div className="section-heading">
        <h3>Restricciones</h3>
        <p>Todas las restricciones del sprint 1 son del tipo menor o igual que.</p>
      </div>

      <div className="constraints-stack">
        {constraints.map((constraint, rowIndex) => (
          <div key={`constraint-${rowIndex}`} className="constraint-row-card">
            <div className="constraint-title">Restricción {rowIndex + 1}</div>
            <div className="constraint-equation">
              {constraint.coefficients.map((coefficient, columnIndex) => (
                <label key={`constraint-${rowIndex}-${columnIndex}`} className="coefficient-field">
                  <span>{`Coef. X${columnIndex + 1}`}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={coefficient}
                    onChange={(event) => onCoefficientChange(rowIndex, columnIndex, event.target.value)}
                    placeholder="0"
                  />
                </label>
              ))}
              <span className="constraint-operator">&lt;=</span>
              <label className="coefficient-field rhs-field">
                <span>Lado derecho</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={constraint.rhs}
                  onChange={(event) => onRhsChange(rowIndex, event.target.value)}
                  placeholder="0"
                  min="0"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ConstraintsInput;
