// app/allocations/page.tsx

"use client";

import { useState } from "react";

type Department = {
  code: string; // Dept #
  name: string;
};

type AllocationAccount = {
  id: string;
  name: string;
};

const YEARS = ["FY 2024", "FY 2025"];
const ENTITIES = ["All Entities", "US Hotels", "International"];
const DEPARTMENT_FILTERS = [
  "All Departments",
  "FP&A",
  "Accounting",
  "Operations",
];

const DEPARTMENTS: Department[] = [
  { code: "101", name: "FP&A" },
  { code: "102", name: "Accounting" },
  { code: "103", name: "Operations" },
];

const ALLOCATION_ACCOUNTS: AllocationAccount[] = [
  { id: "ga-alloc-in", name: "G&A Allocations In" },
  { id: "other-alloc-in", name: "Other Allocations In" },
  { id: "alloc-out", name: "Allocations Out" },
];

export default function AllocationsInputPage() {
  const [year, setYear] = useState(YEARS[1]); // default FY 2025
  const [entity, setEntity] = useState(ENTITIES[0]);
  const [deptFilter, setDeptFilter] = useState(DEPARTMENT_FILTERS[0]);

  const handleSave = () => {
    // TODO: wire up to backend later
    console.log("Saving allocations:", { year, entity, deptFilter });
  };

  const visibleDepartments =
    deptFilter === "All Departments"
      ? DEPARTMENTS
      : DEPARTMENTS.filter((d) => d.name === deptFilter);

  return (
    <div className="input-page">
      {/* Top page header, same pattern as Controllables Input */}
      <header className="input-page-header">
        <h1 className="input-page-title">Allocations Input</h1>
        <p className="input-page-subtitle">
          Enter allocation amounts by department and account.
        </p>
      </header>

      {/* Card with filters + Save button + table */}
      <section className="input-card">
        {/* Filters row + Save button */}
        <div className="input-card-header-row">
          <div className="input-page-filters-row">
            <div className="filter-group">
              <span className="filter-label">Budget Year</span>
              <select
                className="filter-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-label">Entity</span>
              <select
                className="filter-select"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
              >
                {ENTITIES.map((eVal) => (
                  <option key={eVal} value={eVal}>
                    {eVal}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-label">Department</span>
              <select
                className="filter-select"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                {DEPARTMENT_FILTERS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-card-actions">
            <button
              type="button"
              className="bs-button bs-button-primary"
              onClick={handleSave}
            >
              Save Changes
            </button>
          </div>
        </div> {/* ✅ closes .input-card-header-row */}

        {/* Allocations table */}
        <h2 className="input-section-title">Allocations</h2>

        <div className="input-table-wrapper">
          <table className="input-grid-table">
            <thead>
              <tr>
                <th>Dept #</th>
                <th>Dept Name</th>
                {ALLOCATION_ACCOUNTS.map((acct) => (
                  <th key={acct.id}>{acct.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleDepartments.map((dept) => (
                <tr key={dept.code}>
                  <td>{dept.code}</td>
                  <td>{dept.name}</td>
                  {ALLOCATION_ACCOUNTS.map((acct) => (
                    <td key={acct.id}>
                      <input
                        type="number"
                        className="input-grid-number"
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
