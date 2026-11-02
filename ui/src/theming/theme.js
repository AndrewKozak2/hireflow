import { createTheme } from "@mantine/core";
import { appColors, colorsTheme } from "./colors";
import { fontFamily, fontSizes, headings } from "./typography";

const radius = {
  xs: "0.25rem", // 4px
  sm: "0.375rem", // 6px
  md: "0.5rem", // 8px
  lg: "0.75rem", // 12px
  xl: "1rem", // 16px
};

const spacing = {
  xs: "0.625rem", // 10px
  sm: "0.75rem", // 12px
  md: "1rem", // 16px
  lg: "1.25rem", // 20px
  xl: "2rem", // 32px
};

export const theme = createTheme({
  primaryColor: "indigo",
  white: "#ffffff",
  black: "#000000",
  colors: colorsTheme,
  fontFamily,
  fontSizes,
  headings,
  radius,
  spacing,
  defaultGradient: {
    from: "indigo",
    to: "violetAccent",
    deg: 45,
  },
  shadows: {
    xs: "0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.05), 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.04)", // 0 1px 3px, 0 1px 2px
    sm: "0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.05), 0 0.625rem 0.9375rem -0.3125rem rgba(0, 0, 0, 0.05)", // 0 1px 3px, 0 10px 15px -5px
    md: "0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.05), 0 0.75rem 1.5rem -0.25rem rgba(0, 0, 0, 0.08)", // 0 1px 3px, 0 12px 24px -4px
    lg: "0 0.25rem 1rem rgba(0, 0, 0, 0.08), 0 1.5rem 3rem -0.75rem rgba(0, 0, 0, 0.12)", // 0 4px 16px, 0 24px 48px -12px
    xl: "0 0.25rem 1rem rgba(0, 0, 0, 0.08), 0 1.5rem 3rem -0.75rem rgba(0, 0, 0, 0.12)", // same as lg in mockup set
  },
  other: {
    appColors,
  },
});
