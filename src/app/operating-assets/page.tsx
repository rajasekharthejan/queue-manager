"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface OperatingAsset {
  id: number;
  name: string;
  iso: string;
  fuelType: string;
  mw: number;
  capacityFactor: number;
  codDate: string;
  state: string;
  utility: string;
  status: "Operating" | "Scheduled Maintenance";
}

// ─── Mock Operating Assets ──────────────────────────────────────────────────────
const OPERATING_ASSETS: OperatingAsset[] = [
  { id: 101, name: "Sunrise Solar Park", iso: "CAISO", fuelType: "Solar", mw: 350, capacityFactor: 0.28, codDate: "2024-03-15", state: "AZ", utility: "APS", status: "Operating" },
  { id: 102, name: "Prairie Thunder Wind", iso: "SPP", fuelType: "Wind", mw: 400, capacityFactor: 0.42, codDate: "2023-09-01", state: "KS", utility: "Evergy", status: "Operating" },
  { id: 103, name: "Great Plains Storage", iso: "MISO", fuelType: "Battery Storage", mw: 200, capacityFactor: 0.85, codDate: "2024-06-01", state: "IL", utility: "Ameren", status: "Scheduled Maintenance" },
  { id: 104, name: "Atlantic Breeze Wind", iso: "PJM", fuelType: "Wind", mw: 300, capacityFactor: 0.38, codDate: "2022-11-15", state: "WV", utility: "AEP", status: "Operating" },
  { id: 105, name: "Lone Star Solar", iso: "ERCOT", fuelType: "Solar", mw: 500, capacityFactor: 0.26, codDate: "2023-12-01", state: "TX", utility: "Oncor", status: "Operating" },
  { id: 106, name: "Hudson Valley Solar", iso: "NYISO", fuelType: "Solar + Storage", mw: 180, capacityFactor: 0.31, codDate: "2024-01-15", state: "NY", utility: "ConEd", status: "Operating" },
];

// ─── ISO Color Coding ───────────────────────────────────────────────────────────
const ISO_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  PJM:      { bg: "bg-blue-100", text: "text-blue-800", bar: "bg-blue-500" },
  MISO:     { bg: "bg-green-100", text: "text-green-800", bar: "bg-green-500" },
  SPP:      { bg: "bg-purple-100", text: "text-purple-800", bar: "bg-purple-500" },
  CAISO:    { bg: "bg-orange-100", text: "text-orange-800", bar: "bg-orange-500" },
  NYISO:    { bg: "bg-pink-100", text: "text-pink-800", bar: "bg-pink-500" },
  "ISO-NE": { bg: "bg-cyan-100", text: "text-cyan-800", bar: "bg-cyan-500" },
  ERCOT:    { bg: "bg-red-100", text: "text-red-800", bar: "bg-red-500" },
};

const FUEL_ICONS: Record<string, string> = {
  Solar: "\u2600",
  Wind: "\u2601",
  "Battery Storage": "\u26A1",
  "Solar + Storage": "\u2600\u26A1",
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
function yearsOperating(codDate: string): number {
  const cod = new Date(codDate);
  const now = new Date();
  return Math.round(((now.getTime() - cod.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10;
}

function annualGeneration(mw: number, cf: number): number {
  return Math.round(mw * cf * 8760);
}

function formatNumber(val: number): string {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return val.toLocaleString();
}

// ─── Component ──────────────────────────────────────────────────────────────────
export default function OperatingAssetsPage() {
  const [filterISO, setFilterISO] = useState("");
  const [filterFuel, setFilterFuel] = useState("");

  const filtered = OPERATING_ASSETS.filter((a) => {
    if (filterISO && a.iso !== filterISO) return false;
    if (filterFuel && a.fuelType !== filterFuel) return false;
    return true;
  });

  // ── KPI Calculations ───────────────────────────────────────────────────────
  const totalMW = filtered.reduce((s, a) => s + a.mw, 0);
  const avgCF = filtered.length > 0
    ? filtered.reduce((s, a) => s + a.capacityFactor, 0) / filtered.length
    : 0;
  const totalAnnualGen = filtered.reduce((s, a) => s + annualGeneration(a.mw, a.capacityFactor), 0);

  // ── Fuel Type Aggregation ─────────────────────────────────────────────────
  const fuelAgg: Record<string, { mw: number; gen: number }> = {};
  filtered.forEach((a) => {
    if (!fuelAgg[a.fuelType]) fuelAgg[a.fuelType] = { mw: 0, gen: 0 };
    fuelAgg[a.fuelType].mw += a.mw;
    fuelAgg[a.fuelType].gen += annualGeneration(a.mw, a.capacityFactor);
  });
  const fuelData = Object.entries(fuelAgg)
    .map(([fuel, d]) => ({ label: fuel, mw: d.mw, gen: d.gen }))
    .sort((a, b) => b.mw - a.mw);

  // ── ISO Generation Aggregation ────────────────────────────────────────────
  const isoAgg: Record<string, number> = {};
  filtered.forEach((a) => {
    isoAgg[a.iso] = (isoAgg[a.iso] || 0) + annualGeneration(a.mw, a.capacityFactor);
  });
  const isoGenData = Object.entries(isoAgg)
    .map(([iso, gen]) => ({ label: iso, value: gen }))
    .sort((a, b) => b.value - a.value);

  const FUEL_BAR_COLORS: Record<string, string> = {
    Solar: "bg-amber-400",
    Wind: "bg-sky-400",
    "Battery Storage": "bg-emerald-400",
    "Solar + Storage": "bg-orange-400",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-6"
      >
        &larr; Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Operating Assets</h1>
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Post-COD Portfolio
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Projects that have achieved Commercial Operation Date and are generating power
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-emerald-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Operating MW</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{totalMW.toLocaleString()}</p>
          <p className="mt-1 text-sm text-slate-500">Nameplate capacity</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-emerald-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Operating Assets</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{filtered.length}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(
              filtered.reduce<Record<string, number>>((acc, a) => {
                acc[a.iso] = (acc[a.iso] || 0) + 1;
                return acc;
              }, {})
            ).map(([iso, count]) => (
              <span
                key={iso}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ISO_COLORS[iso]?.bg || "bg-gray-100"} ${ISO_COLORS[iso]?.text || "text-gray-800"}`}
              >
                {iso}: {count}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-emerald-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Capacity Factor</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{(avgCF * 100).toFixed(1)}%</p>
          <p className="mt-1 text-sm text-slate-500">Weighted across assets</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-emerald-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Est. Annual Generation</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{formatNumber(totalAnnualGen)}</p>
          <p className="mt-1 text-sm text-slate-500">MWh per year</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <select
          value={filterISO}
          onChange={(e) => setFilterISO(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All ISOs</option>
          {["PJM", "MISO", "SPP", "CAISO", "NYISO", "ISO-NE", "ERCOT"].map((iso) => (
            <option key={iso} value={iso}>{iso}</option>
          ))}
        </select>
        <select
          value={filterFuel}
          onChange={(e) => setFilterFuel(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Fuel Types</option>
          {["Solar", "Wind", "Battery Storage", "Solar + Storage"].map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Asset Performance Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-slate-200 mb-8">
        <div className="border-b border-slate-200 bg-emerald-50 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Asset Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Asset Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">ISO</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Fuel Type</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">MW</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Capacity Factor</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">COD Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">State</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Utility</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Years Operating</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Annual Gen (MWh)</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((asset) => {
                const yrsOp = yearsOperating(asset.codDate);
                const annGen = annualGeneration(asset.mw, asset.capacityFactor);
                return (
                  <tr key={asset.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/projects/${asset.id}`}
                          className="font-medium text-slate-900 hover:text-emerald-600 transition-colors"
                        >
                          {asset.name}
                        </Link>
                        <span className="inline-flex items-center gap-1 w-fit rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          &larr; Converted from Queue
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ISO_COLORS[asset.iso]?.bg || "bg-gray-100"} ${ISO_COLORS[asset.iso]?.text || "text-gray-800"}`}
                      >
                        {asset.iso}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{FUEL_ICONS[asset.fuelType] || "\u26A0"}</span>
                        <span className="text-slate-700">{asset.fuelType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {asset.mw.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${asset.capacityFactor * 100}%` }}
                          />
                        </div>
                        <span className="font-medium text-slate-900">
                          {(asset.capacityFactor * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(asset.codDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{asset.state}</td>
                    <td className="px-4 py-3 text-slate-600">{asset.utility}</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {yrsOp.toFixed(1)} yr{yrsOp !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {annGen.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {asset.status === "Operating" ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          Operating
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          Scheduled Maintenance
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row: Performance by Fuel Type + Generation by ISO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Fuel Type */}
        <div className="rounded-xl bg-white shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 bg-emerald-50 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Performance by Fuel Type</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Capacity (MW)</p>
              <div className="space-y-2.5">
                {fuelData.map((d) => {
                  const maxMW = Math.max(...fuelData.map((f) => f.mw), 1);
                  return (
                    <div key={d.label} className="flex items-center gap-3">
                      <span className="w-32 text-xs font-medium text-slate-600 text-right truncate">{d.label}</span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${FUEL_BAR_COLORS[d.label] || "bg-gray-400"}`}
                          style={{ width: `${Math.max((d.mw / maxMW) * 100, 2)}%` }}
                        />
                      </div>
                      <span className="w-20 text-xs font-bold text-slate-800 text-right">{d.mw.toLocaleString()} MW</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Annual Generation (MWh)</p>
              <div className="space-y-2.5">
                {fuelData.map((d) => {
                  const maxGen = Math.max(...fuelData.map((f) => f.gen), 1);
                  return (
                    <div key={d.label} className="flex items-center gap-3">
                      <span className="w-32 text-xs font-medium text-slate-600 text-right truncate">{d.label}</span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${FUEL_BAR_COLORS[d.label] || "bg-gray-400"}`}
                          style={{ width: `${Math.max((d.gen / maxGen) * 100, 2)}%` }}
                        />
                      </div>
                      <span className="w-24 text-xs font-bold text-slate-800 text-right">{formatNumber(d.gen)} MWh</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Generation by ISO */}
        <div className="rounded-xl bg-white shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 bg-emerald-50 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Generation by ISO</h2>
          </div>
          <div className="p-6">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Annual Generation (MWh)</p>
            <div className="space-y-2.5">
              {isoGenData.map((d) => {
                const maxGen = Math.max(...isoGenData.map((g) => g.value), 1);
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="w-20 text-xs font-medium text-slate-600 text-right">{d.label}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${ISO_COLORS[d.label]?.bar || "bg-gray-400"}`}
                        style={{ width: `${Math.max((d.value / maxGen) * 100, 2)}%` }}
                      />
                    </div>
                    <span className="w-24 text-xs font-bold text-slate-800 text-right">{formatNumber(d.value)} MWh</span>
                  </div>
                );
              })}
            </div>

            {/* ISO Summary Cards */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {isoGenData.map((d) => {
                const isoAssets = filtered.filter((a) => a.iso === d.label);
                const isoMW = isoAssets.reduce((s, a) => s + a.mw, 0);
                return (
                  <div
                    key={d.label}
                    className={`rounded-lg p-3 ${ISO_COLORS[d.label]?.bg || "bg-gray-50"}`}
                  >
                    <p className={`text-xs font-semibold ${ISO_COLORS[d.label]?.text || "text-gray-700"}`}>
                      {d.label}
                    </p>
                    <p className="text-lg font-bold text-slate-900">{isoMW.toLocaleString()} MW</p>
                    <p className="text-xs text-slate-500">
                      {isoAssets.length} asset{isoAssets.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
