import { useState } from "react";
import { Calculator } from "lucide-react";
import { calculateMortgage } from "../utils/mortgage";
import { fmtPrice } from "../utils/format";
import { Input } from "./ui";

function MortgageCalculator({ price }) {
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(9);
  const [years, setYears] = useState(20);

  const num = (v) => (v === "" ? 0 : Number(v));
  const downPayment = (Number(price) * num(downPct)) / 100;
  const result = calculateMortgage({ price, downPayment, annualRate: num(rate), years: num(years) });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Input id="mc-price" label="Apartment price" value={fmtPrice(price)} readOnly /></div>
        <Input id="mc-down" label="Down payment (%)" type="number" min="0" max="90" step="1" value={downPct}
          onChange={(e) => setDownPct(e.target.value)} hint={`= ${fmtPrice(downPayment)}`} />
        <Input id="mc-rate" label="Interest (% / year)" type="number" min="0" max="40" step="0.1" value={rate}
          onChange={(e) => setRate(e.target.value)} />
        <div className="col-span-2">
          <Input id="mc-years" label="Loan period (years)" type="number" min="1" max="40" step="1" value={years}
            onChange={(e) => setYears(e.target.value)} />
        </div>
      </div>

      <div className="bg-primary rounded-2xl p-6 text-white flex flex-col" aria-live="polite">
        <span className="flex items-center gap-1.5 text-xs text-white/50 uppercase tracking-wider"><Calculator size={14} /> Estimated monthly payment</span>
        <strong className="text-3xl font-bold text-accent-light mt-2 mb-5">{fmtPrice(result.monthly)}</strong>
        <dl className="grid grid-cols-2 gap-y-2 text-sm mt-auto">
          <dt className="text-white/50">Loan amount</dt><dd className="text-right font-medium">{fmtPrice(result.principal)}</dd>
          <dt className="text-white/50">Total interest</dt><dd className="text-right font-medium">{fmtPrice(result.interest)}</dd>
          <dt className="text-white/50">Total repayment</dt><dd className="text-right font-medium">{fmtPrice(result.total)}</dd>
        </dl>
        <p className="text-[11px] text-white/40 mt-4">An estimate only — your bank's actual offer may differ.</p>
      </div>
    </div>
  );
}

export default MortgageCalculator;
