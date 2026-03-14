"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// ─── ISO Security Rule Definitions ──────────────────────────────────────────
// Based on actual ISO interconnection manuals: PJM BPM-15, MISO DPP, SPP DISIS, CAISO GIP, NYISO OATT, ISO-NE SIS, ERCOT GIPP

interface PhaseRule {
  phase: string;
  description: string;
  securityType: "deposit" | "security" | "milestone";
  calcMethod: "fixed" | "per_mw" | "pct_upgrade" | "pct_total" | "formula";
  fixedAmount?: number;
  perMwAmount?: number;
  percentage?: number;
  percentageOf?: string;
  atRisk: boolean;
  refundable: boolean;
  typicalDurationMonths: number;
  cumulativeMonths: number;
}

interface ISORule {
  iso: string;
  fullName: string;
  processName: string;
  description: string;
  phases: PhaseRule[];
  notes: string[];
}

const ISO_RULES: ISORule[] = [
  {
    iso: "PJM",
    fullName: "PJM Interconnection",
    processName: "BPM-15 New Services Queue",
    description: "PJM's transition to a first-ready, first-served cluster study process with escalating financial commitments at each phase.",
    phases: [
      { phase: "Readiness Deposit", description: "Application fee + readiness deposit to enter queue", securityType: "deposit", calcMethod: "per_mw", perMwAmount: 4000, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 0 },
      { phase: "Phase 1 - System Impact Study", description: "Initial system impact analysis; security = $5,000/MW or 10% of network upgrade costs (whichever is greater)", securityType: "security", calcMethod: "formula", perMwAmount: 5000, percentage: 10, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 12 },
      { phase: "Phase 2 - Facilities Study", description: "Detailed facilities study; additional security = 20% of assigned upgrade costs", securityType: "security", calcMethod: "pct_upgrade", percentage: 20, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 24 },
      { phase: "Phase 3 - Final Allocation", description: "Final cost allocation; cumulative security = 100% of assigned upgrade costs", securityType: "security", calcMethod: "pct_upgrade", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 30 },
      { phase: "ISA Execution", description: "Interconnection Service Agreement execution; security = total cost estimate", securityType: "milestone", calcMethod: "pct_total", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 36 },
      { phase: "Construction", description: "Begin construction; security held until commercial operation", securityType: "milestone", calcMethod: "pct_total", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 18, cumulativeMonths: 54 },
      { phase: "Commercial Operation", description: "COD achieved; security returned minus actual costs", securityType: "milestone", calcMethod: "pct_total", percentage: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 54 },
    ],
    notes: [
      "Readiness Deposit: $4,000/MW (min $200,000)",
      "Phase 1 security: Greater of $5,000/MW or 10% of allocated network upgrades",
      "Phase 2 incremental: 20% of updated upgrade cost allocation",
      "Phase 3: 100% of final allocated costs (includes interconnection facilities + network upgrades)",
      "At-risk amounts are forfeited if project withdraws after entering the phase",
      "Study deposits are credited against security requirements",
    ],
  },
  {
    iso: "MISO",
    fullName: "Midcontinent ISO",
    processName: "Definitive Planning Phase (DPP)",
    description: "MISO's three-phase DPP process with milestone-based security requirements tied to network upgrade cost allocation.",
    phases: [
      { phase: "DPP Entry (M1)", description: "Site control demonstration + initial study deposit", securityType: "deposit", calcMethod: "per_mw", perMwAmount: 4000, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 0 },
      { phase: "Phase 1 - Preliminary", description: "Preliminary system impact; M2 milestone security = $4,000/MW", securityType: "security", calcMethod: "per_mw", perMwAmount: 4000, atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 12 },
      { phase: "Phase 2 - SIS (M3)", description: "Full system impact study; M3 security = 10% of network upgrades or $4,000/MW (whichever greater)", securityType: "security", calcMethod: "formula", perMwAmount: 4000, percentage: 10, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 24 },
      { phase: "Phase 3 - Facilities (M4)", description: "Facilities study; M4 security = 20% of network upgrades", securityType: "security", calcMethod: "pct_upgrade", percentage: 20, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 10, cumulativeMonths: 34 },
      { phase: "GIA Execution", description: "Generator Interconnection Agreement; security = 100% of assigned costs", securityType: "milestone", calcMethod: "pct_total", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 40 },
      { phase: "Construction", description: "Construction period; security maintained", securityType: "milestone", calcMethod: "pct_total", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 18, cumulativeMonths: 58 },
      { phase: "Commercial Operation", description: "COD; security reconciled and excess returned", securityType: "milestone", calcMethod: "pct_total", percentage: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 58 },
    ],
    notes: [
      "M1 (DPP Entry): Site control + $4,000/MW deposit",
      "M2 (Phase 1 completion): $4,000/MW security posting",
      "M3 (Phase 2 completion): Greater of $4,000/MW or 10% of network upgrades",
      "M4 (Phase 3 completion): 20% of network upgrade costs",
      "Withdrawal at any milestone after M2 results in forfeiture of at-risk amounts",
      "DPP typically takes 40+ months through GIA execution",
    ],
  },
  {
    iso: "SPP",
    fullName: "Southwest Power Pool",
    processName: "DISIS Cluster Study",
    description: "SPP's Definitive Interconnection System Impact Study (DISIS) cluster process with staged security requirements.",
    phases: [
      { phase: "DISIS Application", description: "Application fee + study deposit", securityType: "deposit", calcMethod: "per_mw", perMwAmount: 2000, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 0 },
      { phase: "DISIS Study", description: "Cluster system impact study; security = $4,000/MW", securityType: "security", calcMethod: "per_mw", perMwAmount: 4000, atRisk: true, refundable: false, typicalDurationMonths: 15, cumulativeMonths: 15 },
      { phase: "Facilities Study", description: "Individual facilities study; security = 20% of network upgrade costs", securityType: "security", calcMethod: "pct_upgrade", percentage: 20, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 27 },
      { phase: "GIA Execution", description: "Interconnection agreement; security = 100% of assigned costs", securityType: "milestone", calcMethod: "pct_total", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 33 },
      { phase: "Construction", description: "Construction period", securityType: "milestone", calcMethod: "pct_total", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 18, cumulativeMonths: 51 },
      { phase: "Commercial Operation", description: "COD achieved", securityType: "milestone", calcMethod: "pct_total", percentage: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 51 },
    ],
    notes: [
      "Application: $2,000/MW study deposit",
      "DISIS completion: $4,000/MW financial security",
      "Facilities Study: 20% of assigned network upgrades",
      "GIA: 100% of total assigned costs (IC facilities + network upgrades)",
      "Cluster study groups projects by electrical proximity",
    ],
  },
  {
    iso: "CAISO",
    fullName: "California ISO",
    processName: "Generator Interconnection Procedures (GIP) Cluster",
    description: "CAISO cluster study process with Phase I/II studies and interconnection financial security postings.",
    phases: [
      { phase: "Cluster Application", description: "Application fee + study deposit ($50,000 base)", securityType: "deposit", calcMethod: "fixed", fixedAmount: 50000, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 0 },
      { phase: "Phase I Study", description: "Cluster Phase I study; IFS Posting #1 = $10,000/MW (min $500,000)", securityType: "security", calcMethod: "per_mw", perMwAmount: 10000, atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 12 },
      { phase: "Phase II Study", description: "Phase II detailed study; IFS Posting #2 = 15% of assigned upgrade costs", securityType: "security", calcMethod: "pct_upgrade", percentage: 15, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 24 },
      { phase: "GIA Tendering", description: "GIA offered; IFS Posting #3 = cumulative to 100% of assigned costs", securityType: "milestone", calcMethod: "pct_total", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 30 },
      { phase: "Construction", description: "Construction with security held", securityType: "milestone", calcMethod: "pct_total", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 24, cumulativeMonths: 54 },
      { phase: "Commercial Operation", description: "COD; security reconciled", securityType: "milestone", calcMethod: "pct_total", percentage: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 54 },
    ],
    notes: [
      "Application: $50,000 study deposit + $2,000/MW (for restudies)",
      "IFS Posting #1 (Phase I): $10,000/MW (minimum $500,000)",
      "IFS Posting #2 (Phase II): 15% of Phase II assigned costs",
      "IFS Posting #3 (GIA): Bring total to 100% of assigned costs",
      "CAISO uses cluster windows (annual/semi-annual application periods)",
      "At-risk forfeiture applies to all IFS postings",
    ],
  },
  {
    iso: "NYISO",
    fullName: "New York ISO",
    processName: "Class Year Study",
    description: "NYISO groups projects into Class Years for interconnection studies with deposit-based progression.",
    phases: [
      { phase: "Application", description: "Queue application + $10,000 fee + study deposit", securityType: "deposit", calcMethod: "per_mw", perMwAmount: 1000, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 0 },
      { phase: "SRIS / SIS", description: "System Reliability Impact Study; additional security = $5,000/MW", securityType: "security", calcMethod: "per_mw", perMwAmount: 5000, atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 12 },
      { phase: "Class Year Study", description: "Full class year study; security = 25% of allocated upgrade costs", securityType: "security", calcMethod: "pct_upgrade", percentage: 25, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 18, cumulativeMonths: 30 },
      { phase: "IA Execution", description: "Interconnection agreement; security = 100% of assigned costs", securityType: "milestone", calcMethod: "pct_total", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 36 },
      { phase: "Construction", description: "Construction period", securityType: "milestone", calcMethod: "pct_total", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 24, cumulativeMonths: 60 },
      { phase: "Commercial Operation", description: "COD achieved", securityType: "milestone", calcMethod: "pct_total", percentage: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 60 },
    ],
    notes: [
      "Application: $10,000 fee + $1,000/MW study deposit",
      "SRIS: $5,000/MW security posting",
      "Class Year: 25% of allocated SRIS upgrades",
      "IA: 100% of final assigned costs",
      "Class Year process can take 2-5 years due to restudy cycles",
    ],
  },
  {
    iso: "ISO-NE",
    fullName: "ISO New England",
    processName: "Cluster Study Process",
    description: "ISO-NE cluster interconnection study with overlapping impact analyses and progressive security requirements.",
    phases: [
      { phase: "Application", description: "Queue application + study deposit ($50,000 base)", securityType: "deposit", calcMethod: "fixed", fixedAmount: 50000, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 0 },
      { phase: "Cluster SIS", description: "System impact study; security = $5,000/MW", securityType: "security", calcMethod: "per_mw", perMwAmount: 5000, atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 12 },
      { phase: "Facilities Study", description: "Facilities study; security = 20% of network upgrade costs", securityType: "security", calcMethod: "pct_upgrade", percentage: 20, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 24 },
      { phase: "IA Execution", description: "Interconnection agreement; security = 100% assigned costs", securityType: "milestone", calcMethod: "pct_total", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 30 },
      { phase: "Construction", description: "Construction period", securityType: "milestone", calcMethod: "pct_total", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 18, cumulativeMonths: 48 },
      { phase: "Commercial Operation", description: "COD achieved", securityType: "milestone", calcMethod: "pct_total", percentage: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 48 },
    ],
    notes: [
      "Application: $50,000 base study deposit",
      "Cluster SIS: $5,000/MW financial assurance",
      "Facilities: 20% of allocated network upgrades",
      "Cluster process groups projects geographically and electrically",
    ],
  },
  {
    iso: "ERCOT",
    fullName: "Electric Reliability Council of Texas",
    processName: "Generator Interconnection Process (GIP)",
    description: "ERCOT's process is faster than other ISOs with lower initial security but significant construction-phase requirements.",
    phases: [
      { phase: "Application", description: "Application fee + screening study deposit", securityType: "deposit", calcMethod: "fixed", fixedAmount: 50000, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 0 },
      { phase: "Screening Study", description: "Initial screening; security = $3,000/MW", securityType: "security", calcMethod: "per_mw", perMwAmount: 3000, atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 6 },
      { phase: "Full Study", description: "Full interconnection study; security = 10% of network upgrades", securityType: "security", calcMethod: "pct_upgrade", percentage: 10, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 18 },
      { phase: "IA Execution", description: "Interconnection agreement; security = 100% of assigned costs", securityType: "milestone", calcMethod: "pct_total", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 24 },
      { phase: "Construction", description: "Construction period", securityType: "milestone", calcMethod: "pct_total", percentage: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 36 },
      { phase: "Commercial Operation", description: "COD achieved", securityType: "milestone", calcMethod: "pct_total", percentage: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 36 },
    ],
    notes: [
      "Application: $50,000 screening deposit",
      "Screening: $3,000/MW (lower than most ISOs)",
      "Full Study: 10% of assigned network upgrade costs",
      "IA: 100% of total assigned costs",
      "ERCOT process is typically faster (24-36 months total)",
      "No capacity market — energy-only market",
    ],
  },
];

const ISO_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  PJM: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", accent: "bg-blue-500" },
  MISO: { bg: "bg-green-50", text: "text-green-800", border: "border-green-200", accent: "bg-green-500" },
  SPP: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", accent: "bg-purple-500" },
  CAISO: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200", accent: "bg-orange-500" },
  NYISO: { bg: "bg-pink-50", text: "text-pink-800", border: "border-pink-200", accent: "bg-pink-500" },
  "ISO-NE": { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200", accent: "bg-cyan-500" },
  ERCOT: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", accent: "bg-red-500" },
};

function fmt(val: number) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

function fmtFull(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

// ─── Security Calculation Engine ────────────────────────────────────────────
function calculatePhaseSecurity(
  phase: PhaseRule,
  sizeMw: number,
  networkUpgrades: number,
  icFacilitiesCost: number,
  affectedSystemCosts: number
): number {
  const totalCosts = networkUpgrades + icFacilitiesCost + affectedSystemCosts;

  switch (phase.calcMethod) {
    case "fixed":
      return phase.fixedAmount || 0;
    case "per_mw":
      return (phase.perMwAmount || 0) * sizeMw;
    case "pct_upgrade":
      return ((phase.percentage || 0) / 100) * networkUpgrades;
    case "pct_total":
      return ((phase.percentage || 0) / 100) * totalCosts;
    case "formula": {
      const perMw = (phase.perMwAmount || 0) * sizeMw;
      const pctUpgrade = ((phase.percentage || 0) / 100) * networkUpgrades;
      return Math.max(perMw, pctUpgrade);
    }
    default:
      return 0;
  }
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function SecurityCalcPage() {
  const [selectedISO, setSelectedISO] = useState("PJM");
  const [sizeMw, setSizeMw] = useState(200);
  const [networkUpgrades, setNetworkUpgrades] = useState(5000000);
  const [icFacilities, setIcFacilities] = useState(3000000);
  const [affectedSystem, setAffectedSystem] = useState(0);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [queueEntryDate, setQueueEntryDate] = useState("2025-01-01");

  const rule = ISO_RULES.find((r) => r.iso === selectedISO)!;
  const colors = ISO_COLORS[selectedISO] || ISO_COLORS.PJM;

  // Calculate security for each phase
  const phaseCalcs = useMemo(() => {
    let cumulative = 0;
    return rule.phases.map((phase, idx) => {
      const amount = calculatePhaseSecurity(phase, sizeMw, networkUpgrades, icFacilities, affectedSystem);
      cumulative += amount;
      const entryDate = new Date(queueEntryDate);
      entryDate.setMonth(entryDate.getMonth() + phase.cumulativeMonths);
      return {
        ...phase,
        calculatedAmount: amount,
        cumulativeAmount: cumulative,
        estimatedDate: entryDate.toISOString().split("T")[0],
        isPast: idx < currentPhaseIdx,
        isCurrent: idx === currentPhaseIdx,
        isFuture: idx > currentPhaseIdx,
      };
    });
  }, [rule, sizeMw, networkUpgrades, icFacilities, affectedSystem, currentPhaseIdx, queueEntryDate]);

  const totalAtRisk = phaseCalcs
    .filter((p) => p.isPast || p.isCurrent)
    .filter((p) => p.atRisk)
    .reduce((s, p) => s + p.calculatedAmount, 0);

  const totalPosted = phaseCalcs
    .filter((p) => p.isPast || p.isCurrent)
    .reduce((s, p) => s + p.calculatedAmount, 0);

  const futureRequired = phaseCalcs
    .filter((p) => p.isFuture)
    .reduce((s, p) => s + p.calculatedAmount, 0);

  const maxCumulative = phaseCalcs[phaseCalcs.length - 1]?.cumulativeAmount || 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          ISO Security Calculator
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Calculate interconnection security requirements based on ISO-specific rules, DPP schedules, and project parameters
        </p>
      </div>

      {/* ISO Selection */}
      <div className="mb-6 flex flex-wrap gap-2">
        {ISO_RULES.map((r) => {
          const c = ISO_COLORS[r.iso];
          return (
            <button
              key={r.iso}
              onClick={() => { setSelectedISO(r.iso); setCurrentPhaseIdx(0); }}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                selectedISO === r.iso
                  ? `${c.accent} text-white shadow-md`
                  : `${c.bg} ${c.text} ${c.border} border hover:shadow-sm`
              }`}
            >
              {r.iso}
            </button>
          );
        })}
      </div>

      {/* ISO Info Banner */}
      <div className={`mb-6 rounded-xl ${colors.bg} ${colors.border} border p-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className={`text-lg font-bold ${colors.text}`}>{rule.fullName}</h2>
            <p className="text-sm text-slate-600 mt-0.5">{rule.processName}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colors.accent} text-white`}>
            {rule.phases.length} Phases
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">{rule.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Input Panel */}
        <div className="space-y-6">
          {/* Project Parameters */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Project Parameters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Project Size (MW)</label>
                <input type="number" value={sizeMw} onChange={(e) => setSizeMw(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Network Upgrade Costs ($)</label>
                <input type="number" value={networkUpgrades} onChange={(e) => setNetworkUpgrades(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none" />
                <p className="text-xs text-slate-400 mt-1">{fmt(networkUpgrades)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">IC Facilities Cost ($)</label>
                <input type="number" value={icFacilities} onChange={(e) => setIcFacilities(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none" />
                <p className="text-xs text-slate-400 mt-1">{fmt(icFacilities)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Affected System Costs ($)</label>
                <input type="number" value={affectedSystem} onChange={(e) => setAffectedSystem(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Queue Entry Date</label>
                <input type="date" value={queueEntryDate} onChange={(e) => setQueueEntryDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Current Phase</label>
                <select value={currentPhaseIdx} onChange={(e) => setCurrentPhaseIdx(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none">
                  {rule.phases.map((p, i) => (
                    <option key={i} value={i}>{p.phase}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="space-y-3">
            <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase">Total Posted to Date</p>
              <p className="text-2xl font-bold text-emerald-600">{fmt(totalPosted)}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4 shadow-sm border border-red-200">
              <p className="text-xs font-medium text-red-600 uppercase">Current At-Risk</p>
              <p className="text-2xl font-bold text-red-700">{fmt(totalAtRisk)}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 shadow-sm border border-amber-200">
              <p className="text-xs font-medium text-amber-600 uppercase">Future Required</p>
              <p className="text-2xl font-bold text-amber-700">{fmt(futureRequired)}</p>
            </div>
          </div>
        </div>

        {/* RIGHT: Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Phase Timeline */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
              {rule.processName} — Phase Timeline
            </h3>
            <p className="text-xs text-slate-400 mb-6">Security requirements and estimated dates based on queue entry</p>

            {/* Visual Timeline */}
            <div className="relative mb-8">
              <div className="absolute top-4 left-4 right-4 h-1 bg-slate-200 rounded-full" />
              <div className="absolute top-4 left-4 h-1 rounded-full transition-all duration-500"
                style={{
                  width: `${((currentPhaseIdx + 1) / rule.phases.length) * 100}%`,
                  maxWidth: "calc(100% - 32px)",
                }}
                className={colors.accent}
              />
              <div className="flex justify-between relative">
                {phaseCalcs.map((p, i) => (
                  <div key={i} className="flex flex-col items-center" style={{ width: `${100 / rule.phases.length}%` }}>
                    <button
                      onClick={() => setCurrentPhaseIdx(i)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all z-10 ${
                        p.isPast ? `${colors.accent} text-white border-transparent` :
                        p.isCurrent ? `${colors.accent} text-white border-transparent ring-4 ring-opacity-30 ${colors.border}` :
                        "bg-white border-slate-300 text-slate-400"
                      }`}
                    >
                      {p.isPast ? "✓" : i + 1}
                    </button>
                    <p className={`mt-2 text-xs text-center font-medium leading-tight max-w-[80px] ${p.isCurrent ? colors.text : "text-slate-500"}`}>
                      {p.phase.length > 20 ? p.phase.substring(0, 18) + "…" : p.phase}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase Detail Cards */}
            <div className="space-y-3">
              {phaseCalcs.map((p, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-4 transition-all ${
                    p.isCurrent
                      ? `${colors.bg} ${colors.border} border-2 shadow-sm`
                      : p.isPast
                      ? "bg-slate-50 border-slate-200 opacity-75"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        p.isPast ? `${colors.accent} text-white` :
                        p.isCurrent ? `${colors.accent} text-white` :
                        "bg-slate-200 text-slate-500"
                      }`}>
                        {p.isPast ? "✓" : i + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{p.phase}</h4>
                        <p className="text-xs text-slate-500">{p.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${p.atRisk ? "text-red-600" : "text-emerald-600"}`}>
                        {fmt(p.calculatedAmount)}
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        {p.atRisk && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">At Risk</span>}
                        {p.refundable && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Refundable</span>}
                        <span className="text-xs text-slate-400">{p.securityType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Calc Method explanation */}
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-1 rounded font-mono">
                      {p.calcMethod === "fixed" && `Fixed: ${fmtFull(p.fixedAmount || 0)}`}
                      {p.calcMethod === "per_mw" && `${fmtFull(p.perMwAmount || 0)}/MW × ${sizeMw} MW`}
                      {p.calcMethod === "pct_upgrade" && `${p.percentage}% × Network Upgrades (${fmt(networkUpgrades)})`}
                      {p.calcMethod === "pct_total" && `${p.percentage}% × Total Costs (${fmt(networkUpgrades + icFacilities + affectedSystem)})`}
                      {p.calcMethod === "formula" && `MAX($${(p.perMwAmount||0).toLocaleString()}/MW, ${p.percentage}% upgrades)`}
                    </span>
                    <span>Est. Date: {new Date(p.estimatedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                    <span>Cumulative: {fmt(p.cumulativeAmount)}</span>
                  </div>

                  {/* Cumulative bar */}
                  <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${p.isPast || p.isCurrent ? colors.accent : "bg-slate-300"}`}
                      style={{ width: `${(p.cumulativeAmount / maxCumulative) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ISO-Specific Rules Reference */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              {rule.iso} Rule Reference
            </h3>
            <ul className="space-y-2">
              {rule.notes.map((note, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${colors.accent}`} />
                  {note}
                </li>
              ))}
            </ul>
          </div>

          {/* Portfolio Comparison */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Cross-ISO Comparison — {sizeMw} MW Project
            </h3>
            <p className="text-xs text-slate-400 mb-4">Estimated security at each major stage using current project parameters</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">ISO</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">Entry Deposit</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">After Study</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">At IA</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">Total Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ISO_RULES.map((r) => {
                    const calcs = r.phases.map((phase) =>
                      calculatePhaseSecurity(phase, sizeMw, networkUpgrades, icFacilities, affectedSystem)
                    );
                    const entryDeposit = calcs[0] || 0;
                    const afterStudy = calcs.slice(0, 3).reduce((s, v) => s + v, 0);
                    const atIA = calcs.reduce((s, v) => s + v, 0);
                    const lastPhase = r.phases[r.phases.length - 1];
                    const c = ISO_COLORS[r.iso];
                    return (
                      <tr key={r.iso} className={selectedISO === r.iso ? `${c.bg}` : "hover:bg-slate-50"}>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
                            {r.iso}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-700">{fmt(entryDeposit)}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-amber-600">{fmt(afterStudy)}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-red-600">{fmt(atIA)}</td>
                        <td className="px-3 py-2.5 text-right text-slate-500">{lastPhase.cumulativeMonths} months</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
