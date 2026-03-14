"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Mock Portfolio Data ─────────────────────────────────────────────────────
const PROJECTS = [
  { id: 1, name: "Manor Solar v2", fuel: "Solar", mw: 200, capacity: 120, iso: "NYISO", state: "NY", county: "Albany", utility: "PSEG", status: "Feasibility Study", cod: "2026-11", security_posted: 500000, security_at_risk: 200000, cost: 8000000 },
  { id: 2, name: "Midwest Wind Farm", fuel: "Wind", mw: 350, capacity: 280, iso: "MISO", state: "IL", county: "McLean", utility: "Ameren", status: "System Impact Study", cod: "2027-06", security_posted: 2100000, security_at_risk: 1400000, cost: 20500000 },
  { id: 3, name: "PJM Solar Hub", fuel: "Solar + Storage", mw: 200, capacity: 150, iso: "PJM", state: "PA", county: "Lancaster", utility: "PPL Electric", status: "Facilities Study", cod: "2027-03", security_posted: 3500000, security_at_risk: 2800000, cost: 10700000 },
  { id: 4, name: "Desert Sun BESS", fuel: "Battery Storage", mw: 400, capacity: 400, iso: "CAISO", state: "CA", county: "Riverside", utility: "SCE", status: "System Impact Study", cod: "2028-01", security_posted: 4200000, security_at_risk: 3000000, cost: 24000000 },
  { id: 5, name: "Prairie Wind SPP", fuel: "Wind", mw: 300, capacity: 250, iso: "SPP", state: "OK", county: "Woodward", utility: "OGE", status: "Feasibility Study", cod: "2028-06", security_posted: 900000, security_at_risk: 500000, cost: 12500000 },
  { id: 6, name: "Texas Solar Ranch", fuel: "Solar", mw: 500, capacity: 450, iso: "ERCOT", state: "TX", county: "Webb", utility: "Oncor", status: "IA Negotiation", cod: "2026-09", security_posted: 6000000, security_at_risk: 5200000, cost: 18000000 },
  { id: 7, name: "Appalachian Wind", fuel: "Wind", mw: 275, capacity: 220, iso: "PJM", state: "WV", county: "Grant", utility: "AEP", status: "Feasibility Study", cod: "2029-03", security_posted: 400000, security_at_risk: 150000, cost: 15000000 },
  { id: 8, name: "Nevada BESS", fuel: "Battery Storage", mw: 250, capacity: 250, iso: "CAISO", state: "NV", county: "Clark", utility: "NVE", status: "Facilities Study", cod: "2027-09", security_posted: 2800000, security_at_risk: 2200000, cost: 12000000 },
  { id: 9, name: "Great Lakes Solar", fuel: "Solar", mw: 180, capacity: 140, iso: "MISO", state: "MI", county: "Washtenaw", utility: "DTE", status: "Pre-Application", cod: "2029-06", security_posted: 100000, security_at_risk: 0, cost: 8500000 },
  { id: 10, name: "Carolina Hybrid", fuel: "Solar + Storage", mw: 320, capacity: 260, iso: "PJM", state: "NC", county: "Cumberland", utility: "Duke", status: "System Impact Study", cod: "2028-03", security_posted: 1800000, security_at_risk: 1200000, cost: 16000000 },
  { id: 11, name: "Kansas Wind Farm", fuel: "Wind", mw: 400, capacity: 340, iso: "SPP", state: "KS", county: "Ford", utility: "Evergy", status: "IA Executed", cod: "2026-12", security_posted: 7500000, security_at_risk: 6800000, cost: 22000000 },
  { id: 12, name: "Arizona Solar Park", fuel: "Solar", mw: 350, capacity: 320, iso: "CAISO", state: "AZ", county: "Maricopa", utility: "APS", status: "Under Construction", cod: "2026-06", security_posted: 9000000, security_at_risk: 8500000, cost: 14000000 },
  { id: 13, name: "Ohio Storage Hub", fuel: "Battery Storage", mw: 150, capacity: 150, iso: "PJM", state: "OH", county: "Franklin", utility: "AEP", status: "Feasibility Study", cod: "2029-01", security_posted: 250000, security_at_risk: 100000, cost: 7500000 },
  { id: 14, name: "Gulf Coast Wind", fuel: "Wind", mw: 450, capacity: 380, iso: "MISO", state: "LA", county: "Cameron", utility: "Entergy", status: "System Impact Study", cod: "2028-09", security_posted: 1500000, security_at_risk: 1000000, cost: 25000000 },
  { id: 15, name: "New England Solar", fuel: "Solar", mw: 120, capacity: 100, iso: "ISO-NE", state: "MA", county: "Berkshire", utility: "Eversource", status: "Facilities Study", cod: "2027-06", security_posted: 1200000, security_at_risk: 900000, cost: 6500000 },
];

const ISO_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  PJM:     { bg: "bg-blue-100", text: "text-blue-800", bar: "bg-blue-500" },
  MISO:    { bg: "bg-green-100", text: "text-green-800", bar: "bg-green-500" },
  SPP:     { bg: "bg-purple-100", text: "text-purple-800", bar: "bg-purple-500" },
  CAISO:   { bg: "bg-orange-100", text: "text-orange-800", bar: "bg-orange-500" },
  NYISO:   { bg: "bg-pink-100", text: "text-pink-800", bar: "bg-pink-500" },
  "ISO-NE":{ bg: "bg-cyan-100", text: "text-cyan-800", bar: "bg-cyan-500" },
  ERCOT:   { bg: "bg-red-100", text: "text-red-800", bar: "bg-red-500" },
};

const FUEL_COLORS: Record<string, { bar: string; dot: string }> = {
  Solar:             { bar: "bg-amber-400", dot: "bg-amber-400" },
  Wind:              { bar: "bg-sky-400", dot: "bg-sky-400" },
  "Battery Storage": { bar: "bg-emerald-400", dot: "bg-emerald-400" },
  "Solar + Storage": { bar: "bg-orange-400", dot: "bg-orange-400" },
};

const STATUS_COLORS: Record<string, string> = {
  "Pre-Application": "bg-slate-100 text-slate-600",
  "Feasibility Study": "bg-sky-100 text-sky-700",
  "System Impact Study": "bg-amber-100 text-amber-700",
  "Facilities Study": "bg-violet-100 text-violet-700",
  "IA Negotiation": "bg-indigo-100 text-indigo-700",
  "IA Executed": "bg-emerald-100 text-emerald-700",
  "Under Construction": "bg-lime-100 text-lime-700",
  "Commercial Operation": "bg-green-100 text-green-800",
};

function fmt(val: number) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val}`;
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {});
}

// ─── Horizontal Bar Chart ────────────────────────────────────────────────────
function HBar({ data, colorMap, unit = "MW" }: { data: { label: string; value: number }[]; colorMap?: Record<string, string>; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 text-xs font-medium text-slate-600 text-right truncate">{d.label}</span>
          <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all ${colorMap?.[d.label] || "bg-amber-400"}`}
              style={{ width: `${Math.max((d.value / max) * 100, 2)}%` }}
            />
          </div>
          <span className="w-20 text-xs font-bold text-slate-800 text-right">
            {unit === "$" ? fmt(d.value) : `${d.value.toLocaleString()} ${unit}`}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Stacked COD Timeline Bar ────────────────────────────────────────────────
function CODTimeline({ projects }: { projects: typeof PROJECTS }) {
  const byYear = groupBy(projects, (p) => p.cod.slice(0, 4));
  const years = Object.keys(byYear).sort();
  const maxMW = Math.max(...years.map((y) => byYear[y].reduce((s, p) => s + p.mw, 0)), 1);

  return (
    <div className="flex items-end gap-3 h-56">
      {years.map((year) => {
        const yearProjects = byYear[year];
        const totalMW = yearProjects.reduce((s, p) => s + p.mw, 0);
        const byFuel = groupBy(yearProjects, (p) => p.fuel);
        const heightPct = (totalMW / maxMW) * 100;

        return (
          <div key={year} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-slate-700">{totalMW.toLocaleString()}</span>
            <div className="w-full rounded-t-lg overflow-hidden flex flex-col-reverse" style={{ height: `${Math.max(heightPct, 8)}%` }}>
              {Object.entries(byFuel).map(([fuel, fps]) => {
                const fuelMW = fps.reduce((s, p) => s + p.mw, 0);
                const fuelPct = (fuelMW / totalMW) * 100;
                return (
                  <div
                    key={fuel}
                    className={`w-full ${FUEL_COLORS[fuel]?.bar || "bg-slate-400"}`}
                    style={{ height: `${fuelPct}%` }}
                    title={`${fuel}: ${fuelMW} MW`}
                  />
                );
              })}
            </div>
            <span className="text-xs font-semibold text-slate-500">{year}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Donut Chart (CSS) ───────────────────────────────────────────────────────
function DonutChart({ segments, centerLabel, centerValue }: { segments: { label: string; value: number; color: string }[]; centerLabel: string; centerValue: string }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cumulative = 0;
  const gradientParts = segments.map((seg) => {
    const start = (cumulative / total) * 360;
    cumulative += seg.value;
    const end = (cumulative / total) * 360;
    return `${seg.color} ${start}deg ${end}deg`;
  });
  const gradient = `conic-gradient(${gradientParts.join(", ")})`;

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0">
        <div className="h-36 w-36 rounded-full" style={{ background: gradient }} />
        <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{centerValue}</span>
          <span className="text-xs text-slate-400">{centerLabel}</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-slate-600">{seg.label}</span>
            <span className="text-xs font-bold text-slate-800">{seg.value.toLocaleString()} MW</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mini Stat Card ──────────────────────────────────────────────────────────
function StatCard({ label, value, subtext, color = "text-slate-900" }: { label: string; value: string; subtext?: string; color?: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
      {subtext && <p className="mt-1 text-sm text-slate-400">{subtext}</p>}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
function Section({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-white p-6 shadow-sm border border-slate-200 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [filterISO, setFilterISO] = useState("");
  const [filterFuel, setFilterFuel] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filtered = PROJECTS.filter((p) => {
    if (filterISO && p.iso !== filterISO) return false;
    if (filterFuel && p.fuel !== filterFuel) return false;
    if (filterState && p.state !== filterState) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  const totalMW = filtered.reduce((s, p) => s + p.mw, 0);
  const totalCapacity = filtered.reduce((s, p) => s + p.capacity, 0);
  const totalSecurityPosted = filtered.reduce((s, p) => s + p.security_posted, 0);
  const totalAtRisk = filtered.reduce((s, p) => s + p.security_at_risk, 0);
  const totalCost = filtered.reduce((s, p) => s + p.cost, 0);
  const uniqueStates = [...new Set(filtered.map((p) => p.state))].length;

  // MW by fuel type
  const byFuel = groupBy(filtered, (p) => p.fuel);
  const fuelData = Object.entries(byFuel)
    .map(([fuel, ps]) => ({ label: fuel, value: ps.reduce((s, p) => s + p.mw, 0) }))
    .sort((a, b) => b.value - a.value);

  // MW by ISO
  const byISO = groupBy(filtered, (p) => p.iso);
  const isoData = Object.entries(byISO)
    .map(([iso, ps]) => ({ label: iso, value: ps.reduce((s, p) => s + p.mw, 0) }))
    .sort((a, b) => b.value - a.value);

  // MW by State
  const byState = groupBy(filtered, (p) => p.state);
  const stateData = Object.entries(byState)
    .map(([state, ps]) => ({ label: state, value: ps.reduce((s, p) => s + p.mw, 0) }))
    .sort((a, b) => b.value - a.value);

  // By Status
  const byStatus = groupBy(filtered, (p) => p.status);
  const statusData = Object.entries(byStatus)
    .map(([status, ps]) => ({ label: status, value: ps.reduce((s, p) => s + p.mw, 0), count: ps.length }))
    .sort((a, b) => b.value - a.value);

  // Security by ISO
  const securityByISO = Object.entries(byISO)
    .map(([iso, ps]) => ({ label: iso, value: ps.reduce((s, p) => s + p.security_at_risk, 0) }))
    .sort((a, b) => b.value - a.value);

  // Donut segments for fuel
  const fuelColors: Record<string, string> = {
    Solar: "#fbbf24", Wind: "#38bdf8", "Battery Storage": "#34d399", "Solar + Storage": "#fb923c",
  };
  const donutSegments = fuelData.map((d) => ({ label: d.label, value: d.value, color: fuelColors[d.label] || "#94a3b8" }));

  // All unique values for filters
  const allISOs = [...new Set(PROJECTS.map((p) => p.iso))].sort();
  const allFuels = [...new Set(PROJECTS.map((p) => p.fuel))].sort();
  const allStates = [...new Set(PROJECTS.map((p) => p.state))].sort();
  const allStatuses = [...new Set(PROJECTS.map((p) => p.status))].sort();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Portfolio-level insights across all interconnection projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Showing {filtered.length} of {PROJECTS.length} projects</span>
          {(filterISO || filterFuel || filterState || filterStatus) && (
            <button
              onClick={() => { setFilterISO(""); setFilterFuel(""); setFilterState(""); setFilterStatus(""); }}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select value={filterISO} onChange={(e) => setFilterISO(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
          <option value="">All ISOs</option>
          {allISOs.map((i) => <option key={i}>{i}</option>)}
        </select>
        <select value={filterFuel} onChange={(e) => setFilterFuel(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
          <option value="">All Fuel Types</option>
          {allFuels.map((f) => <option key={f}>{f}</option>)}
        </select>
        <select value={filterState} onChange={(e) => setFilterState(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
          <option value="">All States</option>
          {allStates.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
          <option value="">All Statuses</option>
          {allStatuses.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Projects" value={`${filtered.length}`} subtext={`${uniqueStates} states`} />
        <StatCard label="Pipeline MW" value={`${totalMW.toLocaleString()}`} subtext="Nameplate capacity" color="text-amber-600" />
        <StatCard label="Net Capacity" value={`${totalCapacity.toLocaleString()} MW`} subtext="Expected output" />
        <StatCard label="Security Posted" value={fmt(totalSecurityPosted)} color="text-emerald-600" />
        <StatCard label="Security at Risk" value={fmt(totalAtRisk)} color="text-red-600" />
        <StatCard label="Total Est. Cost" value={fmt(totalCost)} subtext="IC + Network upgrades" />
      </div>

      {/* Row 1: COD Timeline + Fuel Donut */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Section title="MW Coming Online by COD Year" subtitle="Stacked by fuel type" className="lg:col-span-2">
          <CODTimeline projects={filtered} />
          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-3">
            {Object.entries(FUEL_COLORS).map(([fuel, colors]) => (
              <div key={fuel} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                <span className="text-xs text-slate-500">{fuel}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Portfolio Mix by Fuel Type" subtitle="Total MW breakdown">
          <DonutChart
            segments={donutSegments}
            centerValue={`${totalMW.toLocaleString()}`}
            centerLabel="Total MW"
          />
        </Section>
      </div>

      {/* Row 2: MW by ISO + MW by State */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="MW by ISO Region" subtitle="Pipeline capacity by market">
          <HBar
            data={isoData}
            colorMap={Object.fromEntries(Object.entries(ISO_COLORS).map(([k, v]) => [k, v.bar]))}
          />
        </Section>

        <Section title="MW by State" subtitle="Geographic distribution">
          <HBar data={stateData} />
        </Section>
      </div>

      {/* Row 3: Status Pipeline + Security by ISO */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Pipeline by Interconnection Status" subtitle="Project count and MW at each stage">
          <div className="space-y-3">
            {statusData.map((d) => {
              const pct = totalMW > 0 ? (d.value / totalMW) * 100 : 0;
              return (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[d.label] || "bg-slate-100 text-slate-600"}`}>
                        {d.label}
                      </span>
                      <span className="text-xs text-slate-400">{d.count} project{d.count > 1 ? "s" : ""}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">{d.value.toLocaleString()} MW</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.max(pct, 1)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Security at Risk by ISO" subtitle="Financial exposure by market">
          <HBar
            data={securityByISO}
            colorMap={Object.fromEntries(Object.entries(ISO_COLORS).map(([k, v]) => [k, v.bar]))}
            unit="$"
          />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Total at Risk</span>
              <span className="text-lg font-bold text-red-600">{fmt(totalAtRisk)}</span>
            </div>
          </div>
        </Section>
      </div>

      {/* Row 4: Project List / Heatmap Table */}
      <Section title="All Projects Overview" subtitle="Complete portfolio with key metrics">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Project</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Fuel Type</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-600">MW</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-600">Capacity</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">ISO</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">State</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Utility</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Status</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">COD</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-600">Security Posted</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-600">At Risk</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-600">Est. Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5">
                    <Link href={`/projects/${p.id}`} className="font-medium text-slate-900 hover:text-amber-600">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${FUEL_COLORS[p.fuel]?.dot || "bg-slate-400"}`} />
                      <span className="text-slate-700">{p.fuel}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-800">{p.mw.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{p.capacity.toLocaleString()}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ISO_COLORS[p.iso]?.bg} ${ISO_COLORS[p.iso]?.text}`}>
                      {p.iso}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{p.state}</td>
                  <td className="px-3 py-2.5 text-slate-600 text-xs">{p.utility}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] || "bg-slate-100 text-slate-600"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {new Date(p.cod + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </td>
                  <td className="px-3 py-2.5 text-right text-emerald-600 font-medium">{fmt(p.security_posted)}</td>
                  <td className="px-3 py-2.5 text-right text-red-600 font-medium">{fmt(p.security_at_risk)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-700 font-medium">{fmt(p.cost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                <td className="px-3 py-2.5 text-slate-700">Portfolio Total</td>
                <td className="px-3 py-2.5 text-slate-500">{filtered.length} projects</td>
                <td className="px-3 py-2.5 text-right text-slate-800">{totalMW.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right text-slate-600">{totalCapacity.toLocaleString()}</td>
                <td colSpan={4} />
                <td className="px-3 py-2.5" />
                <td className="px-3 py-2.5 text-right text-emerald-700">{fmt(totalSecurityPosted)}</td>
                <td className="px-3 py-2.5 text-right text-red-700">{fmt(totalAtRisk)}</td>
                <td className="px-3 py-2.5 text-right text-slate-800">{fmt(totalCost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>
    </div>
  );
}
