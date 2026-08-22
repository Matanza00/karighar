import { JOB_STATUS_FLOW, JOB_STATUS_LABEL, type JobStatus } from "@/lib/types";
import { clsx } from "@/lib/clsx";

// Vertical progress timeline for a job's lifecycle.
export function JobTimeline({ status }: { status: JobStatus }) {
  if (status === "cancelled" || status === "disputed") {
    return (
      <div className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">
        This job is {JOB_STATUS_LABEL[status].toLowerCase()}.
      </div>
    );
  }
  if (status === "created" || status === "bidding") {
    return (
      <div className="rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-700">
        {JOB_STATUS_LABEL[status]}…
      </div>
    );
  }

  const currentIdx = JOB_STATUS_FLOW.indexOf(status);
  return (
    <ol className="space-y-0">
      {JOB_STATUS_FLOW.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={s} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={clsx(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                  done && "bg-brand-600 text-white",
                  active && "bg-brand-600 text-white ring-4 ring-brand-100",
                  !done && !active && "bg-slate-200 text-slate-400"
                )}
              >
                {done ? "✓" : i + 1}
              </span>
              {i < JOB_STATUS_FLOW.length - 1 && (
                <span className={clsx("w-0.5 flex-1", i < currentIdx ? "bg-brand-500" : "bg-slate-200")} style={{ minHeight: 24 }} />
              )}
            </div>
            <span className={clsx("pb-6 text-sm", active ? "font-semibold text-slate-900" : "text-slate-500")}>
              {JOB_STATUS_LABEL[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
