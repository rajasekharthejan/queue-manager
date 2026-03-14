"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Milestone {
  date: string;
  milestone_name: string;
  amount: number;
  type: string;
  at_risk: boolean;
  refundable: boolean;
}

interface Forecast {
  project_id: number;
  project_name: string;
  iso_region: string;
  fuel_type: string;
  size_mw: number;
  target_date: string;
  total_security_posted: number;
  security_at_risk: number;
  deposits_posted: number;
  refundable_amount: number;
  non_refundable_at_risk: number;
  sunk_cost: number;
  next_milestone: Milestone | null;
  upcoming_milestones: Milestone[];
  milestones_completed: number;
  milestones_remaining: number;
  planned_cod: string;
  interconnection_status: string;
}

interface Summary {
  target_date: string;
  total_projects: number;
  total_security_at_risk: number;
  total_security_posted: number;
  total_refundable: number;
  total_non_refundable_at_risk: number;
  by_iso: Record<string, Forecast[]>;
}

const ISO_COLORS: Record<string, string> = {
  PJM: "bg-blue-100 text-blue-800 border-blue-200",
  MISO: "bg-green-100 text-green-800 border-green-200",
  SPP: "bg-purple-100 text-purple-800 border-purple-200",
  CAISO: "bg-orange-100 text-orange-800 border-orange-200",
  NYISO: "bg-pink-100 text-pink-800 border-pink-200",
  ERCOT: "bg-red-100 text-red-800 border-red-200",
  "ISO-NE": "bg-cyan-100 text-cyan-800 border-cyan-200",
};

// Mock forecast data for when API is unavailable
function generateMockForecasts(date: string): { summary: Summary; forecasts: Forecast[] } {
  const mockForecasts: Forecast[] = [
    { project_id: 1, project_name: "Manor Solar v2", iso_region: "NYISO", fuel_type: "Solar", size_mw: 200, target_date: date, total_security_posted: 500000, security_at_risk: 200000, deposits_posted: 80000, refundable_amount: 300000, non_refundable_at_risk: 200000, sunk_cost: 120000, next_milestone: { date: "2025-06-15", milestone_name: "Phase 2 Security Posting", amount: 300000, type: "security", at_risk: true, refundable: true }, upcoming_milestones: [], milestones_completed: 2, milestones_remaining: 4, planned_cod: "2026-11-01", interconnection_status: "Feasibility Study" },
    { project_id: 2, project_name: "Midwest Wind Farm", iso_region: "MISO", fuel_type: "Wind", size_mw: 350, target_date: date, total_security_posted: 2100000, security_at_risk: 1400000, deposits_posted: 250000, refundable_amount: 700000, non_refundable_at_risk: 1400000, sunk_cost: 380000, next_milestone: { date: "2025-09-01", milestone_name: "DPP Phase 2 Entry", amount: 1850000, type: "security", at_risk: true, refundable: false }, upcoming_milestones: [], milestones_completed: 3, milestones_remaining: 3, planned_cod: "2027-06-01", interconnection_status: "System Impact Study" },
    { project_id: 3, project_name: "PJM Solar Hub", iso_region: "PJM", fuel_type: "Solar + Storage", size_mw: 200, target_date: date, total_security_posted: 3500000, security_at_risk: 2800000, deposits_posted: 400000, refundable_amount: 700000, non_refundable_at_risk: 2800000, sunk_cost: 550000, next_milestone: { date: "2025-08-01", milestone_name: "Facilities Study Deposit", amount: 2400000, type: "security", at_risk: true, refundable: false }, upcoming_milestones: [], milestones_completed: 4, milestones_remaining: 2, planned_cod: "2027-03-01", interconnection_status: "Facilities Study" },
    { project_id: 4, project_name: "Desert Sun BESS", iso_region: "CAISO", fuel_type: "Battery Storage", size_mw: 400, target_date: date, total_security_posted: 4200000, security_at_risk: 3000000, deposits_posted: 500000, refundable_amount: 1200000, non_refundable_at_risk: 3000000, sunk_cost: 720000, next_milestone: { date: "2025-12-01", milestone_name: "Cluster Phase 2 Security", amount: 3300000, type: "security", at_risk: true, refundable: false }, upcoming_milestones: [], milestones_completed: 3, milestones_remaining: 3, planned_cod: "2028-01-01", interconnection_status: "System Impact Study" },
    { project_id: 5, project_name: "Prairie Wind SPP", iso_region: "SPP", fuel_type: "Wind", size_mw: 300, target_date: date, total_security_posted: 900000, security_at_risk: 500000, deposits_posted: 120000, refundable_amount: 400000, non_refundable_at_risk: 500000, sunk_cost: 180000, next_milestone: { date: "2025-07-15", milestone_name: "DISIS Facilities Study", amount: 1200000, type: "security", at_risk: true, refundable: true }, upcoming_milestones: [], milestones_completed: 1, milestones_remaining: 5, planned_cod: "2028-06-01", interconnection_status: "Feasibility Study" },
    { project_id: 6, project_name: "Texas Solar Ranch", iso_region: "ERCOT", fuel_type: "Solar", size_mw: 500, target_date: date, total_security_posted: 6000000, security_at_risk: 5200000, deposits_posted: 350000, refundable_amount: 800000, non_refundable_at_risk: 5200000, sunk_cost: 900000, next_milestone: { date: "2025-04-01", milestone_name: "IA Execution Security", amount: 4000000, type: "security", at_risk: false, refundable: false }, upcoming_milestones: [], milestones_completed: 5, milestones_remaining: 1, planned_cod: "2026-09-01", interconnection_status: "IA Negotiation" },
    { project_id: 7, project_name: "Appalachian Wind", iso_region: "PJM", fuel_type: "Wind", size_mw: 275, target_date: date, total_security_posted: 400000, security_at_risk: 150000, deposits_posted: 60000, refundable_amount: 250000, non_refundable_at_risk: 150000, sunk_cost: 95000, next_milestone: { date: "2025-10-01", milestone_name: "SIS Deposit", amount: 500000, type: "deposit", at_risk: false, refundable: true }, upcoming_milestones: [], milestones_completed: 1, milestones_remaining: 5, planned_cod: "2029-03-01", interconnection_status: "Feasibility Study" },
    { project_id: 8, project_name: "Nevada BESS", iso_region: "CAISO", fuel_type: "Battery Storage", size_mw: 250, target_date: date, total_security_posted: 2800000, security_at_risk: 2200000, deposits_posted: 300000, refundable_amount: 600000, non_refundable_at_risk: 2200000, sunk_cost: 420000, next_milestone: { date: "2025-11-01", milestone_name: "GIA Tendering Security", amount: 2000000, type: "security", at_risk: true, refundable: false }, upcoming_milestones: [], milestones_completed: 4, milestones_remaining: 2, planned_cod: "2027-09-01", interconnection_status: "Facilities Study" },
    { project_id: 9, project_name: "Gulf Coast Wind", iso_region: "MISO", fuel_type: "Wind", size_mw: 450, target_date: date, total_security_posted: 1500000, security_at_risk: 1000000, deposits_posted: 200000, refundable_amount: 500000, non_refundable_at_risk: 1000000, sunk_cost: 310000, next_milestone: { date: "2025-08-15", milestone_name: "DPP Phase 2 Deposit", amount: 2800000, type: "security", at_risk: true, refundable: false }, upcoming_milestones: [], milestones_completed: 2, milestones_remaining: 4, planned_cod: "2028-09-01", interconnection_status: "System Impact Study" },
    { project_id: 10, project_name: "Carolina Hybrid", iso_region: "PJM", fuel_type: "Solar + Storage", size_mw: 320, target_date: date, total_security_posted: 1800000, security_at_risk: 1200000, deposits_posted: 280000, refundable_amount: 600000, non_refundable_at_risk: 1200000, sunk_cost: 350000, next_milestone: { date: "2025-09-15", milestone_name: "SIS Security Posting", amount: 1600000, type: "security", at_risk: true, refundable: false }, upcoming_milestones: [], milestones_completed: 2, milestones_remaining: 4, planned_cod: "2028-03-01", interconnection_status: "System Impact Study" },
    { project_id: 11, project_name: "Kansas Wind Farm", iso_region: "SPP", fuel_type: "Wind", size_mw: 400, target_date: date, total_security_posted: 7500000, security_at_risk: 6800000, deposits_posted: 400000, refundable_amount: 700000, non_refundable_at_risk: 6800000, sunk_cost: 1200000, next_milestone: null, upcoming_milestones: [], milestones_completed: 6, milestones_remaining: 0, planned_cod: "2026-12-01", interconnection_status: "IA Executed" },
    { project_id: 12, project_name: "New England Solar", iso_region: "ISO-NE", fuel_type: "Solar", size_mw: 120, target_date: date, total_security_posted: 1200000, security_at_risk: 900000, deposits_posted: 150000, refundable_amount: 300000, non_refundable_at_risk: 900000, sunk_cost: 210000, next_milestone: { date: "2025-07-01", milestone_name: "Cluster Facilities Security", amount: 800000, type: "security", at_risk: true, refundable: false }, upcoming_milestones: [], milestones_completed: 3, milestones_remaining: 3, planned_cod: "2027-06-01", interconnection_status: "Facilities Study" },
  ];

  const by_iso = mockForecasts.reduce<Record<string, Forecast[]>>((acc, f) => {
    (acc[f.iso_region] = acc[f.iso_region] || []).push(f);
    return acc;
  }, {});

  const summary: Summary = {
    target_date: date,
    total_projects: mockForecasts.length,
    total_security_at_risk: mockForecasts.reduce((s, f) => s + f.security_at_risk, 0),
    total_security_posted: mockForecasts.reduce((s, f) => s + f.total_security_posted, 0),
    total_refundable: mockForecasts.reduce((s, f) => s + f.refundable_amount, 0),
    total_non_refundable_at_risk: mockForecasts.reduce((s, f) => s + f.non_refundable_at_risk, 0),
    by_iso,
  };

  return { summary, forecasts: mockForecasts };
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

function formatShort(val: number) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

export default function SecurityForecastPage() {
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareDate, setCompareDate] = useState("");
  const [compareForecasts, setCompareForecasts] = useState<Forecast[] | null>(null);
  const [compareSummary, setCompareSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetchForecast(targetDate);
  }, [targetDate]);

  useEffect(() => {
    if (compareDate) {
      fetchCompareForecast(compareDate);
    } else {
      setCompareForecasts(null);
      setCompareSummary(null);
    }
  }, [compareDate]);

  async function fetchForecast(date: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/security-forecast?date=${date}`);
      if (!res.ok) throw new Error("API unavailable");
      const data = await res.json();
      if (data.forecasts && data.forecasts.length > 0) {
        setSummary(data.summary);
        setForecasts(data.forecasts);
      } else {
        const mock = generateMockForecasts(date);
        setSummary(mock.summary);
        setForecasts(mock.forecasts);
      }
    } catch {
      const mock = generateMockForecasts(date);
      setSummary(mock.summary);
      setForecasts(mock.forecasts);
    }
    setLoading(false);
  }

  async function fetchCompareForecast(date: string) {
    try {
      const res = await fetch(`/api/projects/security-forecast?date=${date}`);
      if (!res.ok) throw new Error("API unavailable");
      const data = await res.json();
      if (data.forecasts && data.forecasts.length > 0) {
        setCompareSummary(data.summary);
        setCompareForecasts(data.forecasts);
      } else {
        const mock = generateMockForecasts(date);
        setCompareSummary(mock.summary);
        setCompareForecasts(mock.forecasts);
      }
    } catch {
      const mock = generateMockForecasts(date);
      setCompareSummary(mock.summary);
      setCompareForecasts(mock.forecasts);
    }
  }

  const quickDates = [
    { label: "Today", date: new Date().toISOString().split("T")[0] },
    { label: "+30 Days", date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0] },
    { label: "+90 Days", date: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0] },
    { label: "+6 Months", date: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0] },
    { label: "+1 Year", date: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0] },
    { label: "+2 Years", date: new Date(Date.now() + 730 * 86400000).toISOString().split("T")[0] },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back to Dashboard</Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Security at Risk Forecast</h1>
        <p className="mt-1 text-sm text-slate-500">
          Estimate total security exposure across your portfolio at any point in time. Based on BPM-15 and ISO milestone schedules.
        </p>
      </div>

      {/* Date Selection */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-end gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Forecast Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Quick Select
            </label>
            <div className="flex flex-wrap gap-2">
              {quickDates.map((qd) => (
                <button
                  key={qd.label}
                  onClick={() => setTargetDate(qd.date)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    targetDate === qd.date
                      ? "bg-amber-500 text-slate-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {qd.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Compare With (Optional)
            </label>
            <input
              type="date"
              value={compareDate}
              onChange={(e) => setCompareDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
        </div>
      ) : summary && (
        <>
          {/* Summary Cards */}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase">Total Security Posted</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{formatShort(summary.total_security_posted)}</p>
              {compareSummary && (
                <p className={`mt-1 text-sm font-medium ${compareSummary.total_security_posted > summary.total_security_posted ? "text-red-500" : "text-emerald-500"}`}>
                  {compareSummary.total_security_posted > summary.total_security_posted ? "+" : ""}{formatShort(compareSummary.total_security_posted - summary.total_security_posted)} by compare date
                </p>
              )}
              <p className="mt-1 text-xs text-slate-400">As of {new Date(targetDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-5 shadow-sm border border-red-200">
              <p className="text-xs font-medium text-red-600 uppercase">Security at Risk</p>
              <p className="mt-2 text-3xl font-bold text-red-700">{formatShort(summary.total_security_at_risk)}</p>
              {compareSummary && (
                <p className={`mt-1 text-sm font-medium ${compareSummary.total_security_at_risk > summary.total_security_at_risk ? "text-red-500" : "text-emerald-500"}`}>
                  {compareSummary.total_security_at_risk > summary.total_security_at_risk ? "+" : ""}{formatShort(compareSummary.total_security_at_risk - summary.total_security_at_risk)} by compare date
                </p>
              )}
              <p className="mt-1 text-xs text-red-400">Non-refundable exposure</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase">Refundable</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{formatShort(summary.total_refundable)}</p>
              <p className="mt-1 text-xs text-slate-400">Recoverable deposits</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase">Non-Refundable at Risk</p>
              <p className="mt-2 text-3xl font-bold text-orange-600">{formatShort(summary.total_non_refundable_at_risk)}</p>
              <p className="mt-1 text-xs text-slate-400">Potential loss if withdrawn</p>
            </div>
          </div>

          {/* ISO Breakdown */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Exposure by ISO Region</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(summary.by_iso || {}).map(([iso, isoForecasts]) => {
                const isoTotal = (isoForecasts as Forecast[]).reduce((s, f) => s + f.security_at_risk, 0);
                const isoPosted = (isoForecasts as Forecast[]).reduce((s, f) => s + f.total_security_posted, 0);
                return (
                  <div key={iso} className={`rounded-xl p-5 border ${ISO_COLORS[iso] || "bg-gray-50 border-gray-200"}`}>
                    <p className="text-sm font-bold">{iso}</p>
                    <p className="text-xs mt-0.5">{(isoForecasts as Forecast[]).length} project(s)</p>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Posted:</span>
                        <span className="font-semibold">{formatShort(isoPosted)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>At Risk:</span>
                        <span className="font-semibold">{formatShort(isoTotal)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-Project Detail Table */}
          <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Project-Level Security Forecast</h2>
              <p className="text-xs text-slate-400 mt-0.5">Security exposure by project as of {new Date(targetDate).toLocaleDateString()}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Project</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">ISO</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Security Posted</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">At Risk</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Refundable</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Next Milestone</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600">Progress</th>
                    {compareForecasts && <th className="px-4 py-3 text-right font-semibold text-slate-600">Compare At Risk</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {forecasts.map((f) => {
                    const compareForecast = compareForecasts?.find((cf) => cf.project_id === f.project_id);
                    return (
                      <tr key={f.project_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link href={`/projects/${f.project_id}`} className="font-medium text-slate-900 hover:text-amber-600">
                            {f.project_name}
                          </Link>
                          <p className="text-xs text-slate-400">{f.fuel_type} - {f.size_mw} MW</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ISO_COLORS[f.iso_region]?.replace("border-", "") || "bg-gray-100 text-gray-800"}`}>
                            {f.iso_region}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatCurrency(f.total_security_posted)}</td>
                        <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(f.security_at_risk)}</td>
                        <td className="px-4 py-3 text-right font-medium text-blue-600">{formatCurrency(f.refundable_amount)}</td>
                        <td className="px-4 py-3">
                          {f.next_milestone ? (
                            <div>
                              <p className="text-sm text-slate-700">{f.next_milestone.milestone_name}</p>
                              <p className="text-xs text-slate-400">
                                {new Date(f.next_milestone.date).toLocaleDateString()} - {formatCurrency(f.next_milestone.amount)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">All milestones passed</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="h-2 w-16 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-500"
                                style={{
                                  width: `${
                                    f.milestones_completed + f.milestones_remaining > 0
                                      ? (f.milestones_completed / (f.milestones_completed + f.milestones_remaining)) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{f.milestones_completed}/{f.milestones_completed + f.milestones_remaining}</span>
                          </div>
                        </td>
                        {compareForecasts && (
                          <td className="px-4 py-3 text-right">
                            {compareForecast ? (
                              <div>
                                <p className="font-medium text-red-600">{formatCurrency(compareForecast.security_at_risk)}</p>
                                {compareForecast.security_at_risk !== f.security_at_risk && (
                                  <p className={`text-xs ${compareForecast.security_at_risk > f.security_at_risk ? "text-red-500" : "text-green-500"}`}>
                                    {compareForecast.security_at_risk > f.security_at_risk ? "+" : ""}{formatCurrency(compareForecast.security_at_risk - f.security_at_risk)}
                                  </p>
                                )}
                              </div>
                            ) : "-"}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                    <td className="px-4 py-3 text-slate-700">Portfolio Total</td>
                    <td className="px-4 py-3">{forecasts.length} projects</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(summary.total_security_posted)}</td>
                    <td className="px-4 py-3 text-right text-red-700">{formatCurrency(summary.total_security_at_risk)}</td>
                    <td className="px-4 py-3 text-right text-blue-700">{formatCurrency(summary.total_refundable)}</td>
                    <td colSpan={2} />
                    {compareForecasts && compareSummary && (
                      <td className="px-4 py-3 text-right text-red-700">{formatCurrency(compareSummary.total_security_at_risk)}</td>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
