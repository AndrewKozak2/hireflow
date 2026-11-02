import { Paper, Title } from "@mantine/core";
import { LoginForm } from "./components/LoginForm";

export function LoginPage() {
  return (
    <Paper
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Title order={2}>Welcome back!</Title>
      <LoginForm />
    </Paper>
  );
}

export default LoginPage;
