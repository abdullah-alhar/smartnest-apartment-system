import { Phone } from "lucide-react";
import { Field } from "./ui";
import { cx } from "./styles";

const COUNTRY_PREFIX = "+94";

function PhoneInput({ id, value, onChange, required = false, error, label = "Contact Number" }) {
  const digits = (value || "").replace(/^\+94/, "");

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 9);
    onChange(`${COUNTRY_PREFIX}${raw}`);
  };

  return (
    <Field label={label} htmlFor={id} error={error} hint="9 digits, e.g. 712345678">
      <div className={cx(
        "flex items-stretch rounded-xl border bg-white overflow-hidden transition-all focus-within:ring-2",
        error ? "border-red-400 focus-within:ring-red-200" : "border-grey-200 focus-within:border-accent focus-within:ring-accent/30",
      )}>
        <span className="flex items-center gap-1.5 px-3 bg-off-white border-r border-grey-200 text-sm font-medium text-grey-500">
          <Phone size={14} /> {COUNTRY_PREFIX}
        </span>
        <input id={id} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="7XXXXXXXX"
          className="flex-1 min-w-0 px-3 py-2.5 text-sm text-primary placeholder:text-grey-400 bg-transparent"
          value={digits} onChange={handleChange} maxLength={9} required={required} />
      </div>
    </Field>
  );
}

export default PhoneInput;
export { COUNTRY_PREFIX };
