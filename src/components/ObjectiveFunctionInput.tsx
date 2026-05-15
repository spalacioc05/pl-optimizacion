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

      <div className="equation-grid objective-grid">
        <span className="pill-label">Max Z =</span>
        {coefficients.map((coefficient, index) => (
          <label key={`objective-${index}`} className="coefficient-field">
            <span>{`Coef. X${index + 1}`}</span>
            <input
              type="number"
              inputMode="decimal"
              value={coefficient}
              onChange={(event) => onCoefficientChange(index, event.target.value)}
              placeholder="0"
            />
          </label>
        ))}
      </div>
    </section>
  );
};

export default ObjectiveFunctionInput;
