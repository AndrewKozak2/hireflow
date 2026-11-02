import { Center, Loader } from "@mantine/core";

/**
 * Full-area centered spinner.
 * Replaces the <Center h={...}><Loader /></Center> pattern across pages.
 *
 * @param {{ py?: string | number, size?: string }} props
 */
export function PageLoader({ py = "xl", size = "xl" }) {
  return (
    <Center py={py}>
      <Loader size={size} />
    </Center>
  );
}
