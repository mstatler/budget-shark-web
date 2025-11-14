// app/dashboard/drivers/page.tsx
"use client";

import React, { useState } from "react";

type DriverAssumption = {
  driverId: string;
  driverName: string;
  driverType: string;
  value: string;
  appliesTo: string;
};

const DRIVER_ASSUMPTIONS: DriverAssumption[] = [
  {
    driverId: "DRV001",
    driverName: "Travel Cost by HC",
    driverType: "Per_HC",
    value: "1,500",
    appliesTo: "7020",
  },
  {
    driverId: "DRV002",
    driverName: "SaaS Cost per HC",
    driverType: "Per_HC",
    value: "1,200",
    appliesTo: "7050",
  },
  {
    driverId: "DRV003",
    driverName: "Onboarding Cost per New Hire",
    driverType: "Per_New_Hire",
    value: "800",
    appliesTo: "7060",
  },
  {
    driverId: "DRV004",
    driverName: "Training Cost per HC",
    driverType: "Per_HC",
    value: "600",
    appliesTo: "7070",
  },
];

export default function DriversPage() {
  const [budgetYear, setBudgetYear] = useState("FY 2025");
  const [entity, setEntity] = useState("All Entities");
  

  const handleSave = () => {
    // Placeholder – will connect to backend later
    alert("Save Changes clicked (API connection coming later).");
  };

  return (
    <div className="bs-page">
      <header className="bs-page-header">
        <h1 className="bs-page-title">Driver Assumptions</h1>
        <p className="bs-page-subtitle">
          Maintain per-head and per-activity cost drivers that feed your
          controllables and allocations.
        </p>
      </header>

      <section className="bs-card bs-controllables-card">
        {/* Toolbar / filters */}
        <div className="bs-toolbar">
          <div className="bs-toolbar-left">
            <label className="bs-field">
              <span className="bs-field-label">Budget Year</span>
              <select
                className="bs-select"
                value={budgetYear}
                onChange={(e) => setBudgetYear(e.target.value)}
              >
                <option value="FY 2024">FY 2024</option>
                <option value="FY 2025">FY 2025</option>
                <option value="FY 2026">FY 2026</option>
              </select>
            </label>

            <label className="bs-field">
              <span className="bs-field-label">Entity</span>
              <select
                className="bs-select"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
              >
                <option>All Entities</option>
                <option>US Corp</option>
                <option>EMEA Holdings</option>
                <option>APAC Services</option>
              </select>
            </label>

           
          </div>

          <div className="bs-toolbar-actions">
            <button
              type="button"
              className="bs-button bs-button-primary"
              onClick={handleSave}
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Drivers table */}
        <div className="bs-table-wrapper">
          <h2 className="bs-table-section-title">Operating Drivers</h2>
          <table className="bs-table">
            <thead>
              <tr>
                <th className="bs-th-left">Driver ID</th>
                <th className="bs-th-left">Driver Name</th>
                <th className="bs-th-left">Driver Type</th>
                <th className="bs-th-right">Value</th>
                <th className="bs-th-left">Applies To (Account)</th>
              </tr>
            </thead>
            <tbody>
              {DRIVER_ASSUMPTIONS.map((row) => (
                <tr key={row.driverId}>
                  <td>{row.driverId}</td>
                  <td>{row.driverName}</td>
                  <td>{row.driverType}</td>
                  <td className="bs-td-right">{row.value}</td>
                  <td>{row.appliesTo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
