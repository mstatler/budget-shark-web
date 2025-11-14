"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Sliders,
  BarChart3,
  Upload,
  FileText,
  Settings,
  Percent,
} from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    "nav-link" + (pathname === href ? " nav-link-active" : "");

  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        {/* Dashboard Home */}
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          <Home size={18} />
          <span>Dashboard</span>
        </Link>

        {/* big spacer to push Upload down slightly */}
        <div className="sidebar-spacer-top" />

        {/* Uploads */}
        <Link
          href="/dashboard/upload"
          className={linkClass("/dashboard/upload")}
        >
          <Upload size={18} />
          <span>Upload</span>
        </Link>

        {/* gap between Upload and Input Pages */}
        <div className="sidebar-spacer-group" />

        {/* Input Pages group */}
        <div className="sidebar-section-title">Input Pages</div>

        {/* Assumptions */}
        <Link
          href="/dashboard/assumptions"
          className={linkClass("/dashboard/assumptions")}
        >
          <Percent size={18} />
          <span>Assumptions</span>
        </Link>

        {/* Drivers */}
        <Link
          href="/dashboard/drivers"
          className={linkClass("/dashboard/drivers")}
        >
          <Percent size={18} />
          <span>Drivers</span>
        </Link>

        {/* Associates */}
        <Link
          href="/dashboard/associates"
          className={linkClass("/dashboard/associates")}
        >
          <Users size={18} />
          <span>Associates</span>
        </Link>

        {/* Controllables */}
        <Link
          href="/dashboard/controllables"
          className={linkClass("/dashboard/controllables")}
        >
          <Sliders size={18} />
          <span>Controllables</span>
        </Link>

        {/* Allocations */}
        <Link
          href="/dashboard/allocations"
          className={linkClass("/dashboard/allocations")}
        >
          <BarChart3 size={18} />
          <span>Allocations</span>
        </Link>

        {/* gap between Allocations and Reporting */}
        <div className="sidebar-spacer-group" />

        {/* Budget Spread */}
        <Link
          href="/dashboard/spread"
          className={linkClass("/dashboard/spread")}
        >
          <BarChart3 size={18} />
          <span>Budget Spread</span>
        </Link>


        {/* gap between Allocations and Reporting */}
        <div className="sidebar-spacer-group" />

        {/* Reporting */}
        <Link
          href="/dashboard/reporting"
          className={linkClass("/dashboard/reporting")}
        >
          <FileText size={18} />
          <span>Reporting</span>
        </Link>
      </nav>

      {/* Bottom section (Settings stays pinned at bottom) */}
      <div className="sidebar-bottom">
        <Link
          href="/dashboard/settings"
          className={linkClass("/dashboard/settings")}
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
