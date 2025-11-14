"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";

interface DashboardHeaderProps {
  userName?: string;
  orgName?: string;
  lastLogin?: string;
}

export function DashboardHeader({
  userName = "Matt Statler",
  orgName = "Acme Corporation",
  lastLogin = "Today at 9:45 AM",
}: DashboardHeaderProps) {
  const handleLogout = () => {
    console.log("Logging out...");
  };

  return (
    <header className="bs-header">
      <div className="bs-header-inner">
        {/* LEFT — logo + org */}
        <div className="bs-header-left">
          <div className="bs-logo-wrap">
            <Image
              src="/images/budget-shark-logo.png"
              alt="Budget Shark Logo"
              className="bs-logo"
              width={96}
              height={96}
              priority
            />
            <span className="bs-header-org">{orgName}</span>
          </div>
        </div>

        {/* RIGHT — user info + logout */}
        <div className="bs-header-right">
          <div className="bs-header-user">
            <p className="bs-header-welcome">Welcome back, {userName}</p>
            <p className="bs-header-last-login">Last login: {lastLogin}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="bs-header-logout"
          >
            <LogOut className="bs-header-logout-icon" />
            <span className="bs-header-logout-text">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
