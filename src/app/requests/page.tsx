"use client";

import { useState } from "react";
import Link from "next/link";

const ISO_COLORS: Record<string, string> = {
  PJM: "bg-blue-100 text-blue-800",
  MISO: "bg-green-100 text-green-800",
  SPP: "bg-purple-100 text-purple-800",
  CAISO: "bg-orange-100 text-orange-800",
  NYISO: "bg-pink-100 text-pink-800",
  "ISO-NE": "bg-cyan-100 text-cyan-800",
  ERCOT: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-sky-100 text-sky-800",
  "In Progress": "bg-amber-100 text-amber-800",
  "Under Review": "bg-violet-100 text-violet-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-800",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600",
  Normal: "bg-blue-100 text-blue-700",
  High: "bg-amber-100 text-amber-800",
  Urgent: "bg-red-100 text-red-800",
};

const MOCK_REQUESTS = [
  {
    id: 1,
    title: "Greenfield Injection Study - Manor Solar v2",
    description: "Request transmission team to perform injection study for the Manor Solar v2 200MW project at Brink-Pine Wood 345kV POI",
    request_type: "Injection Study",
    priority: "High",
    status: "In Progress",
    requester_name: "John V",
    requester_team: "Development",
    assigned_to: "Sarah Chen",
    assigned_team: "Transmission",
    project_name: "Manor Solar v2",
    project_id: 1,
    iso_region: "NYISO",
    created_at: "2026-02-15T10:30:00",
    updated_at: "2026-03-10T14:20:00",
    completed_at: null,
    comments_count: 4,
  },
  {
    id: 2,
    title: "Power Flow Study - Midwest Wind Farm",
    description: "Need power flow analysis for 350MW wind injection at Bloomington 345kV. MISO DPP Phase 2 requirement.",
    request_type: "Power Flow Study",
    priority: "Urgent",
    status: "Open",
    requester_name: "Sarah K",
    requester_team: "Development",
    assigned_to: "James Miller",
    assigned_team: "Transmission",
    project_name: "Midwest Wind Farm",
    project_id: 2,
    iso_region: "MISO",
    created_at: "2026-03-10T09:00:00",
    updated_at: "2026-03-10T09:00:00",
    completed_at: null,
    comments_count: 0,
  },
  {
    id: 3,
    title: "Short Circuit Analysis - PJM Solar Hub",
    description: "Perform short circuit study per BPM-15 requirements for 200MW Solar+Storage at Lancaster 230kV bus",
    request_type: "Short Circuit Study",
    priority: "Normal",
    status: "Under Review",
    requester_name: "Mike R",
    requester_team: "Engineering",
    assigned_to: "David Park",
    assigned_team: "Transmission",
    project_name: "PJM Solar Hub",
    project_id: 3,
    iso_region: "PJM",
    created_at: "2026-01-20T08:15:00",
    updated_at: "2026-03-08T16:45:00",
    completed_at: null,
    comments_count: 7,
  },
  {
    id: 4,
    title: "Affected System Study - Desert Sun BESS",
    description: "CAISO Cluster 14 affected system study for 400MW BESS at Devers 500kV. Need to assess impact on neighboring systems.",
    request_type: "Affected System Study",
    priority: "High",
    status: "Completed",
    requester_name: "Lisa T",
    requester_team: "Development",
    assigned_to: "Rachel Kim",
    assigned_team: "Interconnection",
    project_name: "Desert Sun BESS",
    project_id: 4,
    iso_region: "CAISO",
    created_at: "2025-12-01T11:00:00",
    updated_at: "2026-02-28T09:30:00",
    completed_at: "2026-02-28T09:30:00",
    comments_count: 12,
  },
  {
    id: 5,
    title: "Greenfield Assessment - Prairie Wind SPP",
    description: "Greenfield assessment for new 300MW wind farm at Woodward 345kV. SPP DISIS 2023-1 cluster.",
    request_type: "Greenfield Assessment",
    priority: "Normal",
    status: "In Progress",
    requester_name: "Tom B",
    requester_team: "Development",
    assigned_to: "Maria Garcia",
    assigned_team: "Transmission",
    project_name: "Prairie Wind SPP",
    project_id: 5,
    iso_region: "SPP",
    created_at: "2026-02-01T13:45:00",
    updated_at: "2026-03-12T10:00:00",
    completed_at: null,
    comments_count: 3,
  },
  {
    id: 6,
    title: "Injection Study Review - PJM Cluster Window 2",
    description: "Review injection study results for Window 2 projects. Need validation of thermal analysis.",
    request_type: "Injection Study",
    priority: "Low",
    status: "Completed",
    requester_name: "David Park",
    requester_team: "Transmission",
    assigned_to: "Mike R",
    assigned_team: "Engineering",
    project_name: "PJM Solar Hub",
    project_id: 3,
    iso_region: "PJM",
    created_at: "2025-11-15T08:00:00",
    updated_at: "2026-01-10T15:00:00",
    completed_at: "2026-01-10T15:00:00",
    comments_count: 9,
  },
  {
    id: 7,
    title: "Power Flow Restudy - MISO Phase 3",
    description: "Re-run power flow models after topology changes in MISO region. Previous results invalidated by network update.",
    request_type: "Power Flow Study",
    priority: "Urgent",
    status: "Open",
    requester_name: "James Miller",
    requester_team: "Transmission",
    assigned_to: "",
    assigned_team: "Engineering",
    project_name: "Midwest Wind Farm",
    project_id: 2,
    iso_region: "MISO",
    created_at: "2026-03-12T07:30:00",
    updated_at: "2026-03-12T07:30:00",
    completed_at: null,
    comments_count: 0,
  },
  {
    id: 8,
    title: "Regulatory Compliance Check - NYISO Queue",
    description: "Verify all NYISO queue documentation meets current regulatory requirements before QSA deadline.",
    request_type: "General",
    priority: "High",
    status: "Rejected",
    requester_name: "Admin Team",
    requester_team: "Regulatory",
    assigned_to: "John V",
    assigned_team: "Development",
    project_name: "Manor Solar v2",
    project_id: 1,
    iso_region: "NYISO",
    created_at: "2026-02-20T14:00:00",
    updated_at: "2026-03-01T11:00:00",
    completed_at: "2026-03-01T11:00:00",
    comments_count: 2,
  },
];

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

function daysBetween(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.floor(diff / 86400000);
}

export default function RequestDashboard() {
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterISO, setFilterISO] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [search, setSearch] = useState("");

  const filtered = MOCK_REQUESTS.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterType && r.request_type !== filterType) return false;
    if (filterISO && r.iso_region !== filterISO) return false;
    if (filterTeam && r.assigned_team !== filterTeam && r.requester_team !== filterTeam) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!r.title.toLowerCase().includes(s) && !r.assigned_to.toLowerCase().includes(s) && !r.requester_name.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const openCount = MOCK_REQUESTS.filter((r) => r.status === "Open" || r.status === "In Progress").length;
  const completedThisMonth = MOCK_REQUESTS.filter((r) => r.completed_at && r.completed_at.startsWith("2026-03")).length;
  const completedRequests = MOCK_REQUESTS.filter((r) => r.completed_at);
  const avgDays = completedRequests.length > 0
    ? Math.round(completedRequests.reduce((s, r) => s + daysBetween(r.created_at, r.completed_at!), 0) / completedRequests.length)
    : 0;

  const byTeam = MOCK_REQUESTS.reduce<Record<string, number>>((acc, r) => {
    if (r.assigned_team) acc[r.assigned_team] = (acc[r.assigned_team] || 0) + 1;
    return acc;
  }, {});

  const byStatus = MOCK_REQUESTS.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Request Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track inter-team requests for studies, assessments, and reviews
          </p>
        </div>
        <Link
          href="/requests/new"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-400 transition-colors"
        >
          + New Request
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Requests</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{MOCK_REQUESTS.length}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(byStatus).map(([status, count]) => (
              <span key={status} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
                {status}: {count}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-sky-50 p-5 shadow-sm border border-sky-200">
          <p className="text-xs font-medium text-sky-600 uppercase tracking-wide">Open / Active</p>
          <p className="mt-2 text-3xl font-bold text-sky-700">{openCount}</p>
          <p className="mt-1 text-sm text-sky-500">Awaiting action</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Processing Time</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{avgDays} days</p>
          <p className="mt-1 text-sm text-slate-400">Creation to completion</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-5 shadow-sm border border-emerald-200">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Completed This Month</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{completedThisMonth}</p>
          <p className="mt-1 text-sm text-emerald-500">March 2026</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">By Assigned Team</p>
          <div className="mt-2 space-y-1">
            {Object.entries(byTeam).sort((a, b) => b[1] - a[1]).map(([team, count]) => (
              <div key={team} className="flex items-center justify-between">
                <span className="text-xs text-slate-600">{team}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${(count / MOCK_REQUESTS.length) * 60}px` }} />
                  <span className="text-xs font-semibold text-slate-700">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search requests, people..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
          <option value="">All Statuses</option>
          {["Open", "In Progress", "Under Review", "Completed", "Rejected"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
          <option value="">All Types</option>
          {["Injection Study", "Power Flow Study", "Short Circuit Study", "Greenfield Assessment", "Affected System Study", "General"].map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={filterISO} onChange={(e) => setFilterISO(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
          <option value="">All ISOs</option>
          {["PJM", "MISO", "SPP", "CAISO", "NYISO"].map((i) => <option key={i}>{i}</option>)}
        </select>
        <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
          <option value="">All Teams</option>
          {["Development", "Transmission", "Engineering", "Interconnection", "Regulatory"].map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Request Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Request</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">From</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Assigned To</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Project</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">ISO</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Age</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Replies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 max-w-[250px]">
                    <Link href={`/requests/${r.id}`} className="font-medium text-slate-900 hover:text-amber-600">
                      {r.title}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{r.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-600">{r.request_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-700">{r.requester_name}</p>
                    <p className="text-xs text-slate-400">{r.requester_team}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-700">{r.assigned_to || "Unassigned"}</p>
                    <p className="text-xs text-slate-400">{r.assigned_team}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/projects/${r.project_id}`} className="text-sm text-amber-600 hover:text-amber-700">
                      {r.project_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ISO_COLORS[r.iso_region]}`}>
                      {r.iso_region}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[r.priority]}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {r.completed_at
                      ? `${daysBetween(r.created_at, r.completed_at)}d`
                      : `${daysSince(r.created_at)}d`
                    }
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center rounded-full h-6 w-6 text-xs font-medium ${r.comments_count > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"}`}>
                      {r.comments_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
