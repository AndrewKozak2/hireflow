const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Formats a numeric amount as a USD currency string.
 * @param {number|null|undefined} amount
 * @returns {string}
 */
export function formatUSD(amount) {
  if (amount == null || isNaN(amount)) return "—";
  return usdFormatter.format(amount);
}
