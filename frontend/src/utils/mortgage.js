export function calculateMortgage({ price, downPayment, annualRate, years }) {
  const principal = Math.max(Number(price) - Number(downPayment), 0);
  const months = Math.round(Number(years) * 12);
  if (!(principal > 0) || !(months > 0)) return { principal: Math.max(principal, 0), monthly: 0, total: 0, interest: 0 };

  const r = Number(annualRate) / 100 / 12;
  const monthly = r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
  const total = monthly * months;
  return { principal, monthly, total, interest: total - principal };
}
