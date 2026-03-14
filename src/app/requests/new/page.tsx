"use client";

import { useState } from "react";
import Link from "next/link";

const REQUEST_TYPES = ["Injection Study", "Power Flow Study", "Short Circuit Study", "Greenfield Assessment", "Affected System Study", "General"];
const PRIORITIES = ["Low", "Normal", "High", "Urgent"];
const TEAMS = ["Development", "Transmission", "Engineering", "Interconnection", "Regulatory", "Finance", "Operations", "Management"];
const ISO_REGIONS = ["PJM", "MISO", "SPP", "CAISO", "NYISO", "ISO-NE", "ERCOT"];
const MOCK_PROJECTS: Record<string, { id: number; name: string }[]> = {
  NYISO: [{ id: 1, name: "Manor Solar v2" }],
  MISO: [{ id: 2, name: "Midwest Wind Farm" }],
  PJM: [{ id: 3, name: "PJM Solar Hub" }],
  CAISO: [{ id: 4, name: "Desert Sun BESS" }],
  SPP: [{ id: 5, name: "Prairie Wind SPP" }],
};

function InputField({ label, required, placeholder, type = "text" }: { label: string; required?: boolean; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}{required && " *"}</label>
      <input type={type} placeholder={placeholder} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
    </div>
  );
}

function SelectField({ label, options, required }: { label: string; options: string[]; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}{required && " *"}</label>
      <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white">
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function NewRequestPage() {
  const [selectedISO, setSelectedISO] = useState("");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/requests" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to Requests
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold text-slate-900">Create New Request</h1>

      <div className="space-y-6">
        {/* Request Information */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <h3 className="col-span-full text-sm font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">Request Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <InputField label="Title" required placeholder="e.g., Greenfield Injection Study - Project Name" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Description *</label>
              <textarea
                rows={4}
                placeholder="Describe the request in detail. Include specific study requirements, scope, deliverables, and any deadlines..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <SelectField label="Request Type" options={REQUEST_TYPES} required />
            <SelectField label="Priority" options={PRIORITIES} required />
          </div>
        </div>

        {/* From / To */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">From / To</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="rounded-lg bg-sky-50 p-3 border border-sky-200">
                <p className="text-xs font-semibold text-sky-700 uppercase mb-3">Requester (From)</p>
                <div className="space-y-3">
                  <InputField label="Your Name" required placeholder="e.g., John V" />
                  <SelectField label="Your Team" options={TEAMS} required />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                <p className="text-xs font-semibold text-amber-700 uppercase mb-3">Assigned To</p>
                <div className="space-y-3">
                  <InputField label="Assignee Name" placeholder="e.g., Sarah Chen" />
                  <SelectField label="Assigned Team" options={TEAMS} required />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Linking */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">Link to Project (Optional)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">ISO Region</label>
              <select
                value={selectedISO}
                onChange={(e) => setSelectedISO(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
              >
                <option value="">Select ISO...</option>
                {ISO_REGIONS.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Project</label>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white" disabled={!selectedISO}>
                <option value="">{selectedISO ? "Select project..." : "Select ISO first..."}</option>
                {selectedISO && MOCK_PROJECTS[selectedISO]?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          {selectedISO && (
            <p className="mt-2 text-xs text-slate-400">
              Projects filtered for {selectedISO} region
            </p>
          )}
        </div>

        {/* Study Requirements (conditional detail for study types) */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">Study Requirements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField label="POI / Bus Name" placeholder="e.g., Brink - Pine Wood 345kV" />
            <InputField label="Injection Size (MW)" type="number" placeholder="200" />
            <InputField label="Voltage Level (kV)" type="number" placeholder="345" />
            <InputField label="Requested Completion Date" type="date" />
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Special Instructions</label>
              <textarea
                rows={2}
                placeholder="Any specific modeling requirements, scenarios to study, or assumptions..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link
            href="/requests"
            className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-400">
            Create Request
          </button>
        </div>
      </div>
    </div>
  );
}
