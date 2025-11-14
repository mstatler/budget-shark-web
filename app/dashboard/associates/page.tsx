// app/dashboard/associates/page.tsx
"use client";

import React, { useState, useMemo } from "react";

type Associate = {
  deptNumber: string;
  associateId: string;
  name: string;
  title: string;
  salary: number;
  bonus: number;
  salaryTaxes: number;
  totalCost: number;
};

const sampleAssociates: Associate[] = [
  { deptNumber: "101", associateId: "A-2401", name: "Sarah Johnson",   title: "Senior Analyst",    salary:  95000, bonus: 12000, salaryTaxes: 15050, totalCost: 120050 },
  { deptNumber: "101", associateId: "A-2402", name: "Michael Chen",    title: "Data Analyst",      salary:  78000, bonus:  8500, salaryTaxes: 12150, totalCost:  98650 },
  { deptNumber: "102", associateId: "A-2403", name: "Emily Rodriguez", title: "Financial Manager", salary: 115000, bonus: 18000, salaryTaxes: 18650, totalCost: 151650 },
  { deptNumber: "103", associateId: "A-2404", name: "James Wilson",    title: "Budget Coordinator",salary:  82000, bonus:  9500, salaryTaxes: 12850, totalCost: 104350 },
  { deptNumber: "103", associateId: "A-2405", name: "Lisa Martinez",   title: "Associate Analyst", salary:  68000, bonus:  6000, salaryTaxes: 10400, totalCost:  84400 },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function AssociatesPage() {
  const [budgetYear, setBudgetYear] = useState("FY 2025");
  const [entity, setEntity] = useState("All Entities");
  const [department, setDepartment] = useState("All Departments");

  const totals = useMemo(() => {
    return sampleAssociates.reduce(
      (acc, r) => {
        acc.salary += r.salary;
        acc.bonus += r.bonus;
        acc.salaryTaxes += r.salaryTaxes;
        acc.totalCost += r.totalCost;
        return acc;
      },
      { salary: 0, bonus: 0, salaryTaxes: 0, totalCost: 0 }
    );
  }, []);

  const handleSave = () => {
    alert("Save Changes clicked (wire up API later).");
  };

  return (
    <div className="bs-page">
      <header className="bs-page-header">
        <h1 className="bs-page-title">Associates Input</h1>
        <p className="bs-page-subtitle">
          Manage associate compensation and budget allocation.
        </p>
      </header>

      <section className="bs-card bs-associates-card">
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

        <div className="bs-table-wrapper">
          <table className="bs-table bs-table-associates">
            <thead>
              <tr>
                <th className="bs-th-left col-dept">Dept #</th>
                <th className="bs-th-left col-assoc">Associate ID</th>
                <th className="bs-th-left col-name">Name</th>
                <th className="bs-th-left">Title</th>
                <th className="bs-th-right">Salary</th>
                <th className="bs-th-right">Bonus</th>
                <th className="bs-th-right">Salary Taxes</th>
                <th className="bs-th-right">Total Cost</th>
              </tr>
            </thead>

            <tbody>
              {sampleAssociates.map((assoc) => (
                <tr key={assoc.associateId}>
                  <td className="col-dept">{assoc.deptNumber}</td>
                  <td className="col-assoc">{assoc.associateId}</td>
                  <td className="col-name">{assoc.name}</td>
                  <td>{assoc.title}</td>
                  <td className="bs-td-right">{currency.format(assoc.salary)}</td>
                  <td className="bs-td-right">{currency.format(assoc.bonus)}</td>
                  <td className="bs-td-right">{currency.format(assoc.salaryTaxes)}</td>
                  <td className="bs-td-right bs-td-emphasis">
                    {currency.format(assoc.totalCost)}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="bs-totals-row">
                <td className="col-dept bs-td-left-strong" colSpan={3}>Totals</td>
                <td></td>
                <td className="bs-td-right">
                  {currency.format(totals.salary)}
                </td>
                <td className="bs-td-right">
                  {currency.format(totals.bonus)}
                </td>
                <td className="bs-td-right">
                  {currency.format(totals.salaryTaxes)}
                </td>
                <td className="bs-td-right bs-td-emphasis">
                  {currency.format(totals.totalCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
