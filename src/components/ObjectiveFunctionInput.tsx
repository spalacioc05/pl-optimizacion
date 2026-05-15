interface ObjectiveFunctionInputProps {
  coefficients: string[];
  onCoefficientChange: (index: number, value: string) => void;
}

const ObjectiveFunctionInput = ({ coefficients, onCoefficientChange }: ObjectiveFunctionInputProps) => {
  return (
    <section className="form-section">
      <div className="section-heading">
        <h3>Función objetivo</h3>
        <p>Configura los coeficientes de la función objetivo de maximización.</p>
      </div>

      <div className="objective-equation-shell">
        <span className="equation-badge">Max Z =</span>
        <div className="objective-term-grid">
          {coefficients.map((coefficient, index) => (
            <label key={`objective-${index}`} className="equation-term-card">
              <span className="equation-term-caption">Coeficiente</span>
              <div className="equation-term-input">
                <input
                  type="number"
                  inputMode="decimal"
                  value={coefficient}
                  onChange={(event) => onCoefficientChange(index, event.target.value)}
                  placeholder="0"
                />
                <span className="variable-chip">{`X${index + 1}`}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ObjectiveFunctionInput;
