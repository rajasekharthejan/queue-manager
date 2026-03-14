"use client";

import { useState, useMemo } from "react";

// ─── ISO Security Rule Definitions ──────────────────────────────────────────
// Based on real ISO interconnection manuals: PJM BPM-15, MISO DPP, SPP DISIS,
// CAISO Cluster, NYISO CSPP, ISO-NE Cluster, ERCOT Planning Guide

interface PhaseDefinition {
  name: string;
  shortName: string;
  durationMonths: number;
  securityType: "deposit" | "milestone" | "escalating";
  /** basisPoints on network upgrade cost, or flat $/MW */
  calcMethod: "pct_of_upgrades" | "dollar_per_mw" | "flat" | "pct_of_cost";
  rate: number; // percentage (0-100) or $/MW or flat $
  refundable: boolean;
  atRiskPct: number; // what % becomes at-risk if withdrawn at this phase
  description: string;
}

interface ISORuleSet {
  iso: string;
  fullName: string;
  processName: string;
  totalDurationMonths: number;
  phases: PhaseDefinition[];
  notes: string[];
}

const ISO_RULES: ISORuleSet[] = [
  {
    iso: "MISO",
    fullName: "Midcontinent Independent System Operator",
    processName: "Definitive Planning Process (DPP)",
    totalDurationMonths: 42,
    phases: [
      { name: "DPP Phase 1 — System Impact Study", shortName: "DPP-1", durationMonths: 12, securityType: "deposit", calcMethod: "dollar_per_mw", rate: 4000, refundable: true, atRiskPct: 0, description: "Initial study deposit of $4,000/MW. Fully refundable if project withdraws before Phase 2." },
      { name: "DPP Phase 2 — Facilities Study", shortName: "DPP-2", durationMonths: 12, securityType: "milestone", calcMethod: "pct_of_upgrades", rate: 10, refundable: true, atRiskPct: 50, description: "10% of assigned network upgrade costs. 50% at risk upon Phase 2 entry." },
      { name: "DPP Phase 3 — Final Agreement", shortName: "DPP-3", durationMonths: 12, securityType: "escalating", calcMethod: "pct_of_upgrades", rate: 20, refundable: false, atRiskPct: 100, description: "20% of assigned network upgrade costs. 100% at risk — non-refundable upon GIA execution." },
      { name: "Post-GIA Construction Security", shortName: "Post-GIA", durationMonths: 6, securityType: "escalating", calcMethod: "pct_of_upgrades", rate: 100, refundable: false, atRiskPct: 100, description: "Full network upgrade cost posted as construction security. Non-refundable, applied to construction." },
    ],
    notes: [
      "M2 milestone: $4,000/MW readiness deposit at DPP entry",
      "M3 milestone: 10% of network upgrades at Phase 2 entry",
      "M4 milestone: Additional 10% (total 20%) at Phase 3",
      "Network upgrades assigned pro-rata based on MW contribution to constraint",
      "Affected System costs may be assigned separately",
    ],
  },
  {
    iso: "PJM",
    fullName: "PJM Interconnection LLC",
    processName: "BPM-15 Interconnection Process",
    totalDurationMonths: 48,
    phases: [
      { name: "Feasibility Study", shortName: "FS", durationMonths: 6, securityType: "deposit", calcMethod: "flat", rate: 10000, refundable: true, atRiskPct: 0, description: "Flat $10,000 study deposit. Refundable upon completion." },
      { name: "System Impact Study", shortName: "SIS", durationMonths: 12, securityType: "deposit", calcMethod: "dollar_per_mw", rate: 5000, refundable: true, atRiskPct: 0, description: "$5,000/MW study deposit. Applied toward future security requirements." },
      { name: "Facilities Study", shortName: "FCS", durationMonths: 12, securityType: "milestone", calcMethod: "pct_of_upgrades", rate: 20, refundable: true, atRiskPct: 50, description: "20% of assigned network upgrade costs. 50% at risk if project withdraws during study." },
      { name: "IA Execution / Construction", shortName: "IA/CON", durationMonths: 18, securityType: "escalating", calcMethod: "pct_of_upgrades", rate: 100, refundable: false, atRiskPct: 100, description: "Full construction security = 100% of network upgrade cost allocation. Non-refundable, applied to construction." },
    ],
    notes: [
      "Transition rules apply for projects in AE1/AE2 transitional clusters",
      "BPM-15 requires readiness deposits for new queue positions",
      "Security escalates through study phases based on assigned upgrade costs",
      "Capacity Interconnection Rights (CIRs) locked at IA execution",
      "Projects can request suspension with security hold for up to 3 years",
    ],
  },
  {
    iso: "SPP",
    fullName: "Southwest Power Pool",
    processName: "DISIS Cluster Study",
    totalDurationMonths: 36,
    phases: [
      { name: "DISIS Phase — Cluster Impact Study", shortName: "DISIS", durationMonths: 12, securityType: "deposit", calcMethod: "dollar_per_mw", rate: 4000, refundable: true, atRiskPct: 0, description: "Initial $4,000/MW cluster study deposit. Refundable upon study completion." },
      { name: "Facilities Study", shortName: "FS", durationMonths: 10, securityType: "milestone", calcMethod: "pct_of_upgrades", rate: 15, refundable: true, atRiskPct: 50, description: "15% of assigned network upgrade costs. 50% at risk upon entry." },
      { name: "IA Negotiation & Execution", shortName: "IA", durationMonths: 8, securityType: "escalating", calcMethod: "pct_of_upgrades", rate: 25, refundable: false, atRiskPct: 100, description: "25% of total upgrade costs posted as GIA security." },
      { name: "Construction Security", shortName: "CON", durationMonths: 6, securityType: "escalating", calcMethod: "pct_of_upgrades", rate: 100, refundable: false, atRiskPct: 100, description: "Full network upgrade cost as construction security." },
    ],
    notes: [
      "DISIS clusters are formed based on electrical proximity",
      "Affected System studies may extend timelines by 6+ months",
      "Withdrawal penalties escalate significantly after Facilities Study",
      "SPP uses pro-rata MW allocation for shared upgrades",
    ],
  },
  {
    iso: "CAISO",
    fullName: "California Independent System Operator",
    processName: "Cluster Study Process",
    totalDurationMonths: 42,
    phases: [
      { name: "Cluster Phase 1 — Impact Study", shortName: "CL-1", durationMonths: 12, securityType: "deposit", calcMethod: "dollar_per_mw", rate: 5000, refundable: true, atRiskPct: 0, description: "$5,000/MW study deposit for Phase 1 entry. Refundable if project exits before Phase 2." },
      { name: "Cluster Phase 2 — Reassessment", shortName: "CL-2", durationMonths: 12, securityType: "milestone", calcMethod: "pct_of_upgrades", rate: 15, refundable: true, atRiskPct: 50, description: "15% of allocated network upgrade costs. 50% at risk upon Phase 2 entry." },
      { name: "GIA Tendering & Execution", shortName: "GIA", durationMonths: 12, securityType: "escalating", calcMethod: "pct_of_upgrades", rate: 30, refundable: false, atRiskPct: 100, description: "30% of total upgrades as GIA security. Non-refundable." },
      { name: "Construction Security Posting", shortName: "CON", durationMonths: 6, securityType: "escalating", calcMethod: "pct_of_upgrades", rate: 100, refundable: false, atRiskPct: 100, description: "Full construction security = 100% of allocated costs." },
    ],
    notes: [
      "CAISO uses Cluster windows — projects grouped by application date",
      "Deliverability Assessment impacts capacity value",
      "Affected Systems may include neighboring BAAs (NVE, LADWP, etc.)",
      "GIP reforms in 2023 introduced tighter withdrawal penalties",
      "Storage projects may receive reduced network upgrade allocation",
    ],
  },
  {
    iso: "NYISO",
    fullName: "New York Independent System Operator",
    processName: "Class Year Study Process",
    totalDurationMonths: 36,
    phases: [
      { name: "SRIS — System Reliability Impact Study", shortName: "SRIS", durationMonths: 10, securityType: "deposit", calcMethod: "dollar_per_mw", rate: 3000, refundable: true, atRiskPct: 0, description: "$3,000/MW study deposit. Refundable upon study completion." },
      { name: "Class Year Facilities Study", shortName: "CYFS", durationMonths: 12, securityType: "milestone", calcMethod: "pct_of_upgrades", rate: 20, refundable: true, atRiskPct: 50, description: "20% of assigned SUF (System Upgrade Facilities) costs. 50% at risk." },
      { name: "IA Execution", shortName: "IA", durationMonths: 8, securityType: "escalating", calcMethod: "pct_of_upgrades", rate: 25, refundable: false, atRiskPct: 100, description: "25% of total upgrade costs as execution security." },
      { name: "Construction Period", shortName: "CON", durationMonths: 6, securityType: "escalating", calcMethod: "pct_of_upgrades", rate: 100, refundable: false, atRiskPct: 100, description: "Full construction security posting." },
    ],
    notes: [
      "Class Years are formed annually — projects grouped by study cycle",
      "CRIS (Capacity Resource Interconnection Service) requires deliverability",
      "SUF costs assigned based on system impact contribution",
      "Expedited process available for energy-only projects",
    ],
  },
  {
    iso: "ERCOT",
    fullName: "Electric Reliability Council of Texas",
    processName: "Generation Interconnection Process",
    totalDurationMonths: 30,
    phases: [
      { name: "Screening Study", shortName: "SCR", durationMonths: 4, securityType: "deposit", calcMethod: "flat", rate: 5000, refundable: true, atRiskPct: 0, description: "Flat $5,000 screening study fee. Non-refundable application fee." },
      { name: "Full Interconnection Study", shortName: "FIS", durationMonths: 12, securityType: "deposit", calcMethod: "dollar_per_mw", rate: 3000, refundable: true, atRiskPct: 0, description: "$3,000/MW study deposit. Applied toward security." },
      { name: "IA Execution & Security Posting", shortName: "IA", durationMonths: 8, securityType: "milestone", calcMethod: "pct_of_upgrades", rate: 20, refundable: false, atRiskPct: 100, description: "20% of assigned network upgrade costs." },
      { name: "Construction Security", shortName: "CON", durationMonths: 6, securityType: "escalating", calcMethod: "pct_of_upgrades", rate: 100, refundable: false, atRiskPct: 100, description: "Full construction security." },
    ],
    notes: [
      "ERCOT is not FERC-jurisdictional — Texas-specific rules apply",
      "No capacity market — energy-only interconnection",
      "Faster timelines than FERC-jurisdictional ISOs",
      "Financial security based on upgrade cost allocation",
    ],
  },
  {
    iso: "ISO-NE",
    fullName: "ISO New England",
    processName: "Cluster Interconnection Process",
    totalDurationMonths: 40,
    phases: [
      { name: "Overlapping Impact Study", shortName: "OIS", durationMonths: 10, securityType: "deposit", calcMethod: "dollar_per_mw", rate: 3500, refundable: true, atRiskPct: 0, description: "$3,500/MW study deposit. Refundable upon study completion." },
      { name: "Cluster / Facilities Study", shortName: "CFS", durationMonths: 14, securityType: "milestone", calcMethod: "pct_of_upgrades", rate: 15, refundable: true, atRiskPct: 50, description: "15% of assigned network upgrade costs." },
      { name: "IA Execution", shortName: "IA", durationMonths: 10, securityType: "escalating", calcMethod: "pct_of_upgrades", rate: 25, refundable: false, atRiskPct: 100, description: "25% of total upgrade costs as IA security." },
      { name: "Construction Period", shortName: "CON", durationMonths: 6, securityType: "escalating", calcMethod: "pct_of_upgrades", rate: 100, refundable: false, atRiskPct: 100, description: "Full construction security." },
    ],
    notes: [
      "Capacity Network Resource Interconnection Service (CNRIS) available",
      "Forward Capacity Market participation requires deliverability",
      "Cluster groups formed based on electrical zone",
      "Transition cluster rules may apply for queue reform period",
    ],
  },
];

// ─── Mock Portfolio Projects ─────────────────────────────────────────────────
interface MockProject {
  id: number;
  name: string;
  iso: string;
  mw: number;
  fuel: string;
  state: string;
  currentPhaseIndex: number;
  queueEntryDate: string; // ISO date
  networkUpgradeCost: number;
  affectedSystemCost: number;
  icFacilitiesCost: number;
  securityPosted: number;
}

const MOCK_PROJECTS: MockProject[] = [
  { id: 1, name: "Midwest Wind Farm", iso: "MISO", mw: 350, fuel: "Wind", state: "IL", currentPhaseIndex: 1, queueEntryDate: "2024-03-15", networkUpgradeCost: 18500000, affectedSystemCost: 3200000, icFacilitiesCost: 5400000, securityPosted: 2100000 },
  { id: 2, name: "PJM Solar Hub", iso: "PJM", mw: 200, fuel: "Solar + Storage", state: "PA", currentPhaseIndex: 2, queueEntryDate: "2023-09-01", networkUpgradeCost: 12000000, affectedSystemCost: 1800000, icFacilitiesCost: 3200000, securityPosted: 3500000 },
  { id: 3, name: "Desert Sun BESS", iso: "CAISO", mw: 400, fuel: "Battery Storage", state: "CA", currentPhaseIndex: 1, queueEntryDate: "2024-01-10", networkUpgradeCost: 22000000, affectedSystemCost: 4500000, icFacilitiesCost: 7800000, securityPosted: 4200000 },
  { id: 4, name: "Prairie Wind SPP", iso: "SPP", mw: 300, fuel: "Wind", state: "OK", currentPhaseIndex: 0, queueEntryDate: "2024-08-20", networkUpgradeCost: 9800000, affectedSystemCost: 1200000, icFacilitiesCost: 2900000, securityPosted: 1200000 },
  { id: 5, name: "Texas Solar Ranch", iso: "ERCOT", mw: 500, fuel: "Solar", state: "TX", currentPhaseIndex: 2, queueEntryDate: "2023-06-15", networkUpgradeCost: 15000000, affectedSystemCost: 0, icFacilitiesCost: 4200000, securityPosted: 6000000 },
  { id: 6, name: "Manor Solar v2", iso: "NYISO", mw: 200, fuel: "Solar", state: "NY", currentPhaseIndex: 1, queueEntryDate: "2024-05-01", networkUpgradeCost: 8000000, affectedSystemCost: 2000000, icFacilitiesCost: 1800000, securityPosted: 500000 },
  { id: 7, name: "Kansas Wind Farm", iso: "SPP", mw: 400, fuel: "Wind", state: "KS", currentPhaseIndex: 3, queueEntryDate: "2022-11-10", networkUpgradeCost: 21000000, affectedSystemCost: 3800000, icFacilitiesCost: 6200000, securityPosted: 7500000 },
  { id: 8, name: "New England Solar", iso: "ISO-NE", mw: 120, fuel: "Solar", state: "MA", currentPhaseIndex: 1, queueEntryDate: "2024-02-28", networkUpgradeCost: 5500000, affectedSystemCost: 800000, icFacilitiesCost: 1500000, securityPosted: 1200000 },
  { id: 9, name: "Gulf Coast Wind", iso: "MISO", mw: 450, fuel: "Wind", state: "LA", currentPhaseIndex: 2, queueEntryDate: "2023-07-01", networkUpgradeCost: 28000000, affectedSystemCost: 5200000, icFacilitiesCost: 8900000, securityPosted: 5600000 },
  { id: 10, name: "Carolina Hybrid", iso: "PJM", mw: 320, fuel: "Solar + Storage", state: "NC", currentPhaseIndex: 1, queueEntryDate: "2024-04-15", networkUpgradeCost: 16000000, affectedSystemCost: 2800000, icFacilitiesCost: 4500000, securityPosted: 1800000 },
];

// ─── Helper Functions ────────────────────────────────────────────────────────
function fmt(val: number) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

function fmtFull(val: number) {
  return `$${val.toLocaleString()}`;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function monthDiff(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function calculatePhaseSecurityRequired(phase: PhaseDefinition, mw: number, networkUpgradeCost: number): number {
  switch (phase.calcMethod) {
    case "dollar_per_mw": return phase.rate * mw;
    case "pct_of_upgrades": return (phase.rate / 100) * networkUpgradeCost;
    case "flat": return phase.rate;
    case "pct_of_cost": return (phase.rate / 100) * networkUpgradeCost;
    default: return 0;
  }
}

interface PhaseCalcResult {
  phase: PhaseDefinition;
  phaseIndex: number;
  securityRequired: number;
  cumulativeSecurity: number;
  atRiskAmount: number;
  refundableAmount: number;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  isCompleted: boolean;
  isFuture: boolean;
}

function calculateProjectSecurity(project: MockProject, asOfDate: Date): PhaseCalcResult[] {
  const ruleSet = ISO_RULES.find((r) => r.iso === project.iso);
  if (!ruleSet) return [];

  const entryDate = new Date(project.queueEntryDate);
  let cumMonths = 0;
  let cumulativeSecurity = 0;

  return ruleSet.phases.map((phase, idx) => {
    const startDate = addMonths(entryDate, cumMonths);
    cumMonths += phase.durationMonths;
    const endDate = addMonths(entryDate, cumMonths);

    const securityRequired = calculatePhaseSecurityRequired(phase, project.mw, project.networkUpgradeCost);
    cumulativeSecurity += securityRequired;
    const atRiskAmount = (phase.atRiskPct / 100) * cumulativeSecurity;
    const refundableAmount = phase.refundable ? cumulativeSecurity - atRiskAmount : 0;

    const isCurrent = idx === project.currentPhaseIndex;
    const isCompleted = idx < project.currentPhaseIndex;
    const isFuture = idx > project.currentPhaseIndex;

    return {
      phase, phaseIndex: idx, securityRequired, cumulativeSecurity,
      atRiskAmount, refundableAmount, startDate, endDate,
      isCurrent, isCompleted, isFuture,
    };
  });
}

// ─── Color maps ──────────────────────────────────────────────────────────────
const ISO_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  PJM:     { bg: "bg-blue-100", text: "text-blue-800", accent: "bg-blue-500" },
  MISO:    { bg: "bg-green-100", text: "text-green-800", accent: "bg-green-500" },
  SPP:     { bg: "bg-purple-100", text: "text-purple-800", accent: "bg-purple-500" },
  CAISO:   { bg: "bg-orange-100", text: "text-orange-800", accent: "bg-orange-500" },
  NYISO:   { bg: "bg-pink-100", text: "text-pink-800", accent: "bg-pink-500" },
  "ISO-NE":{ bg: "bg-cyan-100", text: "text-cyan-800", accent: "bg-cyan-500" },
  ERCOT:   { bg: "bg-red-100", text: "text-red-800", accent: "bg-red-500" },
};

const PHASE_STATUS_COLORS = {
  completed: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  current:   { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  future:    { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-500", badge: "bg-slate-100 text-slate-500", dot: "bg-slate-300" },
};

// ─── Section Wrapper ─────────────────────────────────────────────────────────
function Section({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-white p-6 shadow-sm border border-slate-200 ${className}`}>
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Phase Timeline Component ────────────────────────────────────────────────
function PhaseTimeline({ phases, projectName }: { phases: PhaseCalcResult[]; projectName: string }) {
  return (
    <div className="space-y-0">
      {phases.map((p, idx) => {
        const status = p.isCompleted ? "completed" : p.isCurrent ? "current" : "future";
        const colors = PHASE_STATUS_COLORS[status];
        return (
          <div key={idx} className="relative">
            {/* Connector line */}
            {idx < phases.length - 1 && (
              <div className={`absolute left-5 top-12 w-0.5 h-full ${p.isCompleted ? "bg-emerald-300" : "bg-slate-200"}`} />
            )}
            <div className={`relative flex items-start gap-4 p-4 rounded-lg ${colors.bg} border ${colors.border} mb-1`}>
              {/* Status dot */}
              <div className="flex-shrink-0 mt-0.5">
                <div className={`h-4 w-4 rounded-full ${colors.dot} border-2 border-white shadow`} />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-slate-800">{p.phase.shortName}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
                    {p.isCompleted ? "Completed" : p.isCurrent ? "Current Phase" : "Upcoming"}
                  </span>
                  <span className="text-xs text-slate-400 ml-auto">{p.phase.durationMonths}mo</span>
                </div>
                <p className="text-xs text-slate-600 mb-2">{p.phase.name}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <p className="text-xs text-slate-400">Security Req.</p>
                    <p className="text-sm font-bold text-slate-800">{fmt(p.securityRequired)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Cumulative</p>
                    <p className="text-sm font-bold text-slate-800">{fmt(p.cumulativeSecurity)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">At Risk</p>
                    <p className="text-sm font-bold text-red-600">{fmt(p.atRiskAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Timeline</p>
                    <p className="text-xs font-medium text-slate-700">{formatDate(p.startDate)} → {formatDate(p.endDate)}</p>
                  </div>
                </div>
                {/* Calculation formula */}
                <div className="mt-2 px-2 py-1.5 bg-white/60 rounded border border-slate-200/50">
                  <p className="text-xs text-slate-400 font-mono">
                    {p.phase.calcMethod === "dollar_per_mw" && `Formula: ${p.phase.rate.toLocaleString()} $/MW × ${phases[0] ? "" : ""}MW = ${fmtFull(p.securityRequired)}`}
                    {p.phase.calcMethod === "pct_of_upgrades" && `Formula: ${p.phase.rate}% × Network Upgrades = ${fmtFull(p.securityRequired)}`}
                    {p.phase.calcMethod === "flat" && `Formula: Flat fee = ${fmtFull(p.securityRequired)}`}
                    {" "} | At Risk: {p.phase.atRiskPct}% of cumulative | {p.phase.refundable ? "✓ Refundable" : "✗ Non-refundable"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Forecast Chart (Text-based) ─────────────────────────────────────────────
function ForecastChart({ phases }: { phases: PhaseCalcResult[] }) {
  const maxSec = Math.max(...phases.map((p) => p.cumulativeSecurity), 1);
  return (
    <div className="space-y-2">
      {phases.map((p, idx) => {
        const widthPct = (p.cumulativeSecurity / maxSec) * 100;
        const riskPct = p.cumulativeSecurity > 0 ? (p.atRiskAmount / p.cumulativeSecurity) * 100 : 0;
        const status = p.isCompleted ? "completed" : p.isCurrent ? "current" : "future";
        return (
          <div key={idx} className="flex items-center gap-3">
            <span className="w-16 text-xs font-semibold text-slate-500 text-right">{p.phase.shortName}</span>
            <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden relative">
              {/* Total security bar */}
              <div
                className={`h-full rounded-lg transition-all relative ${status === "completed" ? "bg-emerald-200" : status === "current" ? "bg-amber-200" : "bg-slate-200"}`}
                style={{ width: `${Math.max(widthPct, 3)}%` }}
              >
                {/* At-risk portion overlay */}
                <div
                  className={`absolute right-0 top-0 h-full ${status === "completed" ? "bg-emerald-400" : status === "current" ? "bg-red-300" : "bg-slate-300"}`}
                  style={{ width: `${riskPct}%` }}
                />
              </div>
            </div>
            <span className="w-20 text-xs font-bold text-slate-700 text-right">{fmt(p.cumulativeSecurity)}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-4 mt-3 border-t border-slate-100 pt-2">
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-5 bg-amber-200 rounded" /><span className="text-xs text-slate-500">Refundable</span></div>
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-5 bg-red-300 rounded" /><span className="text-xs text-slate-500">At Risk</span></div>
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-5 bg-emerald-400 rounded" /><span className="text-xs text-slate-500">Completed</span></div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SecurityCalculatorPage() {
  const [selectedISO, setSelectedISO] = useState("MISO");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [forecastDate, setForecastDate] = useState("2026-06-30");
  const [showAllProjects, setShowAllProjects] = useState(true);
  const [customMW, setCustomMW] = useState("300");
  const [customUpgradeCost, setCustomUpgradeCost] = useState("15000000");

  const selectedRule = ISO_RULES.find((r) => r.iso === selectedISO)!;
  const isoProjects = MOCK_PROJECTS.filter((p) => showAllProjects || p.iso === selectedISO);

  // Calculate for selected project or custom inputs
  const selectedProject = selectedProjectId ? MOCK_PROJECTS.find((p) => p.id === selectedProjectId) : null;
  const asOfDate = new Date(forecastDate);

  const projectPhases = useMemo(() => {
    if (selectedProject) {
      return calculateProjectSecurity(selectedProject, asOfDate);
    }
    return null;
  }, [selectedProject, forecastDate]);

  // Custom calculator phases
  const customPhases = useMemo(() => {
    const mw = parseFloat(customMW) || 0;
    const upgrades = parseFloat(customUpgradeCost) || 0;
    const mockProj: MockProject = {
      id: 0, name: "Custom Project", iso: selectedISO, mw, fuel: "Solar", state: "TX",
      currentPhaseIndex: 0, queueEntryDate: new Date().toISOString().slice(0, 10),
      networkUpgradeCost: upgrades, affectedSystemCost: 0, icFacilitiesCost: 0, securityPosted: 0,
    };
    return calculateProjectSecurity(mockProj, asOfDate);
  }, [selectedISO, customMW, customUpgradeCost, forecastDate]);

  // Portfolio summary
  const portfolioSummary = useMemo(() => {
    return isoProjects.map((project) => {
      const phases = calculateProjectSecurity(project, asOfDate);
      const currentPhase = phases[project.currentPhaseIndex];
      const totalSecRequired = currentPhase?.cumulativeSecurity || 0;
      const totalAtRisk = currentPhase?.atRiskAmount || 0;
      const nextPhase = phases[project.currentPhaseIndex + 1];
      const nextSecRequired = nextPhase ? nextPhase.securityRequired : 0;
      const nextPhaseDate = nextPhase ? nextPhase.startDate : null;
      const deficit = totalSecRequired - project.securityPosted;
      return { project, phases, currentPhase, totalSecRequired, totalAtRisk, nextSecRequired, nextPhaseDate, deficit };
    });
  }, [isoProjects, forecastDate, showAllProjects]);

  const totalPortfolioSecurity = portfolioSummary.reduce((s, p) => s + p.totalSecRequired, 0);
  const totalPortfolioAtRisk = portfolioSummary.reduce((s, p) => s + p.totalAtRisk, 0);
  const totalPortfolioPosted = portfolioSummary.reduce((s, p) => s + p.project.securityPosted, 0);
  const totalDeficit = portfolioSummary.reduce((s, p) => s + Math.max(p.deficit, 0), 0);
  const totalMW = isoProjects.reduce((s, p) => s + p.mw, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.25-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.25-2.25h.008v.008H15v-.008z" /></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ISO Security Calculator</h1>
            <p className="text-sm text-slate-500">Automated security requirements based on ISO interconnection rules & DPP schedules</p>
          </div>
        </div>
      </div>

      {/* Top Controls */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">ISO Region</label>
          <select value={selectedISO} onChange={(e) => { setSelectedISO(e.target.value); setSelectedProjectId(null); }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
            {ISO_RULES.map((r) => <option key={r.iso} value={r.iso}>{r.iso} — {r.processName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Forecast Date</label>
          <input type="date" value={forecastDate} onChange={(e) => setForecastDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showAllProjects} onChange={(e) => setShowAllProjects(e.target.checked)}
              className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
            <span className="text-sm text-slate-600">Show all ISOs</span>
          </label>
        </div>
      </div>

      {/* Portfolio KPI Cards */}
      <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Projects</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{isoProjects.length}</p>
          <p className="text-xs text-slate-400">{totalMW.toLocaleString()} MW</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Security Required</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{fmt(totalPortfolioSecurity)}</p>
          <p className="text-xs text-slate-400">Current phase obligations</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Security Posted</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{fmt(totalPortfolioPosted)}</p>
          <p className="text-xs text-slate-400">Currently on deposit</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">At Risk</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{fmt(totalPortfolioAtRisk)}</p>
          <p className="text-xs text-slate-400">Non-recoverable exposure</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Deficit</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">{fmt(totalDeficit)}</p>
          <p className="text-xs text-slate-400">Additional posting needed</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Coverage Ratio</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{totalPortfolioSecurity > 0 ? `${Math.round((totalPortfolioPosted / totalPortfolioSecurity) * 100)}%` : "N/A"}</p>
          <p className="text-xs text-slate-400">Posted vs Required</p>
        </div>
      </div>

      {/* Row 1: ISO Rules + Custom Calculator */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ISO Rule Reference */}
        <Section title={`${selectedISO} Security Rules`} subtitle={`${selectedRule.fullName} — ${selectedRule.processName}`}>
          <div className="mb-4 flex items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${ISO_COLORS[selectedISO]?.bg} ${ISO_COLORS[selectedISO]?.text}`}>
              {selectedISO}
            </span>
            <span className="text-xs text-slate-400">Total process: ~{selectedRule.totalDurationMonths} months</span>
          </div>

          {/* Phase rules table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-2 py-2 text-left font-semibold text-slate-600">Phase</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-600">Duration</th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-600">Calc Method</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-600">Rate</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-600">At Risk %</th>
                  <th className="px-2 py-2 text-center font-semibold text-slate-600">Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedRule.phases.map((phase, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-2 py-2">
                      <span className="font-semibold text-slate-800">{phase.shortName}</span>
                      <p className="text-slate-400 mt-0.5">{phase.name}</p>
                    </td>
                    <td className="px-2 py-2 text-right text-slate-600">{phase.durationMonths}mo</td>
                    <td className="px-2 py-2">
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                        phase.calcMethod === "dollar_per_mw" ? "bg-blue-100 text-blue-700" :
                        phase.calcMethod === "pct_of_upgrades" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {phase.calcMethod === "dollar_per_mw" ? "$/MW" : phase.calcMethod === "pct_of_upgrades" ? "% Upgrades" : "Flat"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right font-mono font-bold text-slate-800">
                      {phase.calcMethod === "dollar_per_mw" ? `$${phase.rate.toLocaleString()}/MW` :
                       phase.calcMethod === "pct_of_upgrades" ? `${phase.rate}%` :
                       `$${phase.rate.toLocaleString()}`}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <span className={`font-bold ${phase.atRiskPct >= 100 ? "text-red-600" : phase.atRiskPct > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {phase.atRiskPct}%
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      {phase.refundable ?
                        <span className="text-emerald-500">✓</span> :
                        <span className="text-red-400">✗</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-1.5">ISO Rule Notes:</p>
            <ul className="space-y-1">
              {selectedRule.notes.map((note, idx) => (
                <li key={idx} className="text-xs text-slate-500 flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">•</span>{note}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Custom Security Calculator */}
        <Section title="Security Calculator" subtitle={`Quick estimate using ${selectedISO} rules`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Project Size (MW)</label>
                <input type="number" value={customMW} onChange={(e) => setCustomMW(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Est. Network Upgrade Cost ($)</label>
                <input type="number" value={customUpgradeCost} onChange={(e) => setCustomUpgradeCost(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
            </div>

            {/* Results */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Calculated Security by Phase</p>
              <div className="space-y-2">
                {customPhases.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-200 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                      <span className="text-sm font-medium text-slate-700">{p.phase.shortName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Phase: </span>
                        <span className="text-sm font-bold text-slate-800">{fmt(p.securityRequired)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Cumul: </span>
                        <span className="text-sm font-bold text-amber-600">{fmt(p.cumulativeSecurity)}</span>
                      </div>
                      <div className="text-right w-16">
                        <span className="text-xs font-bold text-red-600">{fmt(p.atRiskAmount)}</span>
                        <p className="text-xs text-slate-400">at risk</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Total */}
              <div className="mt-3 pt-3 border-t-2 border-slate-300 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Total Security (All Phases)</span>
                <span className="text-lg font-bold text-amber-600">
                  {fmt(customPhases[customPhases.length - 1]?.cumulativeSecurity || 0)}
                </span>
              </div>
            </div>

            {/* Forecast bar visualization */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Security Escalation Profile</p>
              <ForecastChart phases={customPhases} />
            </div>
          </div>
        </Section>
      </div>

      {/* Row 2: Project Detail Drill-Down */}
      <div className="mb-6">
        <Section title="Project Security Detail" subtitle="Select a project to view DPP phase timeline and security calculations">
          <div className="mb-4">
            <select
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">— Select a project —</option>
              {MOCK_PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.iso} • {p.mw} MW)</option>
              ))}
            </select>
          </div>

          {selectedProject && projectPhases ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Info Card */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-3">{selectedProject.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">ISO:</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${ISO_COLORS[selectedProject.iso]?.bg} ${ISO_COLORS[selectedProject.iso]?.text}`}>{selectedProject.iso}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-500">Capacity:</span><span className="font-bold text-slate-800">{selectedProject.mw} MW</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Fuel:</span><span className="text-slate-700">{selectedProject.fuel}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Queue Entry:</span><span className="text-slate-700">{new Date(selectedProject.queueEntryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">State:</span><span className="text-slate-700">{selectedProject.state}</span></div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 space-y-2 text-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Cost Breakdown</p>
                  <div className="flex justify-between"><span className="text-slate-500">Network Upgrades:</span><span className="font-bold text-slate-800">{fmt(selectedProject.networkUpgradeCost)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Affected System:</span><span className="text-slate-700">{fmt(selectedProject.affectedSystemCost)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">IC Facilities:</span><span className="text-slate-700">{fmt(selectedProject.icFacilitiesCost)}</span></div>
                  <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-600 font-semibold">Total Costs:</span><span className="font-bold text-slate-900">{fmt(selectedProject.networkUpgradeCost + selectedProject.affectedSystemCost + selectedProject.icFacilitiesCost)}</span></div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 space-y-2 text-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Security Status</p>
                  <div className="flex justify-between"><span className="text-slate-500">Posted:</span><span className="font-bold text-emerald-600">{fmt(selectedProject.securityPosted)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Required:</span><span className="font-bold text-amber-600">{fmt(projectPhases[selectedProject.currentPhaseIndex]?.cumulativeSecurity || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">At Risk:</span><span className="font-bold text-red-600">{fmt(projectPhases[selectedProject.currentPhaseIndex]?.atRiskAmount || 0)}</span></div>
                  {(() => {
                    const req = projectPhases[selectedProject.currentPhaseIndex]?.cumulativeSecurity || 0;
                    const deficit = req - selectedProject.securityPosted;
                    return deficit > 0 ? (
                      <div className="flex justify-between bg-red-50 px-2 py-1 rounded"><span className="text-red-600 font-semibold">Deficit:</span><span className="font-bold text-red-700">{fmt(deficit)}</span></div>
                    ) : (
                      <div className="flex justify-between bg-emerald-50 px-2 py-1 rounded"><span className="text-emerald-600 font-semibold">Surplus:</span><span className="font-bold text-emerald-700">{fmt(Math.abs(deficit))}</span></div>
                    );
                  })()}
                </div>
              </div>

              {/* DPP Phase Timeline */}
              <div className="lg:col-span-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  {ISO_RULES.find((r) => r.iso === selectedProject.iso)?.processName} — Phase Timeline
                </p>
                <PhaseTimeline phases={projectPhases} projectName={selectedProject.name} />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
              <p className="text-sm">Select a project above to view detailed DPP phase timeline and security calculations</p>
            </div>
          )}
        </Section>
      </div>

      {/* Row 3: Portfolio Security Forecast Table */}
      <Section title="Portfolio Security Forecast" subtitle={`All projects — security obligations as of ${new Date(forecastDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Project</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">ISO</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-600">MW</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Current Phase</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-600">NW Upgrade $</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-600">Security Req.</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-600">Posted</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-600">At Risk</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-600">Deficit</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-600">Next Phase $</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Next Milestone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {portfolioSummary.map(({ project, currentPhase, totalSecRequired, totalAtRisk, nextSecRequired, nextPhaseDate, deficit }) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedProjectId(project.id)}>
                  <td className="px-3 py-2.5 font-medium text-slate-900">{project.name}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${ISO_COLORS[project.iso]?.bg} ${ISO_COLORS[project.iso]?.text}`}>
                      {project.iso}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-800">{project.mw}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      PHASE_STATUS_COLORS.current.badge
                    }`}>
                      {currentPhase?.phase.shortName || "N/A"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{fmt(project.networkUpgradeCost)}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-amber-600">{fmt(totalSecRequired)}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-emerald-600">{fmt(project.securityPosted)}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-red-600">{fmt(totalAtRisk)}</td>
                  <td className="px-3 py-2.5 text-right">
                    {deficit > 0 ? (
                      <span className="font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">{fmt(deficit)}</span>
                    ) : (
                      <span className="font-medium text-emerald-600">OK</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{nextSecRequired > 0 ? fmt(nextSecRequired) : "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{nextPhaseDate ? formatDate(nextPhaseDate) : "Final"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                <td className="px-3 py-2.5 text-slate-700">Portfolio Total</td>
                <td className="px-3 py-2.5 text-slate-500">{isoProjects.length} projects</td>
                <td className="px-3 py-2.5 text-right text-slate-800">{totalMW.toLocaleString()}</td>
                <td />
                <td className="px-3 py-2.5 text-right text-slate-600">{fmt(isoProjects.reduce((s, p) => s + p.networkUpgradeCost, 0))}</td>
                <td className="px-3 py-2.5 text-right text-amber-700">{fmt(totalPortfolioSecurity)}</td>
                <td className="px-3 py-2.5 text-right text-emerald-700">{fmt(totalPortfolioPosted)}</td>
                <td className="px-3 py-2.5 text-right text-red-700">{fmt(totalPortfolioAtRisk)}</td>
                <td className="px-3 py-2.5 text-right text-red-800">{totalDeficit > 0 ? fmt(totalDeficit) : "OK"}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>
    </div>
  );
}
