"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// ─── ISO Phase Rules (simplified for forecast) ────────────────────────────
interface PhaseRule {
  phase: string;
  calcMethod: "fixed" | "per_mw" | "pct_upgrade" | "pct_total" | "formula";
  fixedAmount?: number;
  perMwAmount?: number;
  pctRequired: number;
  pctAtRisk: number;
  percentageOf?: string;
  cumulativeMonths: number;
  atRisk: boolean;
}

const ISO_PHASE_RULES: Record<string, PhaseRule[]> = {
  NYISO: [
    { phase: "Application", calcMethod: "per_mw", perMwAmount: 1000, pctRequired: 0, pctAtRisk: 0, cumulativeMonths: 0, atRisk: false },
    { phase: "SRIS/SIS", calcMethod: "per_mw", perMwAmount: 5000, pctRequired: 0, pctAtRisk: 100, cumulativeMonths: 12, atRisk: true },
    { phase: "Class Year", calcMethod: "pct_upgrade", pctRequired: 25, pctAtRisk: 100, percentageOf: "network_upgrades", cumulativeMonths: 30, atRisk: true },
    { phase: "IA Execution", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 36, atRisk: true },
    { phase: "Construction", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 60, atRisk: true },
    { phase: "COD", calcMethod: "pct_total", pctRequired: 0, pctAtRisk: 0, cumulativeMonths: 60, atRisk: false },
  ],
  MISO: [
    { phase: "DPP Entry (M1)", calcMethod: "per_mw", perMwAmount: 4000, pctRequired: 0, pctAtRisk: 0, cumulativeMonths: 0, atRisk: false },
    { phase: "Phase 1 (M2)", calcMethod: "per_mw", perMwAmount: 4000, pctRequired: 0, pctAtRisk: 100, cumulativeMonths: 12, atRisk: true },
    { phase: "Phase 2 (M3)", calcMethod: "formula", perMwAmount: 4000, pctRequired: 10, pctAtRisk: 100, percentageOf: "network_upgrades", cumulativeMonths: 24, atRisk: true },
    { phase: "Phase 3 (M4)", calcMethod: "pct_upgrade", pctRequired: 20, pctAtRisk: 100, percentageOf: "network_upgrades", cumulativeMonths: 34, atRisk: true },
    { phase: "GIA", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 40, atRisk: true },
    { phase: "Construction", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 58, atRisk: true },
    { phase: "COD", calcMethod: "pct_total", pctRequired: 0, pctAtRisk: 0, cumulativeMonths: 58, atRisk: false },
  ],
  PJM: [
    { phase: "Readiness Deposit", calcMethod: "per_mw", perMwAmount: 4000, pctRequired: 0, pctAtRisk: 0, cumulativeMonths: 0, atRisk: false },
    { phase: "Phase 1 - SIS", calcMethod: "formula", perMwAmount: 5000, pctRequired: 10, pctAtRisk: 100, percentageOf: "network_upgrades", cumulativeMonths: 12, atRisk: true },
    { phase: "Phase 2 - Facilities", calcMethod: "pct_upgrade", pctRequired: 20, pctAtRisk: 100, percentageOf: "network_upgrades", cumulativeMonths: 24, atRisk: true },
    { phase: "Phase 3 - Final", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 30, atRisk: true },
    { phase: "ISA Execution", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 36, atRisk: true },
    { phase: "Construction", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 54, atRisk: true },
    { phase: "COD", calcMethod: "pct_total", pctRequired: 0, pctAtRisk: 0, cumulativeMonths: 54, atRisk: false },
  ],
  CAISO: [
    { phase: "Cluster App", calcMethod: "fixed", fixedAmount: 50000, pctRequired: 0, pctAtRisk: 0, cumulativeMonths: 0, atRisk: false },
    { phase: "Phase I", calcMethod: "per_mw", perMwAmount: 10000, pctRequired: 0, pctAtRisk: 100, cumulativeMonths: 12, atRisk: true },
    { phase: "Phase II", calcMethod: "pct_upgrade", pctRequired: 15, pctAtRisk: 100, percentageOf: "network_upgrades", cumulativeMonths: 24, atRisk: true },
    { phase: "GIA Tendering", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 30, atRisk: true },
    { phase: "Construction", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 54, atRisk: true },
    { phase: "COD", calcMethod: "pct_total", pctRequired: 0, pctAtRisk: 0, cumulativeMonths: 54, atRisk: false },
  ],
  SPP: [
    { phase: "DISIS App", calcMethod: "per_mw", perMwAmount: 2000, pctRequired: 0, pctAtRisk: 0, cumulativeMonths: 0, atRisk: false },
    { phase: "DISIS Study", calcMethod: "per_mw", perMwAmount: 4000, pctRequired: 0, pctAtRisk: 100, cumulativeMonths: 15, atRisk: true },
    { phase: "Facilities Study", calcMethod: "pct_upgrade", pctRequired: 20, pctAtRisk: 100, percentageOf: "network_upgrades", cumulativeMonths: 27, atRisk: true },
    { phase: "GIA", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 33, atRisk: true },
    { phase: "Construction", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 51, atRisk: true },
    { phase: "COD", calcMethod: "pct_total", pctRequired: 0, pctAtRisk: 0, cumulativeMonths: 51, atRisk: false },
  ],
  ERCOT: [
    { phase: "Application", calcMethod: "fixed", fixedAmount: 50000, pctRequired: 0, pctAtRisk: 0, cumulativeMonths: 0, atRisk: false },
    { phase: "Screening", calcMethod: "per_mw", perMwAmount: 3000, pctRequired: 0, pctAtRisk: 100, cumulativeMonths: 6, atRisk: true },
    { phase: "Full Study", calcMethod: "pct_upgrade", pctRequired: 10, pctAtRisk: 100, percentageOf: "network_upgrades", cumulativeMonths: 18, atRisk: true },
    { phase: "IA", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 24, atRisk: true },
    { phase: "Construction", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 36, atRisk: true },
    { phase: "COD", calcMethod: "pct_total", pctRequired: 0, pctAtRisk: 0, cumulativeMonths: 36, atRisk: false },
  ],
  "ISO-NE": [
    { phase: "Application", calcMethod: "fixed", fixedAmount: 50000, pctRequired: 0, pctAtRisk: 0, cumulativeMonths: 0, atRisk: false },
    { phase: "Cluster SIS", calcMethod: "per_mw", perMwAmount: 5000, pctRequired: 0, pctAtRisk: 100, cumulativeMonths: 12, atRisk: true },
    { phase: "Facilities", calcMethod: "pct_upgrade", pctRequired: 20, pctAtRisk: 100, percentageOf: "network_upgrades", cumulativeMonths: 24, atRisk: true },
    { phase: "IA", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 30, atRisk: true },
    { phase: "Construction", calcMethod: "pct_total", pctRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", cumulativeMonths: 48, atRisk: true },
    { phase: "COD", calcMethod: "pct_total", pctRequired: 0, pctAtRisk: 0, cumulativeMonths: 48, atRisk: false },
  ],
};

function calcPhase(phase: PhaseRule, sizeMw: number, networkUpgrades: number, totalCosts: number): { required: number; atRisk: number } {
  let required = 0;
  switch (phase.calcMethod) {
    case "fixed": required = phase.fixedAmount || 0; break;
    case "per_mw": required = (phase.perMwAmount || 0) * sizeMw; break;
    case "pct_upgrade": required = (phase.pctRequired / 100) * networkUpgrades; break;
    case "pct_total": required = (phase.pctRequired / 100) * totalCosts; break;
    case "formula": required = Math.max((phase.perMwAmount || 0) * sizeMw, (phase.pctRequired / 100) * networkUpgrades); break;
  }
  return { required, atRisk: required * (phase.pctAtRisk / 100) };
}

// ─── Mock Projects ──────────────────────────────────────────────────────────
interface Project {
  id: number; name: string; iso: string; fuel: string; sizeMw: number;
  networkUpgrades: number; icFacilities: number; affectedSystem: number;
  currentPhase: number; queueEntryDate: string; plannedCod: string; status: string;
}

const PROJECTS: Project[] = [
  { id: 1, name: "Manor Solar v2", iso: "NYISO", fuel: "Solar", sizeMw: 200, networkUpgrades: 3500000, icFacilities: 2000000, affectedSystem: 0, currentPhase: 2, queueEntryDate: "2024-03-01", plannedCod: "2026-11-01", status: "Feasibility Study" },
  { id: 2, name: "Midwest Wind Farm", iso: "MISO", fuel: "Wind", sizeMw: 350, networkUpgrades: 8000000, icFacilities: 4500000, affectedSystem: 500000, currentPhase: 3, queueEntryDate: "2023-09-15", plannedCod: "2027-06-01", status: "System Impact Study" },
  { id: 3, name: "PJM Solar Hub", iso: "PJM", fuel: "Solar + Storage", sizeMw: 200, networkUpgrades: 6000000, icFacilities: 3000000, affectedSystem: 200000, currentPhase: 2, queueEntryDate: "2024-01-10", plannedCod: "2027-03-01", status: "Facilities Study" },
  { id: 4, name: "Desert Sun BESS", iso: "CAISO", fuel: "Battery Storage", sizeMw: 400, networkUpgrades: 12000000, icFacilities: 5000000, affectedSystem: 800000, currentPhase: 2, queueEntryDate: "2023-06-01", plannedCod: "2028-01-01", status: "System Impact Study" },
  { id: 5, name: "Prairie Wind SPP", iso: "SPP", fuel: "Wind", sizeMw: 300, networkUpgrades: 5000000, icFacilities: 2500000, affectedSystem: 300000, currentPhase: 1, queueEntryDate: "2024-06-01", plannedCod: "2028-06-01", status: "Feasibility Study" },
  { id: 6, name: "Texas Solar Ranch", iso: "ERCOT", fuel: "Solar", sizeMw: 500, networkUpgrades: 4000000, icFacilities: 6000000, affectedSystem: 0, currentPhase: 3, queueEntryDate: "2023-01-15", plannedCod: "2026-09-01", status: "IA Negotiation" },
  { id: 7, name: "Appalachian Wind", iso: "PJM", fuel: "Wind", sizeMw: 275, networkUpgrades: 7000000, icFacilities: 3500000, affectedSystem: 0, currentPhase: 1, queueEntryDate: "2024-09-01", plannedCod: "2029-03-01", status: "Feasibility Study" },
  { id: 8, name: "Nevada BESS", iso: "CAISO", fuel: "Battery Storage", sizeMw: 250, networkUpgrades: 8000000, icFacilities: 4000000, affectedSystem: 500000, currentPhase: 3, queueEntryDate: "2023-03-01", plannedCod: "2027-09-01", status: "Facilities Study" },
  { id: 9, name: "Gulf Coast Wind", iso: "MISO", fuel: "Wind", sizeMw: 450, networkUpgrades: 10000000, icFacilities: 6000000, affectedSystem: 1000000, currentPhase: 2, queueEntryDate: "2024-01-01", plannedCod: "2028-09-01", status: "System Impact Study" },
  { id: 10, name: "Carolina Hybrid", iso: "PJM", fuel: "Solar + Storage", sizeMw: 320, networkUpgrades: 9000000, icFacilities: 4500000, affectedSystem: 300000, currentPhase: 2, queueEntryDate: "2023-11-01", plannedCod: "2028-03-01", status: "System Impact Study" },
  { id: 11, name: "Kansas Wind Farm", iso: "SPP", fuel: "Wind", sizeMw: 400, networkUpgrades: 6000000, icFacilities: 4000000, affectedSystem: 500000, currentPhase: 4, queueEntryDate: "2022-06-01", plannedCod: "2026-12-01", status: "IA Executed" },
  { id: 12, name: "New England Solar", iso: "ISO-NE", fuel: "Solar", sizeMw: 120, networkUpgrades: 4000000, icFacilities: 2000000, affectedSystem: 0, currentPhase: 2, queueEntryDate: "2024-02-01", plannedCod: "2027-06-01", status: "Facilities Study" },
];

const ISO_COLORS: Record<string, string> = {
  PJM: "bg-blue-100 text-blue-800",
  MISO: "bg-green-100 text-green-800",
  SPP: "bg-purple-100 text-purple-800",
  CAISO: "bg-orange-100 text-orange-800",
  NYISO: "bg-pink-100 text-pink-800",
  ERCOT: "bg-red-100 text-red-800",
  "ISO-NE": "bg-cyan-100 text-cyan-800",
};

function fmt(val: number) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

function fmtFull(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function SecurityForecastPage() {
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterISO, setFilterISO] = useState("");

  const today = new Date();

  const quickDates = [
    { label: "Today", date: today.toISOString().split("T")[0] },
    { label: "+30 Days", date: addMonths(today, 1).toISOString().split("T")[0] },
    { label: "+90 Days", date: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0] },
    { label: "+6 Months", date: addMonths(today, 6).toISOString().split("T")[0] },
    { label: "+1 Year", date: addMonths(today, 12).toISOString().split("T")[0] },
    { label: "+2 Years", date: addMonths(today, 24).toISOString().split("T")[0] },
  ];

  // Calculate security for each project at various future dates
  const forecastData = useMemo(() => {
    const filtered = filterISO ? PROJECTS.filter((p) => p.iso === filterISO) : PROJECTS;

    return filtered.map((proj) => {
      const phases = ISO_PHASE_RULES[proj.iso] || [];
      const totalCosts = proj.networkUpgrades + proj.icFacilities + proj.affectedSystem;
      const entryDate = new Date(proj.queueEntryDate);

      // Calculate security at target date
      let securityRequired = 0;
      let securityAtRisk = 0;
      let currentPhaseName = phases[0]?.phase || "Unknown";
      let nextMilestone: { phase: string; date: string; amount: number } | null = null;

      for (let i = 0; i < phases.length; i++) {
        const phaseDate = addMonths(entryDate, phases[i].cumulativeMonths);
        const { required, atRisk } = calcPhase(phases[i], proj.sizeMw, proj.networkUpgrades, totalCosts);

        if (phaseDate <= new Date(targetDate)) {
          securityRequired += required;
          if (phases[i].atRisk) securityAtRisk += atRisk;
          currentPhaseName = phases[i].phase;
        } else if (!nextMilestone) {
          nextMilestone = { phase: phases[i].phase, date: phaseDate.toISOString().split("T")[0], amount: required };
        }
      }

      // Calculate security required at +1, +2, +3, +6, +12, +24 months from target
      const futureMonths = [1, 2, 3, 6, 12, 24];
      const futureRequired: Record<number, { required: number; atRisk: number }> = {};

      for (const mo of futureMonths) {
        const futureDate = addMonths(new Date(targetDate), mo);
        let futReq = 0;
        let futRisk = 0;

        for (let i = 0; i < phases.length; i++) {
          const phaseDate = addMonths(entryDate, phases[i].cumulativeMonths);
          const { required, atRisk } = calcPhase(phases[i], proj.sizeMw, proj.networkUpgrades, totalCosts);

          if (phaseDate <= futureDate) {
            futReq += required;
            if (phases[i].atRisk) futRisk += atRisk;
          }
        }

        futureRequired[mo] = { required: futReq, atRisk: futRisk };
      }

      return {
        ...proj,
        securityRequired,
        securityAtRisk,
        currentPhaseName,
        nextMilestone,
        futureRequired,
        totalCosts,
      };
    });
  }, [targetDate, filterISO]);

  // Portfolio totals
  const totals = useMemo(() => {
    const t = {
      required: 0, atRisk: 0,
      future: {} as Record<number, { required: number; atRisk: number }>,
    };
    const futureMonths = [1, 2, 3, 6, 12, 24];
    futureMonths.forEach((mo) => { t.future[mo] = { required: 0, atRisk: 0 }; });

    forecastData.forEach((p) => {
      t.required += p.securityRequired;
      t.atRisk += p.securityAtRisk;
      futureMonths.forEach((mo) => {
        t.future[mo].required += p.futureRequired[mo]?.required || 0;
        t.future[mo].atRisk += p.futureRequired[mo]?.atRisk || 0;
      });
    });
    return t;
  }, [forecastData]);

  const allISOs = [...new Set(PROJECTS.map((p) => p.iso))].sort();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back to Dashboard</Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Security Forecast</h1>
        <p className="mt-1 text-sm text-slate-500">
          Forecast security required &amp; at risk across your portfolio — today and into the future. Based on ISO-specific DPP/study phase rules.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-end gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Forecast Date</label>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick Select</label>
            <div className="flex flex-wrap gap-2">
              {quickDates.map((qd) => (
                <button key={qd.label} onClick={() => setTargetDate(qd.date)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${targetDate === qd.date ? "bg-amber-500 text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {qd.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Filter ISO</label>
            <select value={filterISO} onChange={(e) => setFilterISO(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
              <option value="">All ISOs</option>
              {allISOs.map((iso) => <option key={iso}>{iso}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase">Projects</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{forecastData.length}</p>
          <p className="mt-1 text-xs text-slate-400">As of {new Date(targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-5 shadow-sm border border-emerald-200">
          <p className="text-xs font-medium text-emerald-600 uppercase">Security Required</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{fmt(totals.required)}</p>
          <p className="mt-1 text-xs text-emerald-500">Must be posted by target date</p>
        </div>
        <div className="rounded-xl bg-red-50 p-5 shadow-sm border border-red-200">
          <p className="text-xs font-medium text-red-600 uppercase">Security at Risk</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{fmt(totals.atRisk)}</p>
          <p className="mt-1 text-xs text-red-400">Non-refundable if withdrawn</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-5 shadow-sm border border-amber-200">
          <p className="text-xs font-medium text-amber-600 uppercase">+12 Months Required</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{fmt(totals.future[12]?.required || 0)}</p>
          <p className="mt-1 text-xs text-amber-500">Projected security in 1 year</p>
        </div>
      </div>

      {/* ═══ FUTURE SECURITY TIMELINE ═══ */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Security Required Timeline</h3>
        <p className="text-xs text-slate-400 mb-6">Projected total security required and at risk from the target date forward</p>

        <div className="grid grid-cols-7 gap-3">
          {/* Current */}
          <div className="rounded-lg bg-slate-50 border-2 border-amber-400 p-4 text-center">
            <p className="text-xs font-semibold text-amber-600 mb-1">Current</p>
            <p className="text-lg font-bold text-slate-900">{fmt(totals.required)}</p>
            <p className="text-xs text-red-500 font-medium mt-1">Risk: {fmt(totals.atRisk)}</p>
            <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: `${totals.required > 0 ? (totals.atRisk / totals.required) * 100 : 0}%` }} />
            </div>
          </div>

          {/* Future months */}
          {[1, 2, 3, 6, 12, 24].map((mo) => {
            const data = totals.future[mo];
            const diff = data.required - totals.required;
            return (
              <div key={mo} className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-center">
                <p className="text-xs font-semibold text-slate-500 mb-1">+{mo} {mo === 1 ? "Month" : "Months"}</p>
                <p className="text-lg font-bold text-slate-900">{fmt(data.required)}</p>
                <p className="text-xs text-red-500 font-medium mt-1">Risk: {fmt(data.atRisk)}</p>
                {diff > 0 && (
                  <p className="text-xs text-amber-600 font-medium mt-1">+{fmt(diff)}</p>
                )}
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${data.required > 0 ? (data.atRisk / data.required) * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Bar Chart */}
        <div className="mt-6">
          <div className="flex items-end gap-1 h-32">
            {[{ label: "Now", val: totals.required, risk: totals.atRisk },
              ...([1, 2, 3, 6, 12, 24] as const).map((mo) => ({
                label: `+${mo}mo`,
                val: totals.future[mo]?.required || 0,
                risk: totals.future[mo]?.atRisk || 0,
              }))
            ].map((item, i) => {
              const maxVal = Math.max(totals.future[24]?.required || 1, totals.required, 1);
              const hPct = (item.val / maxVal) * 100;
              const riskPct = item.val > 0 ? (item.risk / item.val) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-slate-600">{fmt(item.val)}</span>
                  <div className="w-full rounded-t overflow-hidden flex flex-col-reverse" style={{ height: `${Math.max(hPct, 5)}%` }}>
                    <div className="w-full bg-red-400" style={{ height: `${riskPct}%` }} />
                    <div className="w-full bg-emerald-400 flex-1" />
                  </div>
                  <span className="text-xs text-slate-500">{item.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 justify-center">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" /><span className="text-xs text-slate-500">Security Required</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400" /><span className="text-xs text-slate-500">At Risk Portion</span></div>
          </div>
        </div>
      </div>

      {/* ═══ ISO BREAKDOWN ═══ */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Security by ISO Region</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(
            forecastData.reduce<Record<string, { count: number; required: number; atRisk: number; future12: number }>>((acc, p) => {
              if (!acc[p.iso]) acc[p.iso] = { count: 0, required: 0, atRisk: 0, future12: 0 };
              acc[p.iso].count++;
              acc[p.iso].required += p.securityRequired;
              acc[p.iso].atRisk += p.securityAtRisk;
              acc[p.iso].future12 += p.futureRequired[12]?.required || 0;
              return acc;
            }, {})
          ).sort((a, b) => b[1].required - a[1].required).map(([iso, data]) => (
            <div key={iso} className={`rounded-xl p-5 border ${ISO_COLORS[iso] || "bg-gray-50"}`}>
              <p className="text-sm font-bold">{iso}</p>
              <p className="text-xs mt-0.5">{data.count} project(s)</p>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs"><span>Required:</span><span className="font-bold text-emerald-700">{fmt(data.required)}</span></div>
                <div className="flex justify-between text-xs"><span>At Risk:</span><span className="font-bold text-red-600">{fmt(data.atRisk)}</span></div>
                <div className="flex justify-between text-xs"><span>+12mo:</span><span className="font-bold text-amber-600">{fmt(data.future12)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ DETAILED PROJECT TABLE ═══ */}
      <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Project-Level Security Forecast</h2>
          <p className="text-xs text-slate-400 mt-0.5">Security required, at risk, and future projections per project</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Project</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">ISO</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-600">MW</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Phase</th>
                <th className="px-3 py-2.5 text-right font-semibold text-emerald-600">Required Now</th>
                <th className="px-3 py-2.5 text-right font-semibold text-red-600">At Risk</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500">+1 Mo</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500">+3 Mo</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500">+6 Mo</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500">+12 Mo</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500">+24 Mo</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Next Milestone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forecastData.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.fuel}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ISO_COLORS[p.iso]}`}>{p.iso}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold">{p.sizeMw}</td>
                  <td className="px-3 py-2.5 text-xs font-medium text-slate-600">{p.currentPhaseName}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-emerald-600">{fmt(p.securityRequired)}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-red-600">{fmt(p.securityAtRisk)}</td>
                  {[1, 3, 6, 12, 24].map((mo) => {
                    const val = p.futureRequired[mo]?.required || 0;
                    const diff = val - p.securityRequired;
                    return (
                      <td key={mo} className="px-3 py-2.5 text-right">
                        <p className="font-medium text-slate-700">{fmt(val)}</p>
                        {diff > 0 && <p className="text-xs text-amber-600">+{fmt(diff)}</p>}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5">
                    {p.nextMilestone ? (
                      <div>
                        <p className="text-xs font-medium text-slate-700">{p.nextMilestone.phase}</p>
                        <p className="text-xs text-slate-400">{new Date(p.nextMilestone.date).toLocaleDateString()} — {fmt(p.nextMilestone.amount)}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">All passed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                <td className="px-3 py-2.5 text-slate-700">Portfolio Total</td>
                <td className="px-3 py-2.5 text-slate-500">{forecastData.length} projects</td>
                <td className="px-3 py-2.5 text-right">{forecastData.reduce((s, p) => s + p.sizeMw, 0).toLocaleString()}</td>
                <td />
                <td className="px-3 py-2.5 text-right text-emerald-700">{fmt(totals.required)}</td>
                <td className="px-3 py-2.5 text-right text-red-700">{fmt(totals.atRisk)}</td>
                {[1, 3, 6, 12, 24].map((mo) => (
                  <td key={mo} className="px-3 py-2.5 text-right text-slate-700">{fmt(totals.future[mo]?.required || 0)}</td>
                ))}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
