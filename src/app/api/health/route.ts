import { NextResponse } from "next/server";

// Lightweight health check for uptime monitors / load balancers.
export async function GET() {
  return NextResponse.json({ status: "ok", service: "karighar-web" });
}
