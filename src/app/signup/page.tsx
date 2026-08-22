import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthForm } from "@/components/AuthForm";

export default function SignUpPage() {
  return (
    <AppShell width="narrow">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </AppShell>
  );
}
