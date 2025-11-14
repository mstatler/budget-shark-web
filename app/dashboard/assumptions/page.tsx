// app/dashboard/assumptions/page.tsx
"use client";

import React, { useState } from "react";

type BenefitAssumption = {
  roleLevel: string;
  roleName: string;
  driverCategory: string;
  value: string;
  comment?: string;
};

const BENEFIT_ASSUMPTIONS: BenefitAssumption[] = [
  // Merit Increase %
  {
    roleLevel: "01",
    roleName: "Chief",
    driverCategory: "Merit Increase %",
    value: "3.0%",
    comment: "",
  },
  {
    roleLevel: "02",
    roleName: "VP",
    driverCategory: "Merit Increase %",
    value: "3.0%",
    comment: "",
  },
  {
    roleLevel: "03",
    roleName: "Director",
    driverCategory: "Merit Increase %",
    value: "3.0%",
    comment: "",
  },
  {
    roleLevel: "04",
    roleName: "Manager",
    driverCategory: "Merit Increase %",
    value: "3.0%",
    comment: "",
  },
  {
    roleLevel: "05",
    roleName: "Individual Contributor",
    driverCategory: "Merit Increase %",
    value: "3.0%",
    comment: "",
  },
  {
    roleLevel: "06",
    roleName: "Support Ops",
    driverCategory: "Merit Increase %",
    value: "3.0%",
    comment: "",
  },

  // Bonus Target %
  {
    roleLevel: "01",
    roleName: "Chief",
    driverCategory: "Bonus Target %",
    value: "75%",
    comment: "",
  },
  {
    roleLevel: "02",
    roleName: "VP",
    driverCategory: "Bonus Target %",
    value: "75%",
    comment: "",
  },
  {
    roleLevel: "03",
    roleName: "Director",
    driverCategory: "Bonus Target %",
    value: "75%",
    comment: "",
  },
  {
    roleLevel: "04",
    roleName: "Manager",
    driverCategory: "Bonus Target %",
    value: "75%",
    comment: "",
  },
  {
    roleLevel: "05",
    roleName: "Individual Contributor",
    driverCategory: "Bonus Target %",
    value: "75%",
    comment: "",
  },
  {
    roleLevel: "06",
    roleName: "Support Ops",
    driverCategory: "Bonus Target %",
    value: "75%",
    comment: "",
  },

  // Target Bonus %
  {
    roleLevel: "01",
    roleName: "Chief",
    driverCategory: "Target Bonus %",
    value: "50%",
    comment: "",
  },
  {
    roleLevel: "02",
    roleName: "VP",
    driverCategory: "Target Bonus %",
    value: "40%",
    comment: "",
  },
  {
    roleLevel: "03",
    roleName: "Director",
    driverCategory: "Target Bonus %",
    value: "30%",
    comment: "",
  },
  {
    roleLevel: "04",
    roleName: "Manager",
    driverCategory: "Target Bonus %",
    value: "20%",
    comment: "",
  },
  {
    roleLevel: "05",
    roleName: "Individual Contributor",
    driverCategory: "Target Bonus %",
    value: "10%",
    comment: "",
  },
  {
    roleLevel: "06",
    roleName: "Support Ops",
    driverCategory: "Target Bonus %",
    value: "0%",
    comment: "",
  },

  // Employer FICA
  {
    roleLevel: "01",
    roleName: "Chief",
    driverCategory: "Employer FICA",
    value: "7.65%",
    comment: "",
  },
  {
    roleLevel: "02",
    roleName: "VP",
    driverCategory: "Employer FICA",
    value: "7.65%",
    comment: "",
  },
  {
    roleLevel: "03",
    roleName: "Director",
    driverCategory: "Employer FICA",
    value: "7.65%",
    comment: "",
  },
  {
    roleLevel: "04",
    roleName: "Manager",
    driverCategory: "Employer FICA",
    value: "7.65%",
    comment: "",
  },
  {
    roleLevel: "05",
    roleName: "Individual Contributor",
    driverCategory: "Employer FICA",
    value: "7.65%",
    comment: "",
  },
  {
    roleLevel: "06",
    roleName: "Support Ops",
    driverCategory: "Employer FICA",
    value: "7.65%",
    comment: "",
  },

  // Employer FUTA
  {
    roleLevel: "01",
    roleName: "Chief",
    driverCategory: "Employer FUTA",
    value: "0.6%",
    comment: "",
  },
  {
    roleLevel: "02",
    roleName: "VP",
    driverCategory: "Employer FUTA",
    value: "0.6%",
    comment: "",
  },
  {
    roleLevel: "03",
    roleName: "Director",
    driverCategory: "Employer FUTA",
    value: "0.6%",
    comment: "",
  },
  {
    roleLevel: "04",
    roleName: "Manager",
    driverCategory: "Employer FUTA",
    value: "0.6%",
    comment: "",
  },
  {
    roleLevel: "05",
    roleName: "Individual Contributor",
    driverCategory: "Employer FUTA",
    value: "0.6%",
    comment: "",
  },
  {
    roleLevel: "06",
    roleName: "Support Ops",
    driverCategory: "Employer FUTA",
    value: "0.6%",
    comment: "",
  },

  // 401k Match
  {
    roleLevel: "01",
    roleName: "Chief",
    driverCategory: "401k Match",
    value: "5.0%",
    comment: "",
  },
  {
    roleLevel: "02",
    roleName: "VP",
    driverCategory: "401k Match",
    value: "5.0%",
    comment: "",
  },
  {
    roleLevel: "03",
    roleName: "Director",
    driverCategory: "401k Match",
    value: "5.0%",
    comment: "",
  },
  {
    roleLevel: "04",
    roleName: "Manager",
    driverCategory: "401k Match",
    value: "5.0%",
    comment: "",
  },
  {
    roleLevel: "05",
    roleName: "Individual Contributor",
    driverCategory: "401k Match",
    value: "5.0%",
    comment: "",
  },
  {
    roleLevel: "06",
    roleName: "Support Ops",
    driverCategory: "401k Match",
    value: "5.0%",
    comment: "",
  },

  // Health Insurance Cost (flat $)
  {
    roleLevel: "01",
    roleName: "Chief",
    driverCategory: "Health Insurance Cost",
    value: "14,000",
    comment: "",
  },
  {
    roleLevel: "02",
    roleName: "VP",
    driverCategory: "Health Insurance Cost",
    value: "12,000",
    comment: "",
  },
  {
    roleLevel: "03",
    roleName: "Director",
    driverCategory: "Health Insurance Cost",
    value: "11,000",
    comment: "",
  },
  {
    roleLevel: "04",
    roleName: "Manager",
    driverCategory: "Health Insurance Cost",
    value: "10,000",
    comment: "",
  },
  {
    roleLevel: "05",
    roleName: "Individual Contributor",
    driverCategory: "Health Insurance Cost",
    value: "9,000",
    comment: "",
  },
  {
    roleLevel: "06",
    roleName: "Support Ops",
    driverCategory: "Health Insurance Cost",
    value: "9,000",
    comment: "",
  },
];

export default function AssumptionsPage() {
  const [budgetYear, setBudgetYear] = useState("FY 2025");
  const [entity, setEntity] = useState("All Entities");


  const handleSave = () => {
    // Placeholder – later this will trigger a mutation to persist changes
    // eslint-disable-next-line no-alert
    alert("Save Changes clicked (wire up API later).");
  };

  return (
    <div className="bs-page">
      <header className="bs-page-header">
        <h1 className="bs-page-title">Assumptions Input</h1>
        <p className="bs-page-subtitle">
          Maintain global benefits assumptions by role level that feed your
          compensation and payroll planning.
        </p>
      </header>

      <section className="bs-card bs-controllables-card">
        {/* Filters / toolbar */}
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

        {/* Benefits assumptions – vertical table */}
        <div className="bs-table-wrapper">
          <h2 className="bs-table-section-title">Benefits Assumptions</h2>
          <table className="bs-table">
            <thead>
              <tr>
                <th className="bs-th-left">Role Level</th>
                <th className="bs-th-left">Role Name</th>
                <th className="bs-th-left">Driver Category</th>
                <th className="bs-th-right">Value</th>
                <th className="bs-th-left">Comment</th>
              </tr>
            </thead>
            <tbody>
              {BENEFIT_ASSUMPTIONS.map((row, idx) => (
                <tr key={`${row.roleLevel}-${row.driverCategory}-${idx}`}>
                  <td>{row.roleLevel}</td>
                  <td>{row.roleName}</td>
                  <td>{row.driverCategory}</td>
                  <td className="bs-td-right">{row.value}</td>
                  <td>{row.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
