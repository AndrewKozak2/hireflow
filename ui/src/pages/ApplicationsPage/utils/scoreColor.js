export function scoreColor(score) {
  if (score >= 75) return "green";
  if (score >= 50) return "yellow";
  return "red";
}
