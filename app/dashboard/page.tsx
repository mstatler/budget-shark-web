// app/dashboard/page.tsx
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";


export default function DashboardPage() {
  return (
    <main className="dashboard-main">
      {/* Page header */}
      <section className="dashboard-page-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">
          Overview of your budgets, forecasts, and recent activity.
        </p>
      </section>

      {/* Top metrics row */}
      <DashboardStats />

      {/* Lower row: quick actions + recent activity */}
      <section className="dashboard-lower-grid">
        <QuickActions />
        <RecentActivity />
      </section>
    </main>
  );
}
