import { Center, Loader } from "@mantine/core";

export function PageLoader({ py = "xl" }) {
  return (
    <Center py={py}>
      <Loader />
    </Center>
  );
}
