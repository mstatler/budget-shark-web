// components/dashboard/dashboard-stats.tsx
const stats = [
  {
    label: "Active budgets",
    value: "12",
    helper: "Across all entities",
  },
  {
    label: "Current month variance",
    value: "-$18.4K",
    helper: "vs. budget",
  },
  {
    label: "Forecast accuracy",
    value: "96.2%",
    helper: "Last 3 months",
  },
  {
    label: "Next review",
    value: "Mar 15",
    helper: "Q1 Budget Review",
  },
];

export function DashboardStats() {
  return (
    <section className="dashboard-metrics-row">
      {stats.map((stat) => (
        <article key={stat.label} className="dashboard-metric-card">
          <div className="dashboard-metric-header">
            <span className="dashboard-metric-label">{stat.label}</span>
          </div>
          <div className="dashboard-metric-main">
            <span className="dashboard-metric-value">{stat.value}</span>
            {stat.helper && (
              <p className="dashboard-metric-caption">{stat.helper}</p>
            )}
            {/* Example trend text; can be wired to real data later */}
            {stat.label === "Current month variance" && (
              <span className="dashboard-metric-trend warning">
                Higher than last month
              </span>
            )}
            {stat.label === "Forecast accuracy" && (
              <span className="dashboard-metric-trend positive">
                +3% from Q3
              </span>
            )}
            {stat.label === "Active budgets" && (
              <span className="dashboard-metric-trend neutral">
                +2 this month
              </span>
            )}
            {stat.label === "Next review" && (
              <span className="dashboard-metric-trend neutral">
                In 5 days
              </span>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
