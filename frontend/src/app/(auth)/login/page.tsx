import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <AuthShell title="Bem-vindo de volta" subtitle="Entre para acessar o painel">
      <LoginForm />
    </AuthShell>
  );
}
