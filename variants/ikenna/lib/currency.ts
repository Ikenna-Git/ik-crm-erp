export function formatNaira(amount: number, abbreviated = false): string {
  if (abbreviated && amount >= 1000) {
    return `₦${(amount / 1000).toFixed(1)}k`
  }
  return `₦${amount.toLocaleString()}`
}
