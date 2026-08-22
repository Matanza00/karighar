import Link from "next/link";
import { clsx } from "@/lib/clsx";
export { formatPKR } from "@/lib/money";

export function Button({
  children,
  variant = "primary",
  className,
  type = "button",
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const styles = {
    primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 disabled:bg-brand-300",
    outline:
      "border border-slate-300 bg-white text-slate-700 hover:border-brand-500 hover:text-brand-700",
    ghost: "text-slate-600 hover:bg-slate-50 hover:text-brand-700",
    danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
  }[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
        styles,
        className
      )}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  href,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
}) {
  const styles = {
    primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700",
    outline:
      "border border-slate-300 bg-white text-slate-700 hover:border-brand-500 hover:text-brand-700",
    ghost: "text-slate-600 hover:bg-slate-50 hover:text-brand-700",
  }[variant];
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
        styles,
        className
      )}
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "brand",
}: {
  children: React.ReactNode;
  tone?: "brand" | "amber" | "green" | "rose" | "slate";
}) {
  const tones = {
    brand: "bg-brand-100 text-brand-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
    rose: "bg-rose-100 text-rose-700",
    slate: "bg-slate-100 text-slate-600",
  }[tone];
  return (
    <span className={clsx("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", tones)}>
      {children}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function EmptyState({
  icon = "📭",
  title,
  hint,
  children,
}: {
  icon?: string;
  title: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-14 text-center">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

