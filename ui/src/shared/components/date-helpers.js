import dayjs from "dayjs";

export const getDatesForPreset = (preset) => {
  const today = dayjs();
  let from, to;

  switch (preset) {
    case "7d":
      from = today.subtract(7, "days");
      to = today;
      break;
    case "30d":
      from = today.subtract(30, "days");
      to = today;
      break;
    case "3months":
      from = today.subtract(3, "months");
      to = today;
      break;
    case "6months":
      from = today.subtract(6, "months");
      to = today;
      break;
    default:
      from = today.subtract(30, "days");
      to = today;
      break;
  }
  return { from: from.format("YYYY-MM-DD"), to: to.format("YYYY-MM-DD") };
};

export const isValidDateRange = (from, to) => {
  const startDate = dayjs(from);
  const endDate = dayjs(to);
  const today = dayjs();

  return (
    startDate.isValid() &&
    endDate.isValid() &&
    startDate.isSameOrBefore(endDate) &&
    endDate.isSameOrBefore(today)
  );
};
