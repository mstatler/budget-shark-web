// components/dashboard/recent-activity.tsx
const activity = [
  {
    id: 1,
    title: "FY25 Budget v2 promoted",
    detail: "US & Canada – Corporate",
    when: "10 mins ago",
    status: "completed" as const,
  },
  {
    id: 2,
    title: "Actuals loaded for Oct 2025",
    detail: "All entities",
    when: "1 hour ago",
    status: "completed" as const,
  },
  {
    id: 3,
    title: "New controllable: Marketing – Events",
    detail: "Added by you",
    when: "Yesterday",
    status: "completed" as const,
  },
  {
    id: 4,
    title: "Allocation rule updated",
    detail: "IT Shared Services → Brands",
    when: "2 days ago",
    status: "completed" as const,
  },
  {
    id: 5,
    title: "Review pending: R&D Budget Proposal",
    detail: "Needs approver review",
    when: "3 days ago",
    status: "pending" as const,
  },
];

export function RecentActivity() {
  return (
    <article className="dashboard-card dashboard-recent-activity">
      <header className="dashboard-card-header">
        <div>
          <h2 className="dashboard-card-title">Recent activity</h2>
          <p className="dashboard-card-subtitle">
            Latest changes and updates across your budgets.
          </p>
        </div>
      </header>

      <ul className="activity-list">
        {activity.map((item) => (
          <li key={item.id} className="activity-item">
            <div className="activity-main">
              <div className="activity-title-row">
                <span className="activity-title">{item.title}</span>
                <span className={`activity-badge ${item.status}`}>
                  {item.status}
                </span>
              </div>
              <p className="activity-description">{item.detail}</p>
              <p className="activity-meta">Budget Shark system</p>
            </div>
            <span className="activity-time">{item.when}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
