"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────
interface PhaseRule {
  phase: string;
  description: string;
  securityType: "deposit" | "security" | "milestone";
  calcMethod: "fixed" | "per_mw" | "pct_upgrade" | "pct_total" | "formula";
  fixedAmount?: number;
  perMwAmount?: number;
  pctSecurityRequired: number; // Editable: % of network upgrades required as security
  pctAtRisk: number;           // Editable: % of posted security that is at risk
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

interface ScheduleEntry {
  queueNumber: string;
  projectName: string;
  phase: string;
  phaseStartDate: string;
  phaseEndDate: string;
  securityDueDate: string;
  sizeMw: number;
  networkUpgrades: number;
  status: string;
}

interface ProjectCalc {
  id: number;
  name: string;
  iso: string;
  sizeMw: number;
  networkUpgrades: number;
  icFacilities: number;
  affectedSystem: number;
  currentPhase: number;
  queueEntryDate: string;
  queueNumber: string;
  securityPosted: number;
  securityAtRisk: number;
  securityRequired: number;
  futureRequired: number;
  phaseCalcs: PhaseCalcResult[];
}

interface PhaseCalcResult {
  phase: string;
  securityRequired: number;
  securityAtRisk: number;
  cumulativeRequired: number;
  cumulativeAtRisk: number;
  estimatedDate: string;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  atRisk: boolean;
  refundable: boolean;
  calcMethod: string;
  pctSecurityRequired: number;
  pctAtRisk: number;
  description: string;
}

// ─── Default ISO Rules ──────────────────────────────────────────────────────
const DEFAULT_ISO_RULES: ISORule[] = [
  {
    iso: "PJM",
    fullName: "PJM Interconnection",
    processName: "BPM-15 New Services Queue",
    description: "PJM's first-ready, first-served cluster study process with escalating financial commitments.",
    phases: [
      { phase: "Readiness Deposit", description: "Application fee + readiness deposit to enter queue", securityType: "deposit", calcMethod: "per_mw", perMwAmount: 4000, pctSecurityRequired: 0, pctAtRisk: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 0 },
      { phase: "Phase 1 - SIS", description: "System Impact Study; security = MAX($5k/MW, X% of network upgrades)", securityType: "security", calcMethod: "formula", perMwAmount: 5000, pctSecurityRequired: 10, pctAtRisk: 100, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 12 },
      { phase: "Phase 2 - Facilities", description: "Facilities Study; additional security = X% of upgrade costs", securityType: "security", calcMethod: "pct_upgrade", pctSecurityRequired: 20, pctAtRisk: 100, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 24 },
      { phase: "Phase 3 - Final", description: "Final cost allocation; cumulative security = X% of total costs", securityType: "security", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 30 },
      { phase: "ISA Execution", description: "Interconnection Service Agreement execution", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 36 },
      { phase: "Construction", description: "Construction period; security held until COD", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 18, cumulativeMonths: 54 },
      { phase: "Commercial Operation", description: "COD; security returned minus actual costs", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 0, pctAtRisk: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 54 },
    ],
    notes: ["Readiness Deposit: $4,000/MW (min $200K)", "Phase 1: Greater of $5k/MW or % of network upgrades", "Phase 2: Incremental % of updated upgrade costs", "Phase 3: % of final allocated costs"],
  },
  {
    iso: "MISO",
    fullName: "Midcontinent ISO",
    processName: "Definitive Planning Phase (DPP)",
    description: "MISO's three-phase DPP process with milestone-based security tied to network upgrade cost allocation.",
    phases: [
      { phase: "DPP Entry (M1)", description: "Site control + initial study deposit", securityType: "deposit", calcMethod: "per_mw", perMwAmount: 4000, pctSecurityRequired: 0, pctAtRisk: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 0 },
      { phase: "Phase 1 (M2)", description: "Preliminary system impact; M2 milestone security", securityType: "security", calcMethod: "per_mw", perMwAmount: 4000, pctSecurityRequired: 0, pctAtRisk: 100, atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 12 },
      { phase: "Phase 2 - SIS (M3)", description: "Full system impact study; security = MAX($4k/MW, X% of upgrades)", securityType: "security", calcMethod: "formula", perMwAmount: 4000, pctSecurityRequired: 10, pctAtRisk: 100, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 24 },
      { phase: "Phase 3 - Facilities (M4)", description: "Facilities study; M4 security = X% of network upgrades", securityType: "security", calcMethod: "pct_upgrade", pctSecurityRequired: 20, pctAtRisk: 100, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 10, cumulativeMonths: 34 },
      { phase: "GIA Execution", description: "Generator Interconnection Agreement; security = X% of assigned costs", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 40 },
      { phase: "Construction", description: "Construction period; security maintained", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 18, cumulativeMonths: 58 },
      { phase: "Commercial Operation", description: "COD; security reconciled", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 0, pctAtRisk: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 58 },
    ],
    notes: ["M1: Site control + $4k/MW deposit", "M2: $4k/MW security posting", "M3: Greater of $4k/MW or % of network upgrades", "M4: % of network upgrade costs"],
  },
  {
    iso: "SPP",
    fullName: "Southwest Power Pool",
    processName: "DISIS Cluster Study",
    description: "SPP's DISIS cluster process with staged security requirements. SPP posts updated DISIS schedules regularly.",
    phases: [
      { phase: "DISIS Application", description: "Application fee + study deposit", securityType: "deposit", calcMethod: "per_mw", perMwAmount: 2000, pctSecurityRequired: 0, pctAtRisk: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 0 },
      { phase: "DISIS Study", description: "Cluster system impact study; security = $4k/MW", securityType: "security", calcMethod: "per_mw", perMwAmount: 4000, pctSecurityRequired: 0, pctAtRisk: 100, atRisk: true, refundable: false, typicalDurationMonths: 15, cumulativeMonths: 15 },
      { phase: "Facilities Study", description: "Individual facilities study; security = X% of network upgrades", securityType: "security", calcMethod: "pct_upgrade", pctSecurityRequired: 20, pctAtRisk: 100, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 27 },
      { phase: "GIA Execution", description: "Interconnection agreement; security = X% of assigned costs", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 33 },
      { phase: "Construction", description: "Construction period", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 18, cumulativeMonths: 51 },
      { phase: "Commercial Operation", description: "COD achieved", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 0, pctAtRisk: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 51 },
    ],
    notes: ["Application: $2k/MW study deposit", "DISIS: $4k/MW financial security", "Facilities: % of assigned network upgrades", "SPP posts DISIS schedule updates monthly"],
  },
  {
    iso: "CAISO",
    fullName: "California ISO",
    processName: "GIP Cluster Study",
    description: "CAISO cluster study process with Phase I/II studies and interconnection financial security postings.",
    phases: [
      { phase: "Cluster Application", description: "Application fee + study deposit", securityType: "deposit", calcMethod: "fixed", fixedAmount: 50000, pctSecurityRequired: 0, pctAtRisk: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 0 },
      { phase: "Phase I Study", description: "Cluster Phase I; IFS Posting #1 = $10k/MW (min $500K)", securityType: "security", calcMethod: "per_mw", perMwAmount: 10000, pctSecurityRequired: 0, pctAtRisk: 100, atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 12 },
      { phase: "Phase II Study", description: "Phase II detailed study; IFS Posting #2 = X% of upgrade costs", securityType: "security", calcMethod: "pct_upgrade", pctSecurityRequired: 15, pctAtRisk: 100, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 24 },
      { phase: "GIA Tendering", description: "GIA offered; IFS Posting #3 = cumulative to X% of assigned costs", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 30 },
      { phase: "Construction", description: "Construction with security held", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 24, cumulativeMonths: 54 },
      { phase: "Commercial Operation", description: "COD; security reconciled", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 0, pctAtRisk: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 54 },
    ],
    notes: ["Application: $50K study deposit", "IFS #1 (Phase I): $10k/MW (min $500K)", "IFS #2 (Phase II): % of Phase II assigned costs", "IFS #3 (GIA): Bring total to % of assigned costs"],
  },
  {
    iso: "NYISO",
    fullName: "New York ISO",
    processName: "Class Year Study",
    description: "NYISO groups projects into Class Years for interconnection studies with deposit-based progression.",
    phases: [
      { phase: "Application", description: "Queue application + study deposit", securityType: "deposit", calcMethod: "per_mw", perMwAmount: 1000, pctSecurityRequired: 0, pctAtRisk: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 0 },
      { phase: "SRIS / SIS", description: "System Reliability Impact Study; security = $5k/MW", securityType: "security", calcMethod: "per_mw", perMwAmount: 5000, pctSecurityRequired: 0, pctAtRisk: 100, atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 12 },
      { phase: "Class Year Study", description: "Full class year study; security = X% of upgrade costs", securityType: "security", calcMethod: "pct_upgrade", pctSecurityRequired: 25, pctAtRisk: 100, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 18, cumulativeMonths: 30 },
      { phase: "IA Execution", description: "Interconnection agreement; security = X% of assigned costs", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 36 },
      { phase: "Construction", description: "Construction period", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 24, cumulativeMonths: 60 },
      { phase: "Commercial Operation", description: "COD achieved", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 0, pctAtRisk: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 60 },
    ],
    notes: ["Application: $10K fee + $1k/MW deposit", "SRIS: $5k/MW security posting", "Class Year: % of allocated upgrades", "Class Year process can take 2-5 years"],
  },
  {
    iso: "ISO-NE",
    fullName: "ISO New England",
    processName: "Cluster Study Process",
    description: "ISO-NE cluster interconnection study with progressive security requirements.",
    phases: [
      { phase: "Application", description: "Queue application + study deposit ($50K base)", securityType: "deposit", calcMethod: "fixed", fixedAmount: 50000, pctSecurityRequired: 0, pctAtRisk: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 0 },
      { phase: "Cluster SIS", description: "System impact study; security = $5k/MW", securityType: "security", calcMethod: "per_mw", perMwAmount: 5000, pctSecurityRequired: 0, pctAtRisk: 100, atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 12 },
      { phase: "Facilities Study", description: "Facilities study; security = X% of network upgrades", securityType: "security", calcMethod: "pct_upgrade", pctSecurityRequired: 20, pctAtRisk: 100, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 24 },
      { phase: "IA Execution", description: "IA; security = X% of assigned costs", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 30 },
      { phase: "Construction", description: "Construction period", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 18, cumulativeMonths: 48 },
      { phase: "Commercial Operation", description: "COD achieved", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 0, pctAtRisk: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 48 },
    ],
    notes: ["Application: $50K base study deposit", "Cluster SIS: $5k/MW financial assurance", "Facilities: % of allocated network upgrades"],
  },
  {
    iso: "ERCOT",
    fullName: "Electric Reliability Council of Texas",
    processName: "Generator Interconnection Process",
    description: "ERCOT's process is faster with lower initial security but significant construction-phase requirements.",
    phases: [
      { phase: "Application", description: "Application fee + screening study deposit", securityType: "deposit", calcMethod: "fixed", fixedAmount: 50000, pctSecurityRequired: 0, pctAtRisk: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 0 },
      { phase: "Screening Study", description: "Initial screening; security = $3k/MW", securityType: "security", calcMethod: "per_mw", perMwAmount: 3000, pctSecurityRequired: 0, pctAtRisk: 100, atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 6 },
      { phase: "Full Study", description: "Full interconnection study; security = X% of network upgrades", securityType: "security", calcMethod: "pct_upgrade", pctSecurityRequired: 10, pctAtRisk: 100, percentageOf: "network_upgrades", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 18 },
      { phase: "IA Execution", description: "IA; security = X% of assigned costs", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 6, cumulativeMonths: 24 },
      { phase: "Construction", description: "Construction period", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 100, pctAtRisk: 100, percentageOf: "total_costs", atRisk: true, refundable: false, typicalDurationMonths: 12, cumulativeMonths: 36 },
      { phase: "Commercial Operation", description: "COD achieved", securityType: "milestone", calcMethod: "pct_total", pctSecurityRequired: 0, pctAtRisk: 0, atRisk: false, refundable: true, typicalDurationMonths: 0, cumulativeMonths: 36 },
    ],
    notes: ["Application: $50K screening deposit", "Screening: $3k/MW (lower than most ISOs)", "Full Study: % of assigned network upgrades", "ERCOT typically 24-36 months total"],
  },
];

const ISO_COLORS: Record<string, { bg: string; text: string; border: string; accent: string; light: string }> = {
  PJM: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", accent: "bg-blue-500", light: "bg-blue-100" },
  MISO: { bg: "bg-green-50", text: "text-green-800", border: "border-green-200", accent: "bg-green-500", light: "bg-green-100" },
  SPP: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", accent: "bg-purple-500", light: "bg-purple-100" },
  CAISO: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200", accent: "bg-orange-500", light: "bg-orange-100" },
  NYISO: { bg: "bg-pink-50", text: "text-pink-800", border: "border-pink-200", accent: "bg-pink-500", light: "bg-pink-100" },
  "ISO-NE": { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200", accent: "bg-cyan-500", light: "bg-cyan-100" },
  ERCOT: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", accent: "bg-red-500", light: "bg-red-100" },
};

function fmt(val: number) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

function fmtFull(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

// ─── Mock Projects ──────────────────────────────────────────────────────────
const MOCK_PROJECTS: ProjectCalc[] = [
  { id: 1, name: "Manor Solar v2", iso: "NYISO", sizeMw: 200, networkUpgrades: 3500000, icFacilities: 2000000, affectedSystem: 0, currentPhase: 2, queueEntryDate: "2024-03-01", queueNumber: "Q-2024-0451", securityPosted: 500000, securityAtRisk: 200000, securityRequired: 0, futureRequired: 0, phaseCalcs: [] },
  { id: 2, name: "Midwest Wind Farm", iso: "MISO", sizeMw: 350, networkUpgrades: 8000000, icFacilities: 4500000, affectedSystem: 500000, currentPhase: 3, queueEntryDate: "2023-09-15", queueNumber: "J1234", securityPosted: 2100000, securityAtRisk: 1400000, securityRequired: 0, futureRequired: 0, phaseCalcs: [] },
  { id: 3, name: "PJM Solar Hub", iso: "PJM", sizeMw: 200, networkUpgrades: 6000000, icFacilities: 3000000, affectedSystem: 200000, currentPhase: 2, queueEntryDate: "2024-01-10", queueNumber: "AF2-123", securityPosted: 3500000, securityAtRisk: 2800000, securityRequired: 0, futureRequired: 0, phaseCalcs: [] },
  { id: 4, name: "Desert Sun BESS", iso: "CAISO", sizeMw: 400, networkUpgrades: 12000000, icFacilities: 5000000, affectedSystem: 800000, currentPhase: 2, queueEntryDate: "2023-06-01", queueNumber: "CL-2023-456", securityPosted: 4200000, securityAtRisk: 3000000, securityRequired: 0, futureRequired: 0, phaseCalcs: [] },
  { id: 5, name: "Prairie Wind SPP", iso: "SPP", sizeMw: 300, networkUpgrades: 5000000, icFacilities: 2500000, affectedSystem: 300000, currentPhase: 1, queueEntryDate: "2024-06-01", queueNumber: "DISIS-2024-789", securityPosted: 900000, securityAtRisk: 500000, securityRequired: 0, futureRequired: 0, phaseCalcs: [] },
  { id: 6, name: "Texas Solar Ranch", iso: "ERCOT", sizeMw: 500, networkUpgrades: 4000000, icFacilities: 6000000, affectedSystem: 0, currentPhase: 3, queueEntryDate: "2023-01-15", queueNumber: "INR-2023-001", securityPosted: 6000000, securityAtRisk: 5200000, securityRequired: 0, futureRequired: 0, phaseCalcs: [] },
  { id: 7, name: "Appalachian Wind", iso: "PJM", sizeMw: 275, networkUpgrades: 7000000, icFacilities: 3500000, affectedSystem: 0, currentPhase: 1, queueEntryDate: "2024-09-01", queueNumber: "AH1-456", securityPosted: 400000, securityAtRisk: 150000, securityRequired: 0, futureRequired: 0, phaseCalcs: [] },
  { id: 8, name: "Nevada BESS", iso: "CAISO", sizeMw: 250, networkUpgrades: 8000000, icFacilities: 4000000, affectedSystem: 500000, currentPhase: 3, queueEntryDate: "2023-03-01", queueNumber: "CL-2023-789", securityPosted: 2800000, securityAtRisk: 2200000, securityRequired: 0, futureRequired: 0, phaseCalcs: [] },
  { id: 9, name: "Gulf Coast Wind", iso: "MISO", sizeMw: 450, networkUpgrades: 10000000, icFacilities: 6000000, affectedSystem: 1000000, currentPhase: 2, queueEntryDate: "2024-01-01", queueNumber: "J5678", securityPosted: 1500000, securityAtRisk: 1000000, securityRequired: 0, futureRequired: 0, phaseCalcs: [] },
  { id: 10, name: "Carolina Hybrid", iso: "PJM", sizeMw: 320, networkUpgrades: 9000000, icFacilities: 4500000, affectedSystem: 300000, currentPhase: 2, queueEntryDate: "2023-11-01", queueNumber: "AG1-789", securityPosted: 1800000, securityAtRisk: 1200000, securityRequired: 0, futureRequired: 0, phaseCalcs: [] },
  { id: 11, name: "Kansas Wind Farm", iso: "SPP", sizeMw: 400, networkUpgrades: 6000000, icFacilities: 4000000, affectedSystem: 500000, currentPhase: 4, queueEntryDate: "2022-06-01", queueNumber: "DISIS-2022-123", securityPosted: 7500000, securityAtRisk: 6800000, securityRequired: 0, futureRequired: 0, phaseCalcs: [] },
  { id: 12, name: "New England Solar", iso: "ISO-NE", sizeMw: 120, networkUpgrades: 4000000, icFacilities: 2000000, affectedSystem: 0, currentPhase: 2, queueEntryDate: "2024-02-01", queueNumber: "NE-2024-034", securityPosted: 1200000, securityAtRisk: 900000, securityRequired: 0, futureRequired: 0, phaseCalcs: [] },
];

// ─── Calculation Engine ─────────────────────────────────────────────────────
function calculatePhaseSecurity(phase: PhaseRule, sizeMw: number, networkUpgrades: number, icFacilities: number, affectedSystem: number): { required: number; atRisk: number } {
  const totalCosts = networkUpgrades + icFacilities + affectedSystem;
  let required = 0;

  switch (phase.calcMethod) {
    case "fixed":
      required = phase.fixedAmount || 0;
      break;
    case "per_mw":
      required = (phase.perMwAmount || 0) * sizeMw;
      break;
    case "pct_upgrade":
      required = (phase.pctSecurityRequired / 100) * networkUpgrades;
      break;
    case "pct_total":
      required = (phase.pctSecurityRequired / 100) * totalCosts;
      break;
    case "formula": {
      const perMw = (phase.perMwAmount || 0) * sizeMw;
      const pctUpgrade = (phase.pctSecurityRequired / 100) * networkUpgrades;
      required = Math.max(perMw, pctUpgrade);
      break;
    }
  }

  const atRisk = required * (phase.pctAtRisk / 100);
  return { required, atRisk };
}

// ─── Tabs ───────────────────────────────────────────────────────────────────
type TabType = "calculator" | "rules" | "schedule" | "portfolio";

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function SecurityCalcPage() {
  const [activeTab, setActiveTab] = useState<TabType>("calculator");
  const [isoRules, setIsoRules] = useState<ISORule[]>(JSON.parse(JSON.stringify(DEFAULT_ISO_RULES)));
  const [selectedISO, setSelectedISO] = useState("PJM");
  const [sizeMw, setSizeMw] = useState(200);
  const [networkUpgrades, setNetworkUpgrades] = useState(5000000);
  const [icFacilities, setIcFacilities] = useState(3000000);
  const [affectedSystem, setAffectedSystem] = useState(0);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [queueEntryDate, setQueueEntryDate] = useState("2025-01-01");
  const [editingRules, setEditingRules] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([]);
  const [scheduleUploadISO, setScheduleUploadISO] = useState("MISO");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rule = isoRules.find((r) => r.iso === selectedISO)!;
  const colors = ISO_COLORS[selectedISO] || ISO_COLORS.PJM;

  // Phase calculations
  const phaseCalcs = useMemo(() => {
    let cumRequired = 0;
    let cumAtRisk = 0;
    return rule.phases.map((phase, idx) => {
      const { required, atRisk } = calculatePhaseSecurity(phase, sizeMw, networkUpgrades, icFacilities, affectedSystem);
      cumRequired += required;
      cumAtRisk += atRisk;
      const entryDate = new Date(queueEntryDate);
      entryDate.setMonth(entryDate.getMonth() + phase.cumulativeMonths);
      return {
        phase: phase.phase,
        securityRequired: required,
        securityAtRisk: atRisk,
        cumulativeRequired: cumRequired,
        cumulativeAtRisk: cumAtRisk,
        estimatedDate: entryDate.toISOString().split("T")[0],
        isPast: idx < currentPhaseIdx,
        isCurrent: idx === currentPhaseIdx,
        isFuture: idx > currentPhaseIdx,
        atRisk: phase.atRisk,
        refundable: phase.refundable,
        calcMethod: phase.calcMethod,
        pctSecurityRequired: phase.pctSecurityRequired,
        pctAtRisk: phase.pctAtRisk,
        description: phase.description,
      };
    });
  }, [rule, sizeMw, networkUpgrades, icFacilities, affectedSystem, currentPhaseIdx, queueEntryDate]);

  const totalPosted = phaseCalcs.filter((p) => p.isPast || p.isCurrent).reduce((s, p) => s + p.securityRequired, 0);
  const totalAtRisk = phaseCalcs.filter((p) => p.isPast || p.isCurrent).filter((p) => p.atRisk).reduce((s, p) => s + p.securityAtRisk, 0);
  const futureRequired = phaseCalcs.filter((p) => p.isFuture).reduce((s, p) => s + p.securityRequired, 0);
  const maxCum = phaseCalcs[phaseCalcs.length - 1]?.cumulativeRequired || 1;

  // Update ISO rule percentages
  const updatePhaseRule = useCallback((iso: string, phaseIdx: number, field: "pctSecurityRequired" | "pctAtRisk", value: number) => {
    setIsoRules((prev) => {
      const updated = JSON.parse(JSON.stringify(prev)) as ISORule[];
      const r = updated.find((rr) => rr.iso === iso);
      if (r) r.phases[phaseIdx][field] = value;
      return updated;
    });
  }, []);

  // Reset rules to default
  const resetRules = useCallback((iso: string) => {
    setIsoRules((prev) => {
      const updated = JSON.parse(JSON.stringify(prev)) as ISORule[];
      const defaultRule = DEFAULT_ISO_RULES.find((r) => r.iso === iso);
      const idx = updated.findIndex((r) => r.iso === iso);
      if (defaultRule && idx >= 0) updated[idx] = JSON.parse(JSON.stringify(defaultRule));
      return updated;
    });
  }, []);

  // Parse uploaded DPP/DISIS schedule (mock CSV parsing)
  const handleScheduleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        setUploadStatus("Error: File appears empty or has no data rows");
        return;
      }

      // Parse CSV — expecting columns: Queue Number, Project Name, Phase, Phase Start, Phase End, Security Due, Size MW, Network Upgrades, Status
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const entries: ScheduleEntry[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (cols.length < 5) continue;
        entries.push({
          queueNumber: cols[0] || "",
          projectName: cols[1] || `Project ${i}`,
          phase: cols[2] || "",
          phaseStartDate: cols[3] || "",
          phaseEndDate: cols[4] || "",
          securityDueDate: cols[5] || cols[4] || "",
          sizeMw: parseFloat(cols[6]) || 0,
          networkUpgrades: parseFloat(cols[7]) || 0,
          status: cols[8] || "Active",
        });
      }

      setScheduleData(entries);
      setUploadStatus(`Successfully parsed ${entries.length} schedule entries from ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  // Portfolio calculations
  const portfolioCalcs = useMemo(() => {
    return MOCK_PROJECTS.map((proj) => {
      const projRule = isoRules.find((r) => r.iso === proj.iso);
      if (!projRule) return proj;

      let cumRequired = 0;
      let cumAtRisk = 0;
      const pCalcs: PhaseCalcResult[] = projRule.phases.map((phase, idx) => {
        const { required, atRisk } = calculatePhaseSecurity(phase, proj.sizeMw, proj.networkUpgrades, proj.icFacilities, proj.affectedSystem);
        cumRequired += required;
        cumAtRisk += atRisk;
        const entryDate = new Date(proj.queueEntryDate);
        entryDate.setMonth(entryDate.getMonth() + phase.cumulativeMonths);
        return {
          phase: phase.phase,
          securityRequired: required,
          securityAtRisk: atRisk,
          cumulativeRequired: cumRequired,
          cumulativeAtRisk: cumAtRisk,
          estimatedDate: entryDate.toISOString().split("T")[0],
          isPast: idx < proj.currentPhase,
          isCurrent: idx === proj.currentPhase,
          isFuture: idx > proj.currentPhase,
          atRisk: phase.atRisk,
          refundable: phase.refundable,
          calcMethod: phase.calcMethod,
          pctSecurityRequired: phase.pctSecurityRequired,
          pctAtRisk: phase.pctAtRisk,
          description: phase.description,
        };
      });

      const secReq = pCalcs.filter((p) => p.isPast || p.isCurrent).reduce((s, p) => s + p.securityRequired, 0);
      const secRisk = pCalcs.filter((p) => (p.isPast || p.isCurrent) && p.atRisk).reduce((s, p) => s + p.securityAtRisk, 0);
      const futReq = pCalcs.filter((p) => p.isFuture).reduce((s, p) => s + p.securityRequired, 0);

      return { ...proj, securityRequired: secReq, securityAtRisk: secRisk, futureRequired: futReq, phaseCalcs: pCalcs };
    });
  }, [isoRules]);

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "calculator", label: "Security Calculator", icon: "🧮" },
    { key: "rules", label: "Edit ISO Rules", icon: "⚙️" },
    { key: "schedule", label: "Upload DPP/DISIS Schedule", icon: "📅" },
    { key: "portfolio", label: "Portfolio Security", icon: "📊" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back to Dashboard</Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">ISO Security Calculator</h1>
        <p className="mt-1 text-sm text-slate-500">
          Calculate, edit, and forecast interconnection security based on ISO-specific rules and DPP/DISIS schedules
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === t.key
                ? "bg-white border border-b-white border-slate-200 -mb-px text-amber-600"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className="mr-1.5">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════ TAB: CALCULATOR ═══════════════════════ */}
      {activeTab === "calculator" && (
        <>
          {/* ISO Selection */}
          <div className="mb-6 flex flex-wrap gap-2">
            {isoRules.map((r) => {
              const c = ISO_COLORS[r.iso];
              return (
                <button key={r.iso} onClick={() => { setSelectedISO(r.iso); setCurrentPhaseIdx(0); }}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${selectedISO === r.iso ? `${c.accent} text-white shadow-md` : `${c.bg} ${c.text} ${c.border} border hover:shadow-sm`}`}>
                  {r.iso}
                </button>
              );
            })}
          </div>

          {/* ISO Banner */}
          <div className={`mb-6 rounded-xl ${colors.bg} ${colors.border} border p-5`}>
            <h2 className={`text-lg font-bold ${colors.text}`}>{rule.fullName}</h2>
            <p className="text-sm text-slate-600 mt-0.5">{rule.processName}</p>
            <p className="mt-2 text-sm text-slate-600">{rule.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Inputs */}
            <div className="space-y-6">
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
                      {rule.phases.map((p, i) => (<option key={i} value={i}>{p.phase}</option>))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="space-y-3">
                <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
                  <p className="text-xs font-medium text-slate-500 uppercase">Security Required (Posted)</p>
                  <p className="text-2xl font-bold text-emerald-600">{fmt(totalPosted)}</p>
                </div>
                <div className="rounded-xl bg-red-50 p-4 shadow-sm border border-red-200">
                  <p className="text-xs font-medium text-red-600 uppercase">Security At Risk</p>
                  <p className="text-2xl font-bold text-red-700">{fmt(totalAtRisk)}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4 shadow-sm border border-amber-200">
                  <p className="text-xs font-medium text-amber-600 uppercase">Future Required</p>
                  <p className="text-2xl font-bold text-amber-700">{fmt(futureRequired)}</p>
                </div>
              </div>
            </div>

            {/* RIGHT: Timeline + Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Phase Timeline */}
              <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{rule.processName} — Phase Timeline</h3>
                  <button onClick={() => setEditingRules(!editingRules)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${editingRules ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {editingRules ? "✓ Done Editing" : "✏️ Edit Rules"}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  {editingRules ? "Adjust % security required and % at risk for each phase" : "Security requirements and estimated dates based on queue entry"}
                </p>

                {/* Visual Timeline Bar */}
                <div className="relative mb-8">
                  <div className="absolute top-4 left-4 right-4 h-1 bg-slate-200 rounded-full" />
                  <div className={`absolute top-4 left-4 h-1 rounded-full transition-all duration-500 ${colors.accent}`}
                    style={{ width: `${Math.min(((currentPhaseIdx + 1) / rule.phases.length) * 100, 100)}%`, maxWidth: "calc(100% - 32px)" }} />
                  <div className="flex justify-between relative">
                    {phaseCalcs.map((p, i) => (
                      <div key={i} className="flex flex-col items-center" style={{ width: `${100 / rule.phases.length}%` }}>
                        <button onClick={() => setCurrentPhaseIdx(i)}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all z-10 ${
                            p.isPast ? `${colors.accent} text-white border-transparent` :
                            p.isCurrent ? `${colors.accent} text-white border-transparent ring-4 ring-opacity-30 ${colors.border}` :
                            "bg-white border-slate-300 text-slate-400"}`}>
                          {p.isPast ? "✓" : i + 1}
                        </button>
                        <p className={`mt-2 text-xs text-center font-medium leading-tight max-w-[80px] ${p.isCurrent ? colors.text : "text-slate-500"}`}>
                          {p.phase.length > 18 ? p.phase.substring(0, 16) + "…" : p.phase}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phase Detail Cards */}
                <div className="space-y-3">
                  {phaseCalcs.map((p, i) => (
                    <div key={i} className={`rounded-lg border p-4 transition-all ${
                      p.isCurrent ? `${colors.bg} ${colors.border} border-2 shadow-sm` :
                      p.isPast ? "bg-slate-50 border-slate-200 opacity-75" :
                      "bg-white border-slate-200"}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            p.isPast || p.isCurrent ? `${colors.accent} text-white` : "bg-slate-200 text-slate-500"}`}>
                            {p.isPast ? "✓" : i + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-800">{p.phase}</h4>
                            <p className="text-xs text-slate-500">{p.description}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-slate-800">{fmt(p.securityRequired)}</p>
                          <div className="flex items-center gap-1.5 justify-end">
                            {p.atRisk && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Risk: {fmt(p.securityAtRisk)}</span>}
                            {p.refundable && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Refundable</span>}
                          </div>
                        </div>
                      </div>

                      {/* Editable Rule Percentages */}
                      {editingRules && (rule.phases[i].calcMethod === "pct_upgrade" || rule.phases[i].calcMethod === "pct_total" || rule.phases[i].calcMethod === "formula") && (
                        <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-amber-700 mb-1">% Security Required</label>
                              <div className="flex items-center gap-2">
                                <input type="number" min={0} max={100} step={1}
                                  value={rule.phases[i].pctSecurityRequired}
                                  onChange={(e) => updatePhaseRule(selectedISO, i, "pctSecurityRequired", Number(e.target.value))}
                                  className="w-20 rounded border border-amber-300 px-2 py-1.5 text-sm font-bold text-amber-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none" />
                                <span className="text-xs text-amber-600">% of {rule.phases[i].percentageOf === "total_costs" ? "total costs" : "network upgrades"}</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-amber-700 mb-1">% At Risk</label>
                              <div className="flex items-center gap-2">
                                <input type="number" min={0} max={100} step={1}
                                  value={rule.phases[i].pctAtRisk}
                                  onChange={(e) => updatePhaseRule(selectedISO, i, "pctAtRisk", Number(e.target.value))}
                                  className="w-20 rounded border border-amber-300 px-2 py-1.5 text-sm font-bold text-red-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none" />
                                <span className="text-xs text-amber-600">% of posted security</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Calculation breakdown */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="bg-slate-100 px-2 py-1 rounded font-mono">
                          {p.calcMethod === "fixed" && `Fixed: ${fmtFull(rule.phases[i].fixedAmount || 0)}`}
                          {p.calcMethod === "per_mw" && `$${(rule.phases[i].perMwAmount || 0).toLocaleString()}/MW × ${sizeMw} MW`}
                          {p.calcMethod === "pct_upgrade" && `${p.pctSecurityRequired}% × Network Upgrades (${fmt(networkUpgrades)})`}
                          {p.calcMethod === "pct_total" && `${p.pctSecurityRequired}% × Total (${fmt(networkUpgrades + icFacilities + affectedSystem)})`}
                          {p.calcMethod === "formula" && `MAX($${(rule.phases[i].perMwAmount || 0).toLocaleString()}/MW, ${p.pctSecurityRequired}% upgrades)`}
                        </span>
                        <span>Est: {new Date(p.estimatedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                        <span>Cum Required: {fmt(p.cumulativeRequired)}</span>
                        <span className="text-red-500">Cum At Risk: {fmt(p.cumulativeAtRisk)}</span>
                      </div>

                      {/* Cumulative bar */}
                      <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${p.isPast || p.isCurrent ? colors.accent : "bg-slate-300"}`}
                          style={{ width: `${(p.cumulativeRequired / maxCum) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cross-ISO Comparison */}
              <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Cross-ISO Comparison — {sizeMw} MW Project</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">ISO</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600">Entry</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600">After Studies</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600">At IA</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600">At Risk</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600">Timeline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isoRules.map((r) => {
                        let cumReq = 0;
                        let cumRisk = 0;
                        const calcs = r.phases.map((ph) => {
                          const { required, atRisk: ar } = calculatePhaseSecurity(ph, sizeMw, networkUpgrades, icFacilities, affectedSystem);
                          cumReq += required;
                          cumRisk += ar;
                          return { required, atRisk: ar, cumReq, cumRisk };
                        });
                        const entry = calcs[0]?.required || 0;
                        const afterStudy = calcs.slice(0, Math.min(3, calcs.length)).reduce((s, c) => s + c.required, 0);
                        const c = ISO_COLORS[r.iso];
                        return (
                          <tr key={r.iso} className={selectedISO === r.iso ? `${c.bg}` : "hover:bg-slate-50"}>
                            <td className="px-3 py-2.5"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>{r.iso}</span></td>
                            <td className="px-3 py-2.5 text-right font-medium text-slate-700">{fmt(entry)}</td>
                            <td className="px-3 py-2.5 text-right font-medium text-amber-600">{fmt(afterStudy)}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-slate-800">{fmt(cumReq)}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-red-600">{fmt(cumRisk)}</td>
                            <td className="px-3 py-2.5 text-right text-slate-500">{r.phases[r.phases.length - 1].cumulativeMonths} mo</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════ TAB: EDIT ISO RULES ═══════════════════════ */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm text-amber-800">
              <strong>Edit Security Rules:</strong> Customize the % security required and % at risk for each phase per ISO.
              For example, if your ISO requires 15% security to enter Phase 2 instead of 10%, update it here.
              Changes apply to all calculations across the tool.
            </p>
          </div>

          {isoRules.map((r) => {
            const c = ISO_COLORS[r.iso];
            return (
              <div key={r.iso} className={`rounded-xl bg-white shadow-sm border ${c.border} overflow-hidden`}>
                <div className={`${c.bg} px-6 py-4 flex items-center justify-between`}>
                  <div>
                    <h3 className={`text-lg font-bold ${c.text}`}>{r.iso} — {r.fullName}</h3>
                    <p className="text-sm text-slate-600">{r.processName}</p>
                  </div>
                  <button onClick={() => resetRules(r.iso)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50">
                    ↺ Reset to Default
                  </button>
                </div>
                <div className="px-6 py-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-2 py-2 text-left font-semibold text-slate-600">Phase</th>
                        <th className="px-2 py-2 text-left font-semibold text-slate-600">Calc Method</th>
                        <th className="px-2 py-2 text-center font-semibold text-slate-600">% Security Required</th>
                        <th className="px-2 py-2 text-center font-semibold text-slate-600">% At Risk</th>
                        <th className="px-2 py-2 text-center font-semibold text-slate-600">At Risk?</th>
                        <th className="px-2 py-2 text-center font-semibold text-slate-600">Refundable?</th>
                        <th className="px-2 py-2 text-right font-semibold text-slate-600">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {r.phases.map((phase, pi) => {
                        const isEditable = phase.calcMethod === "pct_upgrade" || phase.calcMethod === "pct_total" || phase.calcMethod === "formula";
                        return (
                          <tr key={pi} className="hover:bg-slate-50">
                            <td className="px-2 py-2.5">
                              <p className="font-medium text-slate-800">{phase.phase}</p>
                              <p className="text-xs text-slate-400">{phase.description.substring(0, 60)}...</p>
                            </td>
                            <td className="px-2 py-2.5">
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">{phase.calcMethod}</span>
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              {isEditable ? (
                                <input type="number" min={0} max={200} step={1}
                                  value={phase.pctSecurityRequired}
                                  onChange={(e) => updatePhaseRule(r.iso, pi, "pctSecurityRequired", Number(e.target.value))}
                                  className="w-16 rounded border border-slate-300 px-2 py-1 text-sm text-center font-bold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none" />
                              ) : (
                                <span className="text-xs text-slate-400">
                                  {phase.calcMethod === "per_mw" ? `$${(phase.perMwAmount||0).toLocaleString()}/MW` :
                                   phase.calcMethod === "fixed" ? fmtFull(phase.fixedAmount || 0) : "—"}
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              {phase.atRisk ? (
                                <input type="number" min={0} max={100} step={1}
                                  value={phase.pctAtRisk}
                                  onChange={(e) => updatePhaseRule(r.iso, pi, "pctAtRisk", Number(e.target.value))}
                                  className="w-16 rounded border border-red-200 px-2 py-1 text-sm text-center font-bold text-red-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none bg-red-50" />
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              {phase.atRisk ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Yes</span> :
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">No</span>}
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              {phase.refundable ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Yes</span> :
                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">No</span>}
                            </td>
                            <td className="px-2 py-2.5 text-right text-xs text-slate-500">{phase.typicalDurationMonths} mo</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════ TAB: SCHEDULE UPLOAD ═══════════════════════ */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Upload DPP / DISIS Schedule</h3>
            <p className="text-xs text-slate-400 mb-4">
              Upload the ISO-published schedule (CSV format) to automatically update project timelines, security due dates, and at-risk calculations.
              MISO publishes DPP schedules monthly. SPP publishes DISIS schedules regularly.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Area */}
              <div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Select ISO</label>
                  <select value={scheduleUploadISO} onChange={(e) => setScheduleUploadISO(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none">
                    {isoRules.map((r) => <option key={r.iso} value={r.iso}>{r.iso} — {r.processName}</option>)}
                  </select>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-amber-400 transition-colors">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Upload {scheduleUploadISO} {scheduleUploadISO === "MISO" ? "DPP" : scheduleUploadISO === "SPP" ? "DISIS" : "Interconnection"} Schedule
                  </p>
                  <p className="text-xs text-slate-400 mb-4">CSV file with columns: Queue Number, Project Name, Phase, Start Date, End Date, Security Due Date, Size MW, Network Upgrades, Status</p>
                  <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleScheduleUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors">
                    Choose File
                  </button>
                  <button onClick={() => {
                    // Generate mock schedule data
                    const mockSchedule: ScheduleEntry[] = [
                      { queueNumber: "J1234", projectName: "Midwest Wind Farm", phase: "Phase 2 - SIS", phaseStartDate: "2025-03-01", phaseEndDate: "2025-09-15", securityDueDate: "2025-09-30", sizeMw: 350, networkUpgrades: 8200000, status: "Active" },
                      { queueNumber: "J5678", projectName: "Gulf Coast Wind", phase: "Phase 1", phaseStartDate: "2025-01-15", phaseEndDate: "2025-07-30", securityDueDate: "2025-08-15", sizeMw: 450, networkUpgrades: 10500000, status: "Active" },
                      { queueNumber: "J9012", projectName: "Lake Erie Solar", phase: "DPP Entry", phaseStartDate: "2025-06-01", phaseEndDate: "2025-06-30", securityDueDate: "2025-07-15", sizeMw: 180, networkUpgrades: 0, status: "Pending" },
                      { queueNumber: "J3456", projectName: "Iowa Wind Cluster", phase: "Phase 3 - Facilities", phaseStartDate: "2025-02-01", phaseEndDate: "2025-10-30", securityDueDate: "2025-11-15", sizeMw: 500, networkUpgrades: 15000000, status: "Active" },
                      { queueNumber: "J7890", projectName: "Minnesota Solar", phase: "Phase 2 - SIS", phaseStartDate: "2025-04-01", phaseEndDate: "2025-12-15", securityDueDate: "2025-12-30", sizeMw: 275, networkUpgrades: 6000000, status: "Active" },
                      { queueNumber: "J2345", projectName: "Indiana BESS", phase: "Phase 1", phaseStartDate: "2025-05-01", phaseEndDate: "2025-11-30", securityDueDate: "2025-12-15", sizeMw: 200, networkUpgrades: 3500000, status: "Active" },
                    ];
                    setScheduleData(mockSchedule);
                    setUploadStatus(`Loaded ${scheduleUploadISO} sample DPP schedule with ${mockSchedule.length} entries`);
                  }}
                    className="ml-3 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                    Load Sample
                  </button>
                </div>

                {uploadStatus && (
                  <div className={`mt-4 p-3 rounded-lg text-sm ${uploadStatus.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                    {uploadStatus}
                  </div>
                )}

                <div className="mt-4 rounded-lg bg-slate-50 p-4 border border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2">Expected CSV Format</h4>
                  <pre className="text-xs text-slate-500 font-mono overflow-x-auto whitespace-pre">{`Queue Number,Project Name,Phase,Start Date,End Date,Security Due,Size MW,Network Upgrades,Status
J1234,Midwest Wind,Phase 2 - SIS,2025-03-01,2025-09-15,2025-09-30,350,8200000,Active
J5678,Gulf Coast Wind,Phase 1,2025-01-15,2025-07-30,2025-08-15,450,10500000,Active`}</pre>
                </div>
              </div>

              {/* What happens on upload */}
              <div className="space-y-4">
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
                  <h4 className="text-sm font-bold text-blue-800 mb-3">What happens when you upload a schedule?</h4>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex gap-2"><span className="font-bold">1.</span> Phase dates are updated for each matching project (by queue number)</li>
                    <li className="flex gap-2"><span className="font-bold">2.</span> Network upgrade costs are refreshed from the latest schedule</li>
                    <li className="flex gap-2"><span className="font-bold">3.</span> Security required is recalculated using updated costs and ISO rules</li>
                    <li className="flex gap-2"><span className="font-bold">4.</span> Security at risk is recalculated based on current phase and % at risk</li>
                    <li className="flex gap-2"><span className="font-bold">5.</span> Security due dates are set for upcoming milestones</li>
                    <li className="flex gap-2"><span className="font-bold">6.</span> All projects in the portfolio are updated automatically</li>
                  </ul>
                </div>

                <div className="rounded-xl bg-purple-50 border border-purple-200 p-5">
                  <h4 className="text-sm font-bold text-purple-800 mb-2">Supported ISOs for Schedule Upload</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded">MISO</span>
                      <span className="text-sm text-purple-700">DPP Schedule — Published monthly with phase dates and milestone updates</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-1 rounded">SPP</span>
                      <span className="text-sm text-purple-700">DISIS Schedule — Published with cluster study dates and cost allocations</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2 py-1 rounded">CAISO</span>
                      <span className="text-sm text-purple-700">Cluster Study Schedule — Published with Phase I/II study windows</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">PJM</span>
                      <span className="text-sm text-purple-700">Queue Study Schedule — Published with cluster transition updates</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parsed Schedule Table */}
          {scheduleData.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Parsed Schedule — {scheduleUploadISO} {scheduleUploadISO === "MISO" ? "DPP" : "DISIS"}
                  </h3>
                  <p className="text-xs text-slate-400">{scheduleData.length} entries loaded</p>
                </div>
                <button onClick={() => {
                  // Simulate applying schedule to projects
                  setUploadStatus(`Applied ${scheduleData.length} schedule entries to matching projects. Security recalculated.`);
                }}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">
                  ✓ Apply to Projects
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Queue #</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Project</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Phase</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Phase Start</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Phase End</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Security Due</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-600">MW</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-600">Network Upgrades</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-600">Calc Security Req</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scheduleData.map((entry, i) => {
                      const isoRule = isoRules.find((r) => r.iso === scheduleUploadISO);
                      const phaseIdx = isoRule?.phases.findIndex((p) => entry.phase.toLowerCase().includes(p.phase.toLowerCase().split(" ")[0])) ?? 0;
                      const phase = isoRule?.phases[Math.max(phaseIdx, 0)];
                      const calcReq = phase ? calculatePhaseSecurity(phase, entry.sizeMw, entry.networkUpgrades, 0, 0).required : 0;
                      const dueDate = new Date(entry.securityDueDate);
                      const isOverdue = dueDate < new Date();

                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{entry.queueNumber}</td>
                          <td className="px-3 py-2.5 font-medium text-slate-800">{entry.projectName}</td>
                          <td className="px-3 py-2.5"><span className={`text-xs font-medium px-2 py-0.5 rounded ${ISO_COLORS[scheduleUploadISO]?.light} ${ISO_COLORS[scheduleUploadISO]?.text}`}>{entry.phase}</span></td>
                          <td className="px-3 py-2.5 text-xs text-slate-600">{new Date(entry.phaseStartDate).toLocaleDateString()}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-600">{new Date(entry.phaseEndDate).toLocaleDateString()}</td>
                          <td className={`px-3 py-2.5 text-xs font-medium ${isOverdue ? "text-red-600" : "text-slate-600"}`}>
                            {dueDate.toLocaleDateString()}
                            {isOverdue && <span className="ml-1 text-red-500">⚠️</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-800">{entry.sizeMw}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">{fmt(entry.networkUpgrades)}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-amber-600">{fmt(calcReq)}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${entry.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{entry.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ TAB: PORTFOLIO SECURITY ═══════════════════════ */}
      {activeTab === "portfolio" && (
        <div className="space-y-6">
          {/* Portfolio Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase">Total Projects</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{portfolioCalcs.length}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase">Total Security Required</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{fmt(portfolioCalcs.reduce((s, p) => s + p.securityRequired, 0))}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-5 shadow-sm border border-red-200">
              <p className="text-xs font-medium text-red-600 uppercase">Total At Risk</p>
              <p className="mt-2 text-3xl font-bold text-red-700">{fmt(portfolioCalcs.reduce((s, p) => s + p.securityAtRisk, 0))}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-5 shadow-sm border border-amber-200">
              <p className="text-xs font-medium text-amber-600 uppercase">Future Required</p>
              <p className="mt-2 text-3xl font-bold text-amber-700">{fmt(portfolioCalcs.reduce((s, p) => s + p.futureRequired, 0))}</p>
            </div>
          </div>

          {/* Portfolio Table */}
          <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">All Projects — Calculated Security</h3>
              <p className="text-xs text-slate-400">Based on current ISO rules, project parameters, and phase progression</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Project</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">ISO</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-slate-600">MW</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-slate-600">Network Upgrades</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Current Phase</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-slate-600">Security Required</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-slate-600">At Risk</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-slate-600">Future Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {portfolioCalcs.map((proj) => {
                    const c = ISO_COLORS[proj.iso];
                    const projRule = isoRules.find((r) => r.iso === proj.iso);
                    const currentPhaseName = projRule?.phases[proj.currentPhase]?.phase || "Unknown";
                    return (
                      <tr key={proj.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-slate-900">{proj.name}</p>
                          <p className="text-xs text-slate-400">{proj.queueNumber}</p>
                        </td>
                        <td className="px-3 py-2.5"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c?.bg} ${c?.text}`}>{proj.iso}</span></td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-800">{proj.sizeMw}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{fmt(proj.networkUpgrades)}</td>
                        <td className="px-3 py-2.5"><span className="text-xs font-medium">{currentPhaseName}</span></td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-600">{fmt(proj.securityRequired)}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-red-600">{fmt(proj.securityAtRisk)}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-amber-600">{fmt(proj.futureRequired)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                    <td className="px-3 py-2.5 text-slate-700">Portfolio Total</td>
                    <td className="px-3 py-2.5 text-slate-500">{portfolioCalcs.length} projects</td>
                    <td className="px-3 py-2.5 text-right text-slate-800">{portfolioCalcs.reduce((s, p) => s + p.sizeMw, 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">{fmt(portfolioCalcs.reduce((s, p) => s + p.networkUpgrades, 0))}</td>
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5 text-right text-emerald-700">{fmt(portfolioCalcs.reduce((s, p) => s + p.securityRequired, 0))}</td>
                    <td className="px-3 py-2.5 text-right text-red-700">{fmt(portfolioCalcs.reduce((s, p) => s + p.securityAtRisk, 0))}</td>
                    <td className="px-3 py-2.5 text-right text-amber-700">{fmt(portfolioCalcs.reduce((s, p) => s + p.futureRequired, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Security by ISO breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(
              portfolioCalcs.reduce<Record<string, { count: number; required: number; atRisk: number; future: number; mw: number }>>((acc, p) => {
                if (!acc[p.iso]) acc[p.iso] = { count: 0, required: 0, atRisk: 0, future: 0, mw: 0 };
                acc[p.iso].count++;
                acc[p.iso].required += p.securityRequired;
                acc[p.iso].atRisk += p.securityAtRisk;
                acc[p.iso].future += p.futureRequired;
                acc[p.iso].mw += p.sizeMw;
                return acc;
              }, {})
            ).sort((a, b) => b[1].required - a[1].required).map(([iso, data]) => {
              const c = ISO_COLORS[iso];
              return (
                <div key={iso} className={`rounded-xl ${c?.bg} border ${c?.border} p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-lg font-bold ${c?.text}`}>{iso}</h4>
                    <span className="text-xs text-slate-500">{data.count} projects · {data.mw.toLocaleString()} MW</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Required</p>
                      <p className="text-lg font-bold text-emerald-600">{fmt(data.required)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">At Risk</p>
                      <p className="text-lg font-bold text-red-600">{fmt(data.atRisk)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Future</p>
                      <p className="text-lg font-bold text-amber-600">{fmt(data.future)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
