"use client";

import React, { useState } from "react";
import "./reporting.css";

type ScenarioKey = "budget2025" | "budget2026";
type ViewMode = "FY" | "MONTH" | "YTD";

type ScenarioMeta = {
  key: ScenarioKey;
  label: string;
};

const SCENARIOS: ScenarioMeta[] = [
  { key: "budget2025", label: "Budget 2025" },
  { key: "budget2026", label: "Budget 2026" },
];

const CATEGORIES = [
  "Revenue",
  "Cost of Goods Sold",
  "Gross Profit",
  "Controllables",
  "Allocations",
  "Operating Income",
  "Other Expenses",
  "Net Income",
] as const;

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
];

type CategoryKey = (typeof CATEGORIES)[number];

type ScenarioAmounts = Record<ScenarioKey, Record<CategoryKey, number>>;

const SCENARIO_AMOUNTS: ScenarioAmounts = {
  budget2025: {
    Revenue: 4_875_000,
    "Cost of Goods Sold": 1_950_000,
    "Gross Profit": 2_925_000,
    Controllables: 820_000,
    Allocations: 410_000,
    "Operating Income": 1_695_000,
    "Other Expenses": 118_000,
    "Net Income": 1_577_000,
  },
  budget2026: {
    Revenue: 5_250_000,
    "Cost of Goods Sold": 2_100_000,
    "Gross Profit": 3_150_000,
    Controllables: 875_000,
    Allocations: 425_000,
    "Operating Income": 1_850_000,
    "Other Expenses": 125_000,
    "Net Income": 1_725_000,
  },
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatVarianceAmount(value: number): string {
  const prefix = value > 0 ? "+" : value < 0 ? "−" : "";
  const absValue = Math.abs(value);
  return `${prefix}${currency.format(absValue)}`;
}

function formatVariancePct(pct: number | null): string {
  if (pct === null || Number.isNaN(pct)) return "–";
  const prefix = pct > 0 ? "+" : pct < 0 ? "−" : "";
  const abs = Math.abs(pct * 100);
  return `${prefix}${abs.toFixed(1)}%`;
}

export default function ReportingPage() {
  const [entity, setEntity] = useState("All Entities");
  const [department, setDepartment] = useState("All Departments");

  const [leftScenario, setLeftScenario] = useState<ScenarioKey>("budget2026");
  const [rightScenario, setRightScenario] = useState<ScenarioKey>("budget2025");

  // ---- NEW: View + Month controls (UI only for now) ----
  // Flip this to 1 later to simulate Tier 1 (no Month/YTD)
  const TIER = 2; // 2 = Tier 2 features enabled
  const monthlyFeaturesEnabled = TIER >= 2;

  const [view, setView] = useState<ViewMode>("FY");
  const [monthIndex, setMonthIndex] = useState<number>(0); // 0=Jan

  const monthSelectEnabled = monthlyFeaturesEnabled && (view === "MONTH" || view === "YTD");

  const handleChangeView = (mode: ViewMode) => {
    if (!monthlyFeaturesEnabled && mode !== "FY") return; // gate for Tier 1
    setView(mode);
  };
  // ------------------------------------------------------

  const handleExport = () => {
    alert("Export coming soon (Excel/PDF).");
  };

  return (
    <div className="bs-page">
      <header className="bs-page-header">
        <h1 className="bs-page-title">Reporting</h1>
        <p className="bs-page-subtitle">
          Compare scenarios and analyze P&amp;L performance.
        </p>
      </header>

      <section className="bs-card bs-reporting-card">
        {/* Top toolbar: entity / department / view+month / export */}
        <div className="bs-toolbar bs-reporting-toolbar">
          <div className="bs-toolbar-left">
            <label className="bs-field">
              <span className="bs-field-label">Entity</span>
              <select
                className="bs-select"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
              >
                <option>All Entities</option>
                <option>US Hotels</option>
                <option>International</option>
                <option>Corporate</option>
              </select>
            </label>

            <label className="bs-field">
              <span className="bs-field-label">Department</span>
              <select
                className="bs-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option>All Departments</option>
                <option>101 – FP&amp;A</option>
                <option>102 – Accounting</option>
                <option>103 – Operations</option>
              </select>
            </label>

            {/* NEW: View toggle */}
            <div className="bs-seg" role="tablist" aria-label="View mode">
              <button
                type="button"
                role="tab"
                aria-selected={view === "FY"}
                className={`bs-seg-btn ${view === "FY" ? "is-active" : ""}`}
                onClick={() => handleChangeView("FY")}
              >
                FY
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === "MONTH"}
                className={`bs-seg-btn ${view === "MONTH" ? "is-active" : ""} ${!monthlyFeaturesEnabled ? "is-disabled" : ""}`}
                onClick={() => handleChangeView("MONTH")}
                disabled={!monthlyFeaturesEnabled}
                title={monthlyFeaturesEnabled ? "" : "Available in Tier 2"}
              >
                Month
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === "YTD"}
                className={`bs-seg-btn ${view === "YTD" ? "is-active" : ""} ${!monthlyFeaturesEnabled ? "is-disabled" : ""}`}
                onClick={() => handleChangeView("YTD")}
                disabled={!monthlyFeaturesEnabled}
                title={monthlyFeaturesEnabled ? "" : "Available in Tier 2"}
              >
                YTD
              </button>
            </div>

            {/* NEW: Month dropdown (enabled only in Month/YTD and Tier 2) */}
            <label className="bs-field">
              <span className="bs-field-label">Month</span>
              <select
                className="bs-select bs-month-select"
                value={monthIndex}
                onChange={(e) => setMonthIndex(Number(e.target.value))}
                disabled={!monthSelectEnabled}
                title={monthSelectEnabled ? "" : (monthlyFeaturesEnabled ? "Select FY/Month/YTD to enable" : "Available in Tier 2")}
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="bs-toolbar-actions">
            <button
              type="button"
              className="bs-button bs-button-primary"
              onClick={handleExport}
            >
              Export Report
            </button>
          </div>
        </div>

        {/* Scenario / variance grid */}
        <div className="bs-reporting-grid">
          {/* Left scenario */}
          <div className="bs-reporting-column">
            <div className="bs-reporting-column-header">
              <label className="bs-field">
                <span className="bs-field-label">Scenario</span>
                <select
                  className="bs-select"
                  value={leftScenario}
                  onChange={(e) =>
                    setLeftScenario(e.target.value as ScenarioKey)
                  }
                >
                  {SCENARIOS.map((scenario) => (
                    <option key={scenario.key} value={scenario.key}>
                      {scenario.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="bs-table-wrapper">
              <table className="bs-table bs-table-reporting">
                <thead>
                  <tr>
                    <th className="bs-th-left">Category</th>
                    <th className="bs-th-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((category) => {
                    const amount =
                      SCENARIO_AMOUNTS[leftScenario][category] ?? 0;
                    return (
                      <tr key={category}>
                        <td>{category}</td>
                        <td className="bs-td-right">
                          {currency.format(amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right scenario */}
          <div className="bs-reporting-column">
            <div className="bs-reporting-column-header">
              <label className="bs-field">
                <span className="bs-field-label">Scenario</span>
                <select
                  className="bs-select"
                  value={rightScenario}
                  onChange={(e) =>
                    setRightScenario(e.target.value as ScenarioKey)
                  }
                >
                  {SCENARIOS.map((scenario) => (
                    <option key={scenario.key} value={scenario.key}>
                      {scenario.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="bs-table-wrapper">
              <table className="bs-table bs-table-reporting">
                <thead>
                  <tr>
                    <th className="bs-th-left">Category</th>
                    <th className="bs-th-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((category) => {
                    const amount =
                      SCENARIO_AMOUNTS[rightScenario][category] ?? 0;
                    return (
                      <tr key={category}>
                        <td>{category}</td>
                        <td className="bs-td-right">
                          {currency.format(amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Variance */}
          <div className="bs-reporting-column">
            <div className="bs-reporting-column-header">
              <div className="bs-reporting-variance-title">
                Variance
                <span className="bs-reporting-variance-subtitle">
                  {/* Kept here, but sized + spaced in CSS */}
                </span>
              </div>
            </div>

            <div className="bs-table-wrapper">
              <table className="bs-table bs-table-reporting">
                <thead>
                  <tr>
                    <th className="bs-th-left">Category</th>
                    <th className="bs-th-right">+/−</th>
                    <th className="bs-th-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((category) => {
                    const leftAmount =
                      SCENARIO_AMOUNTS[leftScenario][category] ?? 0;
                    const rightAmount =
                      SCENARIO_AMOUNTS[rightScenario][category] ?? 0;
                    const varianceAmount = leftAmount - rightAmount;
                    const variancePct =
                      rightAmount === 0 ? null : varianceAmount / rightAmount;

                    const amountClass =
                      varianceAmount > 0
                        ? "bs-td-right bs-variance-positive"
                        : varianceAmount < 0
                        ? "bs-td-right bs-variance-negative"
                        : "bs-td-right";

                    const pctClass =
                      variancePct !== null && variancePct > 0
                        ? "bs-td-right bs-variance-positive"
                        : variancePct !== null && variancePct < 0
                        ? "bs-td-right bs-variance-negative"
                        : "bs-td-right";

                    return (
                      <tr key={category}>
                        <td>{category}</td>
                        <td className={amountClass}>
                          {formatVarianceAmount(varianceAmount)}
                        </td>
                        <td className={pctClass}>
                          {formatVariancePct(variancePct)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
