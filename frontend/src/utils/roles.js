export const ROLE_LABEL = {
  ADMIN: "Administrator",
  SALES_STAFF: "Sales Staff",
  CRO: "Customer Relations Officer",
  OPERATIONS_MANAGER: "Operations Manager",
  MANAGING_DIRECTOR: "Managing Director",
  MARKETING_EXECUTIVE: "Marketing Executive",
  CUSTOMER: "Customer",
};

export const roleLabel = (role) => ROLE_LABEL[role] ?? String(role ?? "").replace(/_/g, " ");

export const isStaffRole = (role) => !!role && role !== "CUSTOMER";

export const initialsOf = (firstName, lastName) =>
  [firstName, lastName].filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";

export function partOfDay() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}
