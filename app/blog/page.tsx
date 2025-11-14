// app/blog/page.tsx

export default function BlogPage() {
  return (
    <main
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "4rem 1.5rem",
      }}
    >
      <header style={{ marginBottom: "2.5rem", textAlign: "center" }}>
        <p
          style={{
            display: "inline-block",
            background: "#e0efff",
            color: "#075985",
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "0.3rem 0.8rem",
            borderRadius: 9999,
            marginBottom: "1rem",
          }}
        >
          Budget Shark Blog
        </p>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          Product updates, finance tips & roadmap
        </h1>
        <p style={{ color: "#64748b", maxWidth: "38rem", margin: "0 auto" }}>
          Short, practical posts on how we’re building uploads → validation → promotion, and how
          FP&amp;A teams can get away from “12 Excel files in email.”
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        }}
      >
        {/* Post 1 */}
        <article
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "1rem",
            padding: "1.2rem 1.2rem 1.1rem",
            background: "#fff",
          }}
        >
          <p style={{ fontSize: "0.65rem", color: "#0f172a", marginBottom: "0.4rem" }}>
            PRODUCT • PHASE 3
          </p>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.4rem" }}>
            Upload → Validate → Promote in Budget Shark
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.7rem" }}>
            How we structured the ingestion pipeline so finance teams can catch header issues before
            data hits prod.
          </p>
          <p style={{ fontSize: "0.7rem", color: "#0f172a" }}>3 min read</p>
        </article>

        {/* Post 2 */}
        <article
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "1rem",
            padding: "1.2rem 1.2rem 1.1rem",
            background: "#fff",
          }}
        >
          <p style={{ fontSize: "0.65rem", color: "#0f172a", marginBottom: "0.4rem" }}>
            FP&amp;A • WORKFLOWS
          </p>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.4rem" }}>
            Why email-based budgeting breaks at scale
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.7rem" }}>
            Once you have 8–12 contributors, version control becomes the real problem — not the
            template.
          </p>
          <p style={{ fontSize: "0.7rem", color: "#0f172a" }}>4 min read</p>
        </article>

        {/* Post 3 */}
        <article
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "1rem",
            padding: "1.2rem 1.2rem 1.1rem",
            background: "#fff",
          }}
        >
          <p style={{ fontSize: "0.65rem", color: "#0f172a", marginBottom: "0.4rem" }}>
            ROADMAP
          </p>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.4rem" }}>
            What’s coming next for Budget Shark
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.7rem" }}>
            Tiered pricing, forecasting engine, and secure pages mapped to the upload routes.
          </p>
          <p style={{ fontSize: "0.7rem", color: "#0f172a" }}>2 min read</p>
        </article>
      </div>
    </main>
  );
}
