export const getSourceColor = (source) => {
  switch (source) {
    case "Djinni":
      return "#22c55e";
    case "DOU":
      return "#3b82f6";
    case "LinkedIn":
      return "#4f46e5";
    case "Manual":
      return "#9ca3af";
    case "Talent Pool":
      return "#a855f7";
    case "Referral":
      return "#de941c";
    default:
      return "#111827";
  }
};

export const formatSourceName = (source) => {
  if (!source) return "";
  if (source.toLowerCase() === "dou") return "DOU";
  if (source.toLowerCase() === "linkedin") return "LinkedIn";
  if (source.toLowerCase() === "talent_pool") return "Talent Pool";

  const formatted = source.split("_").join(" ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};
