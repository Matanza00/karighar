import type { JobStatus } from "./types";

// Mirrors the server-side status state machine in patch_v4_business_logic.sql.
// Kept in TS so the UI can guard actions before hitting the DB.
const GRAPH: Partial<Record<JobStatus, JobStatus[]>> = {
  created: ["assigned", "cancelled"],
  bidding: ["assigned", "cancelled"],
  assigned: ["en_route", "cancelled"],
  en_route: ["arrived", "cancelled"],
  arrived: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["paid", "disputed"],
  paid: ["rated", "disputed"],
};

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return GRAPH[from]?.includes(to) ?? false;
}
