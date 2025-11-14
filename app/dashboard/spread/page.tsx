"use client";

import React, { useMemo, useState } from "react";
import "./spread.css";

type SpreadMethodId = "straight_line" | "quarterly" | "q4_heavy" | "manual";
type SpreadMethod = { id: SpreadMethodId; label: string };

const SPREAD_METHODS: SpreadMethod[] = [
  { id: "straight_line", label: "Straight-line (Monthly)" },
  { id: "quarterly", label: "Quarterly (Mar / Jun / Sep / Dec)" },
  { id: "q4_heavy", label: "Seasonal – Q4 heavy" },
  { id: "manual", label: "Manual" },
];

const MONTH_LABELS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

type SpreadRow = {
  id: string;
  accountCode: string;
  accountName: string;
  annual: number;
  method: SpreadMethodId;
  months: number[]; // 12
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatDelta(delta: number): string {
  const abs = currency.format(Math.abs(delta));
  return delta >= 0 ? `+${abs}` : `-${abs}`;
}

/** Build 12 months in whole dollars; remainder goes to December. */
function calculatePatternMonths(annual: number, method: SpreadMethodId): number[] {
  const months = new Array(12).fill(0);
  if (method === "manual" || annual <= 0) return months;

  let weights: number[];
  switch (method) {
    case "straight_line":
      weights = new Array(12).fill(1);
      break;
    case "quarterly":
      // Annual/4 into Mar, Jun, Sep, Dec
      weights = [0,0,1, 0,0,1, 0,0,1, 0,0,1];
      break;
    case "q4_heavy":
      weights = [4,4,4, 5,5,5, 6,6,6, 8,10,12];
      break;
    default:
      weights = new Array(12).fill(1);
  }

  const sum = weights.reduce((a,b)=>a+b,0);
  let running = 0;
  for (let i = 0; i < 11; i++) {
    const raw = (annual * weights[i]) / sum;
    const rounded = Math.floor(raw);
    months[i] = rounded;
    running += rounded;
  }
  months[11] = annual - running; // remainder to Dec
  return months;
}

const INITIAL_ROWS: SpreadRow[] = [
  { id:"6000", accountCode:"6000", accountName:"Room Revenue",            annual:2_400_000, method:"straight_line", months:[] },
  { id:"6010", accountCode:"6010", accountName:"Food & Beverage Revenue", annual:1_200_000, method:"q4_heavy",      months:[] },
  { id:"7000", accountCode:"7000", accountName:"Salary & Wages",          annual:1_050_000, method:"straight_line", months:[] },
  { id:"7100", accountCode:"7100", accountName:"Travel & Entertainment",  annual:  180_000, method:"quarterly",     months:[] },
];

function initRows(): SpreadRow[] {
  return INITIAL_ROWS.map(r => ({ ...r, months: calculatePatternMonths(r.annual, r.method) }));
}

export default function BudgetSpreadPage() {
  const [budgetYear, setBudgetYear] = useState("FY 2025");
  const [entity, setEntity] = useState("All Entities");
  const [department, setDepartment] = useState("All Departments");
  const [rows, setRows] = useState<SpreadRow[]>(() => initRows());

  /** Selection state for bulk apply */
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const allSelected = useMemo(
    () => rows.length > 0 && rows.every(r => selected[r.id]),
    [rows, selected]
  );
  const selectedCount = useMemo(
    () => rows.reduce((n, r) => n + (selected[r.id] ? 1 : 0), 0),
    [rows, selected]
  );

  const [bulkMethod, setBulkMethod] = useState<SpreadMethodId | "">("");

  const toggleSelect = (rowId: string) => {
    setSelected(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      // clear all
      const cleared: Record<string, boolean> = {};
      setSelected(cleared);
    } else {
      // select all
      const filled: Record<string, boolean> = {};
      rows.forEach(r => { filled[r.id] = true; });
      setSelected(filled);
    }
  };

  const handleMethodChange = (rowId: string, newMethod: SpreadMethodId) => {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      if (newMethod === "manual") return { ...row, method: newMethod };
      return { ...row, method: newMethod, months: calculatePatternMonths(row.annual, newMethod) };
    }));
  };

  const handleAnnualChange = (rowId: string, value: string) => {
    const annual = Number(value) || 0;
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      if (row.method === "manual") return { ...row, annual };
      return { ...row, annual, months: calculatePatternMonths(annual, row.method) };
    }));
  };

  const handleMonthChange = (rowId: string, monthIndex: number, value: string) => {
    const num = Number(value) || 0;
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const months = [...row.months];
      months[monthIndex] = num;
      return { ...row, method: "manual", months };
    }));
  };

  /** Inline reset buttons */
  const resetRowToCurrentMethod = (rowId: string) => {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      return { ...row, months: calculatePatternMonths(row.annual, row.method) };
    }));
  };
  const forceRowStraightLine = (rowId: string) => {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      return { ...row, method: "straight_line", months: calculatePatternMonths(row.annual, "straight_line") };
    }));
  };

  /** Bulk apply method to selected rows */
  const applyBulkMethod = () => {
    if (!bulkMethod) return;
    setRows(prev => prev.map(row => {
      if (!selected[row.id]) return row;
      if (bulkMethod === "manual") return { ...row, method: "manual" }; // keep months as-is
      return { ...row, method: bulkMethod, months: calculatePatternMonths(row.annual, bulkMethod) };
    }));
  };

  const handleSave = () => {
    alert("Save Spread clicked (wire up API later).");
  };

  const rowTotal = (row: SpreadRow) =>
    row.months.reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);

  return (
    <div className="bs-spread-root">
      <header className="bs-page-header bs-spread-header">
        <h1 className="bs-page-title">Budget Spread</h1>
        <p className="bs-page-subtitle">
          Shape annual budgets into monthly plans for reporting and variance analysis.
        </p>
      </header>

      <section className="bs-card bs-spread-card">
        {/* Toolbar */}
        <div className="bs-toolbar">
          <div className="bs-toolbar-left">
            <label className="bs-field">
              <span className="bs-field-label">Budget Year</span>
              <select className="bs-select" value={budgetYear} onChange={e=>setBudgetYear(e.target.value)}>
                <option>FY 2024</option>
                <option>FY 2025</option>
                <option>FY 2026</option>
              </select>
            </label>

            <label className="bs-field">
              <span className="bs-field-label">Entity</span>
              <select className="bs-select" value={entity} onChange={e=>setEntity(e.target.value)}>
                <option>All Entities</option>
                <option>US Hotels</option>
                <option>International</option>
                <option>Corporate</option>
              </select>
            </label>

            <label className="bs-field">
              <span className="bs-field-label">Department</span>
              <select className="bs-select" value={department} onChange={e=>setDepartment(e.target.value)}>
                <option>All Departments</option>
                <option>101 – FP&amp;A</option>
                <option>102 – Accounting</option>
                <option>103 – Operations</option>
              </select>
            </label>
          </div>

          <div className="bs-toolbar-actions">
            {/* Bulk apply to selection */}
            <div className="bs-bulk-controls">
              <select
                className="bs-select"
                value={bulkMethod}
                onChange={(e) => setBulkMethod(e.target.value as SpreadMethodId | "")}
              >
                <option value="">Bulk: choose method…</option>
                {SPREAD_METHODS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              <button
                type="button"
                className="bs-button"
                disabled={!bulkMethod || selectedCount === 0}
                onClick={applyBulkMethod}
                title={selectedCount ? `Apply to ${selectedCount} row(s)` : "Select rows first"}
              >
                Apply to selection
              </button>
            </div>

            <button
              type="button"
              className="bs-button bs-button-primary"
              onClick={handleSave}
            >
              Save Spread
            </button>
          </div>
        </div>

        {/* Spread table */}
        <div className="bs-table-wrapper">
          <table className="bs-table bs-table-spread">
            <thead>
              <tr>
                <th className="bs-th-left bs-sticky-first">
                  <label className="bs-select-all">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                    />
                    <span>Account</span>
                  </label>
                </th>
                <th className="bs-th-right">Annual</th>
                <th className="bs-th-left">Spread Method</th>
                {MONTH_LABELS.map((m) => (
                  <th key={m} className="bs-th-right">{m}</th>
                ))}
                <th className="bs-th-right">Total</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const total = rowTotal(row);
                const delta = total - row.annual;
                const ok = delta === 0;

                return (
                  <tr key={row.id}>
                    {/* Sticky first column: selection + account */}
                    <td className="bs-sticky-first">
                      <div className="bs-account-cell">
                        <div className="bs-account-line">
                          <input
                            type="checkbox"
                            className="bs-row-checkbox"
                            checked={!!selected[row.id]}
                            onChange={() => toggleSelect(row.id)}
                            aria-label={`Select ${row.accountName}`}
                          />
                          <div className="bs-account-name">{row.accountName}</div>
                        </div>
                        <div className="bs-account-code">{row.accountCode}</div>
                      </div>
                    </td>

                    {/* Annual */}
                    <td className="bs-td-right">
                      <input
                        type="number"
                        className="bs-input-number bs-input-annual"
                        value={row.annual}
                        min={0}
                        onChange={(e)=>handleAnnualChange(row.id, e.target.value)}
                      />
                    </td>

                    {/* Method + inline resets */}
                    <td>
                      <div className="bs-method-cell">
                        <select
                          className="bs-select"
                          value={row.method}
                          onChange={(e)=>handleMethodChange(row.id, e.target.value as SpreadMethodId)}
                        >
                          {SPREAD_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                        </select>

                        <div className="bs-inline-actions">
                          <button
                            type="button"
                            className="bs-link-btn"
                            onClick={() => resetRowToCurrentMethod(row.id)}
                            title="Reapply current method pattern"
                          >
                            Reset
                          </button>
                          <span className="bs-inline-dot">•</span>
                          <button
                            type="button"
                            className="bs-link-btn"
                            onClick={() => forceRowStraightLine(row.id)}
                            title="Switch to straight-line"
                          >
                            SL
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Months */}
                    {MONTH_LABELS.map((label, i) => (
                      <td key={label} className="bs-td-right">
                        <input
                          type="number"
                          className="bs-input-number bs-input-month"
                          value={row.months[i] ?? 0}
                          onChange={(e)=>handleMonthChange(row.id, i, e.target.value)}
                        />
                      </td>
                    ))}

                    {/* Total + live mismatch badge */}
                    <td className="bs-td-right">
                      <div className="bs-total-cell">
                        <span>{currency.format(total)}</span>
                        {!ok && (
                          <span
                            className="bs-badge-delta"
                            title={`Total differs from Annual by ${formatDelta(delta)}. Edit months or use Reset to reapply the pattern.`}
                          >
                            {formatDelta(delta)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
