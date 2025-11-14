"use client";

import React, { useState } from "react";

type Department = {
  id: string;
  name: string;
};

const DEPARTMENTS: Department[] = [
  { id: "101", name: "FP&A" },
  { id: "102", name: "Accounting" },
  { id: "103", name: "Operations" },
];

// These will ultimately come from the user's chart of accounts.
const COGS_ACCOUNTS: string[] = [
  "Hosting / Infrastructure",
  "Payment Processing Fees",
  "Customer Support",
  "Professional Services Delivery",
  "Third-Party Licenses",
];

const CONTROLLABLE_ACCOUNTS: string[] = [
  "Advertising & Marketing",
  "Software & SaaS",
  "Travel",
  "Meals & Entertainment",
  "Rent",
  "Office Supplies",
  "Training & Education",
  "Recruiting",
  "Legal & Professional Fees",
  "Insurance",
  "Bank & Merchant Fees",
  "Bad Debt Expense",
  "Depreciation & Amortization",
];

export default function ControllablesPage() {
  const [budgetYear, setBudgetYear] = useState("FY 2025");
  const [entity, setEntity] = useState("All Entities");
  const [department, setDepartment] = useState("All Departments");

  const handleSave = () => {
    // Placeholder – later this will trigger a mutation to persist changes
    // eslint-disable-next-line no-alert
    alert("Save Changes clicked (wire up API later).");
  };

  return (
    <div className="bs-page">
      <header className="bs-page-header">
        <h1 className="bs-page-title">Controllables Input</h1>
        <p className="bs-page-subtitle">
          Enter controllable expenses by department and account. This will
          ultimately tie directly to each entity&apos;s chart of accounts.
        </p>
      </header>

      <section className="bs-card bs-controllables-card">
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

        {/* COGS table */}
        <div className="bs-table-wrapper">
          <h2 className="bs-table-section-title">Cost of Goods Sold (COGS)</h2>
          <table className="bs-table bs-table-controllables">
            <thead>
              <tr>
                <th className="bs-th-left">Dept #</th>
                <th className="bs-th-left">Dept Name</th>
                {COGS_ACCOUNTS.map((account) => (
                  <th key={account} className="bs-th-right">
                    {account}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEPARTMENTS.map((dept) => (
                <tr key={dept.id}>
                  <td>{dept.id}</td>
                  <td>{dept.name}</td>
                  {COGS_ACCOUNTS.map((account) => (
                    <td key={account} className="bs-td-right">
                      <input
                        type="number"
                        className="bs-input-number"
                        placeholder="0"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Controllables table */}
        <div className="bs-table-wrapper">
          <h2 className="bs-table-section-title">
            Controllable Operating Expenses
          </h2>
          <table className="bs-table bs-table-controllables">
            <thead>
              <tr>
                <th className="bs-th-left">Dept #</th>
                <th className="bs-th-left">Dept Name</th>
                {CONTROLLABLE_ACCOUNTS.map((account) => (
                  <th key={account} className="bs-th-right">
                    {account}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEPARTMENTS.map((dept) => (
                <tr key={dept.id}>
                  <td>{dept.id}</td>
                  <td>{dept.name}</td>
                  {CONTROLLABLE_ACCOUNTS.map((account) => (
                    <td key={account} className="bs-td-right">
                      <input
                        type="number"
                        className="bs-input-number"
                        placeholder="0"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
