export function compactNumber(value: number) {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en", { month: "short", day: "numeric" });
}
