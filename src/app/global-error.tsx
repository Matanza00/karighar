"use client";

// Root error boundary — must render its own <html>/<body>.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Something went wrong</h1>
          <p style={{ color: "#64748b", marginTop: 8 }}>Please reload the page.</p>
          <button
            onClick={reset}
            style={{ marginTop: 16, background: "#0f766e", color: "white", border: "none", borderRadius: 12, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
