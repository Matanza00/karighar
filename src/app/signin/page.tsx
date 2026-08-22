import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthForm } from "@/components/AuthForm";

export default function SignInPage() {
  return (
    <AppShell width="narrow">
      <Suspense>
        <AuthForm mode="signin" />
      </Suspense>
    </AppShell>
  );
}
