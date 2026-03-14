"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Project {
  id: number;
  project_name: string;
  description: string;
  fuel_type: string;
  size_mw: number;
  capacity_mw: number;
  iso_region: string;
  state: string;
  county: string;
  queue_number: string;
  utility: string;
  interconnection_status: string;
  security_posted_to_date: number;
  security_at_risk_to_date: number;
  study_deposits_posted: number;
  sunk_cost_to_date: number;
  planned_cod: string;
  next_due_date: string;
  next_security_milestone: number;
}

// Fallback mock data for when API is unavailable (e.g. Vercel deployment)
const MOCK_PROJECTS: Project[] = [
  { id: 1, project_name: "Manor Solar v2", description: "200 MW solar project in Albany County", fuel_type: "Solar", size_mw: 200, capacity_mw: 120, iso_region: "NYISO", state: "NY", county: "Albany", queue_number: "NY-2024-0142", utility: "PSEG", interconnection_status: "Feasibility Study", security_posted_to_date: 500000, security_at_risk_to_date: 200000, study_deposits_posted: 80000, sunk_cost_to_date: 120000, planned_cod: "2026-11-01", next_due_date: "2025-06-15", next_security_milestone: 300000 },
  { id: 2, project_name: "Midwest Wind Farm", description: "350 MW wind farm in McLean County, IL", fuel_type: "Wind", size_mw: 350, capacity_mw: 280, iso_region: "MISO", state: "IL", county: "McLean", queue_number: "J1042", utility: "Ameren", interconnection_status: "System Impact Study", security_posted_to_date: 2100000, security_at_risk_to_date: 1400000, study_deposits_posted: 250000, sunk_cost_to_date: 380000, planned_cod: "2027-06-01", next_due_date: "2025-09-01", next_security_milestone: 1800000 },
  { id: 3, project_name: "PJM Solar Hub", description: "200 MW solar + storage hybrid in Lancaster County", fuel_type: "Solar + Storage", size_mw: 200, capacity_mw: 150, iso_region: "PJM", state: "PA", county: "Lancaster", queue_number: "AH1-234", utility: "PPL Electric", interconnection_status: "Facilities Study", security_posted_to_date: 3500000, security_at_risk_to_date: 2800000, study_deposits_posted: 400000, sunk_cost_to_date: 550000, planned_cod: "2027-03-01", next_due_date: "2025-08-01", next_security_milestone: 2400000 },
  { id: 4, project_name: "Desert Sun BESS", description: "400 MW battery storage in Riverside County, CA", fuel_type: "Battery Storage", size_mw: 400, capacity_mw: 400, iso_region: "CAISO", state: "CA", county: "Riverside", queue_number: "CL2023-456", utility: "SCE", interconnection_status: "System Impact Study", security_posted_to_date: 4200000, security_at_risk_to_date: 3000000, study_deposits_posted: 500000, sunk_cost_to_date: 720000, planned_cod: "2028-01-01", next_due_date: "2025-12-01", next_security_milestone: 3300000 },
  { id: 5, project_name: "Prairie Wind SPP", description: "300 MW wind project in Woodward County, OK", fuel_type: "Wind", size_mw: 300, capacity_mw: 250, iso_region: "SPP", state: "OK", county: "Woodward", queue_number: "DISIS-2024-089", utility: "OGE", interconnection_status: "Feasibility Study", security_posted_to_date: 900000, security_at_risk_to_date: 500000, study_deposits_posted: 120000, sunk_cost_to_date: 180000, planned_cod: "2028-06-01", next_due_date: "2025-07-15", next_security_milestone: 1200000 },
  { id: 6, project_name: "Texas Solar Ranch", description: "500 MW utility-scale solar in Webb County, TX", fuel_type: "Solar", size_mw: 500, capacity_mw: 450, iso_region: "ERCOT", state: "TX", county: "Webb", queue_number: "INR-2023-1105", utility: "Oncor", interconnection_status: "IA Negotiation", security_posted_to_date: 6000000, security_at_risk_to_date: 5200000, study_deposits_posted: 350000, sunk_cost_to_date: 900000, planned_cod: "2026-09-01", next_due_date: "2025-04-01", next_security_milestone: 4000000 },
  { id: 7, project_name: "Appalachian Wind", description: "275 MW wind project in Grant County, WV", fuel_type: "Wind", size_mw: 275, capacity_mw: 220, iso_region: "PJM", state: "WV", county: "Grant", queue_number: "AF2-567", utility: "AEP", interconnection_status: "Feasibility Study", security_posted_to_date: 400000, security_at_risk_to_date: 150000, study_deposits_posted: 60000, sunk_cost_to_date: 95000, planned_cod: "2029-03-01", next_due_date: "2025-10-01", next_security_milestone: 500000 },
  { id: 8, project_name: "Nevada BESS", description: "250 MW battery storage in Clark County, NV", fuel_type: "Battery Storage", size_mw: 250, capacity_mw: 250, iso_region: "CAISO", state: "NV", county: "Clark", queue_number: "CL2023-789", utility: "NVE", interconnection_status: "Facilities Study", security_posted_to_date: 2800000, security_at_risk_to_date: 2200000, study_deposits_posted: 300000, sunk_cost_to_date: 420000, planned_cod: "2027-09-01", next_due_date: "2025-11-01", next_security_milestone: 2000000 },
  { id: 9, project_name: "Gulf Coast Wind", description: "450 MW wind farm in Cameron County, LA", fuel_type: "Wind", size_mw: 450, capacity_mw: 380, iso_region: "MISO", state: "LA", county: "Cameron", queue_number: "J1198", utility: "Entergy", interconnection_status: "System Impact Study", security_posted_to_date: 1500000, security_at_risk_to_date: 1000000, study_deposits_posted: 200000, sunk_cost_to_date: 310000, planned_cod: "2028-09-01", next_due_date: "2025-08-15", next_security_milestone: 2800000 },
  { id: 10, project_name: "Carolina Hybrid", description: "320 MW solar + storage hybrid in Cumberland County, NC", fuel_type: "Solar + Storage", size_mw: 320, capacity_mw: 260, iso_region: "PJM", state: "NC", county: "Cumberland", queue_number: "AH2-890", utility: "Duke", interconnection_status: "System Impact Study", security_posted_to_date: 1800000, security_at_risk_to_date: 1200000, study_deposits_posted: 280000, sunk_cost_to_date: 350000, planned_cod: "2028-03-01", next_due_date: "2025-09-15", next_security_milestone: 1600000 },
  { id: 11, project_name: "Kansas Wind Farm", description: "400 MW wind farm in Ford County, KS", fuel_type: "Wind", size_mw: 400, capacity_mw: 340, iso_region: "SPP", state: "KS", county: "Ford", queue_number: "DISIS-2022-045", utility: "Evergy", interconnection_status: "IA Executed", security_posted_to_date: 7500000, security_at_risk_to_date: 6800000, study_deposits_posted: 400000, sunk_cost_to_date: 1200000, planned_cod: "2026-12-01", next_due_date: "2025-05-01", next_security_milestone: 5000000 },
  { id: 12, project_name: "New England Solar", description: "120 MW solar project in Berkshire County, MA", fuel_type: "Solar", size_mw: 120, capacity_mw: 100, iso_region: "ISO-NE", state: "MA", county: "Berkshire", queue_number: "NE-2024-0331", utility: "Eversource", interconnection_status: "Facilities Study", security_posted_to_date: 1200000, security_at_risk_to_date: 900000, study_deposits_posted: 150000, sunk_cost_to_date: 210000, planned_cod: "2027-06-01", next_due_date: "2025-07-01", next_security_milestone: 800000 },
];

const ISO_COLORS: Record<string, string> = {
  PJM: "bg-blue-100 text-blue-800",
  MISO: "bg-green-100 text-green-800",
  SPP: "bg-purple-100 text-purple-800",
  CAISO: "bg-orange-100 text-orange-800",
  NYISO: "bg-pink-100 text-pink-800",
  "ISO-NE": "bg-cyan-100 text-cyan-800",
  ERCOT: "bg-red-100 text-red-800",
};

const FUEL_ICONS: Record<string, string> = {
  Solar: "sun",
  Wind: "wind",
  "Battery Storage": "battery",
  "Solar + Storage": "sun-battery",
  "Wind + Storage": "wind-battery",
  "Natural Gas": "flame",
};

function formatCurrency(val: number) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

function FuelIcon({ type }: { type: string }) {
  const iconMap: Record<string, string> = {
    Solar: "text-amber-500",
    Wind: "text-sky-500",
    "Battery Storage": "text-green-500",
    "Solar + Storage": "text-amber-500",
    "Natural Gas": "text-red-500",
  };
  const color = iconMap[type] || "text-gray-500";
  return <span className={`text-lg ${color}`}>{type === "Solar" || type === "Solar + Storage" ? "\u2600" : type === "Wind" || type === "Wind + Storage" ? "\u2601" : type === "Battery Storage" ? "\u26A1" : "\u26A0"}</span>;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterISO, setFilterISO] = useState("");
  const [filterFuel, setFilterFuel] = useState("");
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [filterISO, filterFuel, search]);

  async function fetchProjects() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterISO) params.set("iso", filterISO);
      if (filterFuel) params.set("fuel", filterFuel);
      if (search) params.set("search", search);
      const res = await fetch(`/api/projects?${params}`);
      if (!res.ok) throw new Error("API unavailable");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setProjects(data);
      } else {
        // Fall back to mock data with client-side filtering
        let filtered = [...MOCK_PROJECTS];
        if (filterISO) filtered = filtered.filter((p) => p.iso_region === filterISO);
        if (filterFuel) filtered = filtered.filter((p) => p.fuel_type === filterFuel);
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter((p) => p.project_name.toLowerCase().includes(s) || p.queue_number.toLowerCase().includes(s) || p.state.toLowerCase().includes(s));
        }
        setProjects(filtered);
      }
    } catch {
      // API unavailable (e.g. Vercel) — use mock data with client-side filtering
      let filtered = [...MOCK_PROJECTS];
      if (filterISO) filtered = filtered.filter((p) => p.iso_region === filterISO);
      if (filterFuel) filtered = filtered.filter((p) => p.fuel_type === filterFuel);
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter((p) => p.project_name.toLowerCase().includes(s) || p.queue_number.toLowerCase().includes(s) || p.state.toLowerCase().includes(s));
      }
      setProjects(filtered);
    }
    setLoading(false);
  }

  async function deleteProject(id: number) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    fetchProjects();
  }

  const totalMW = projects.reduce((s, p) => s + p.size_mw, 0);
  const totalSecurityPosted = projects.reduce((s, p) => s + p.security_posted_to_date, 0);
  const totalAtRisk = projects.reduce((s, p) => s + p.security_at_risk_to_date, 0);
  const isoBreakdown = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.iso_region] = (acc[p.iso_region] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your interconnection queue projects across ISOs
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-400 transition-colors"
        >
          + New Project
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Projects</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{projects.length}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(isoBreakdown).map(([iso, count]) => (
              <span key={iso} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ISO_COLORS[iso] || "bg-gray-100 text-gray-800"}`}>
                {iso}: {count}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Capacity</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalMW.toLocaleString()} MW</p>
          <p className="mt-1 text-sm text-slate-500">Across all projects</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Security Posted</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{formatCurrency(totalSecurityPosted)}</p>
          <p className="mt-1 text-sm text-slate-500">Total deposits & security</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Security at Risk</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{formatCurrency(totalAtRisk)}</p>
          <Link href="/projects/security" className="mt-1 text-sm text-amber-600 hover:text-amber-700 font-medium">
            View Forecast →
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search projects, queue numbers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <select
          value={filterISO}
          onChange={(e) => setFilterISO(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="">All ISOs</option>
          {["PJM", "MISO", "SPP", "CAISO", "NYISO", "ISO-NE", "ERCOT"].map((iso) => (
            <option key={iso} value={iso}>{iso}</option>
          ))}
        </select>
        <select
          value={filterFuel}
          onChange={(e) => setFilterFuel(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="">All Fuel Types</option>
          {["Solar", "Wind", "Battery Storage", "Solar + Storage", "Wind + Storage", "Natural Gas"].map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Project Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-slate-200">
          <p className="text-lg font-medium text-slate-600">No projects found</p>
          <p className="mt-1 text-sm text-slate-400">Create a new project or adjust your filters</p>
          <Link
            href="/projects/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-400"
          >
            + New Project
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Project</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">ISO / Queue</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Fuel / Size</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Location</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Security Posted</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">At Risk</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">COD</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/projects/${p.id}`} className="font-medium text-slate-900 hover:text-amber-600">
                        {p.project_name}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-[200px] truncate">{p.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ISO_COLORS[p.iso_region] || "bg-gray-100 text-gray-800"}`}>
                        {p.iso_region}
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">{p.queue_number}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <FuelIcon type={p.fuel_type} />
                        <span className="text-slate-700">{p.fuel_type}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{p.size_mw} MW</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.county && `${p.county}, `}{p.state}
                      <p className="text-xs text-slate-400 mt-0.5">{p.utility}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {p.interconnection_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">
                      {formatCurrency(p.security_posted_to_date)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">
                      {formatCurrency(p.security_at_risk_to_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">
                      {p.planned_cod ? new Date(p.planned_cod).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/projects/${p.id}`}
                          className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          View
                        </Link>
                        <Link
                          href={`/projects/${p.id}/edit`}
                          className="rounded-md px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50"
                        >
                          Edit
                        </Link>
                        {deleteConfirm === p.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteProject(p.id)}
                              className="rounded-md px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(p.id)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
