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
        <p>Todas las restricciones del sprint 1 son del tipo ≤ y deben tener lado derecho no negativo.</p>
      </div>

      <div className="constraints-stack">
        {constraints.map((constraint, rowIndex) => (
          <div key={`constraint-${rowIndex}`} className="constraint-row-card">
            <div className="constraint-card-header">
              <div className="constraint-title">Restricción {rowIndex + 1}</div>
              <span className="constraint-type-pill">≤</span>
            </div>
            <div className="constraint-equation">
              {constraint.coefficients.map((coefficient, columnIndex) => (
                <label key={`constraint-${rowIndex}-${columnIndex}`} className="equation-term-card compact-term-card">
                  <span className="equation-term-caption">Coeficiente</span>
                  <div className="equation-term-input">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={coefficient}
                      onChange={(event) => onCoefficientChange(rowIndex, columnIndex, event.target.value)}
                      placeholder="0"
                    />
                    <span className="variable-chip">{`X${columnIndex + 1}`}</span>
                  </div>
                </label>
              ))}
              <span className="constraint-operator">≤</span>
              <label className="equation-term-card rhs-card">
                <span className="equation-term-caption">Lado derecho</span>
                <div className="equation-term-input">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={constraint.rhs}
                    onChange={(event) => onRhsChange(rowIndex, event.target.value)}
                    placeholder="0"
                    min="0"
                  />
                  <span className="variable-chip rhs-chip">LD</span>
                </div>
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ConstraintsInput;
