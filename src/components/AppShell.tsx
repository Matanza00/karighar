import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { clsx } from "@/lib/clsx";

// Page frame: shared header + centered content + mobile bottom nav.
export function AppShell({
  children,
  width = "wide",
}: {
  children: React.ReactNode;
  width?: "wide" | "narrow";
}) {
  return (
    <>
      <AppHeader />
      <main
        className={clsx(
          "mx-auto w-full flex-1 px-5 py-8 pb-24 md:pb-8",
          width === "wide" ? "max-w-6xl" : "max-w-md"
        )}
      >
        {children}
      </main>
      <BottomNav />
    </>
  );
}
