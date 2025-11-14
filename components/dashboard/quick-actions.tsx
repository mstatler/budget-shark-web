// components/dashboard/quick-actions.tsx
import Link from "next/link";
import { PlusCircle, Upload as UploadIcon, Sliders } from "lucide-react";

export function QuickActions() {
  return (
    <article className="dashboard-card dashboard-quick-actions">
      <header className="dashboard-card-header">
        <div>
          <h2 className="dashboard-card-title">Quick actions</h2>
          <p className="dashboard-card-subtitle">
            Jump straight into the workflows you use most often.
          </p>
        </div>
      </header>

      <div className="quick-actions-grid">
        <Link href="/allocations" className="quick-action quick-action-primary">
          <PlusCircle className="quick-action-icon" />
          <div className="quick-action-text">
            <span className="quick-action-title">New budget / forecast</span>
            <span className="quick-action-caption">
              Add a new budget line or forecast scenario
            </span>
          </div>
        </Link>

        <Link href="/upload" className="quick-action">
          <UploadIcon className="quick-action-icon" />
          <div className="quick-action-text">
            <span className="quick-action-title">Upload scenario file</span>
            <span className="quick-action-caption">
              Import from Excel or CSV
            </span>
          </div>
        </Link>

        <Link href="/controllables" className="quick-action">
          <Sliders className="quick-action-icon" />
          <div className="quick-action-text">
            <span className="quick-action-title">Adjust controllables</span>
            <span className="quick-action-caption">
              Update key drivers and levers
            </span>
          </div>
        </Link>

        {/* Optional fourth action slot for future use */}
        {/* <Link href="/reports" className="quick-action">
          ...
        </Link> */}
      </div>
    </article>
  );
}
