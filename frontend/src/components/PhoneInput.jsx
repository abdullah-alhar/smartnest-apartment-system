import { Phone, AlertCircle } from "lucide-react";

const COUNTRY_PREFIX = "+94";

// +94 prefix is fixed; value/onChange always carry the full "+94XXXXXXXXX" string
function PhoneInput({ id, value, onChange, required = false, error, label = "Contact Number" }) {
  const digits = (value || "").replace(/^\+94/, "");

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 9);
    onChange(`${COUNTRY_PREFIX}${raw}`);
  };

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <div className={`phone-input ${error ? "phone-input-error" : ""}`}>
        <span className="phone-input-prefix">
          <Phone size={14} />
          {COUNTRY_PREFIX}
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          className="phone-input-field"
          placeholder="7XXXXXXXX"
          value={digits}
          onChange={handleChange}
          maxLength={9}
          required={required}
        />
      </div>
      {error && (
        <span className="field-error">
          <AlertCircle size={13} />
          {error}
        </span>
      )}
      {!error && <span className="form-hint">9 digits, e.g. 712345678</span>}
    </div>
  );
}

export default PhoneInput;
export { COUNTRY_PREFIX };
