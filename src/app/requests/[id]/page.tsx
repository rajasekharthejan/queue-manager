"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-sky-100 text-sky-800 border-sky-300",
  "In Progress": "bg-amber-100 text-amber-800 border-amber-300",
  "Under Review": "bg-violet-100 text-violet-800 border-violet-300",
  Completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Rejected: "bg-red-100 text-red-800 border-red-300",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600",
  Normal: "bg-blue-100 text-blue-700",
  High: "bg-amber-100 text-amber-800",
  Urgent: "bg-red-100 text-red-800",
};

const LIFECYCLE = ["Open", "In Progress", "Under Review", "Completed"];

const MOCK_REQUEST = {
  id: 1,
  title: "Greenfield Injection Study - Manor Solar v2",
  description: "Request transmission team to perform injection study for the Manor Solar v2 200MW project at Brink-Pine Wood 345kV POI. Need to assess thermal loading, voltage impact, and short circuit contribution at the point of interconnection. Study should cover N-1 and N-1-1 contingencies per NYISO requirements.",
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
  poi: "Brink - Pine Wood 345kV",
  injection_mw: 200,
  voltage_kv: 345,
  created_at: "2026-02-15T10:30:00",
  updated_at: "2026-03-10T14:20:00",
  completed_at: null,
};

const MOCK_COMMENTS = [
  {
    id: 1,
    author_name: "John V",
    author_team: "Development",
    content: "Hi Transmission team, we need an injection study for the Manor Solar v2 project. The project is a 200MW solar facility connecting at the Brink-Pine Wood 345kV bus. Please assess thermal loading under N-1 contingencies and provide voltage impact analysis. We need this before the QSA deadline in May.",
    is_resolution: false,
    created_at: "2026-02-15T10:30:00",
  },
  {
    id: 2,
    author_name: "Sarah Chen",
    author_team: "Transmission",
    content: "Received. We'll start the power flow modeling this week. A few clarifying questions:\n\n1. Should we model the full 200MW injection or the 120MW capacity rating?\n2. Do you have an updated one-line diagram for the POI?\n3. Any specific dispatch scenarios you want us to evaluate beyond the standard summer/winter peak?",
    is_resolution: false,
    created_at: "2026-02-17T09:15:00",
  },
  {
    id: 3,
    author_name: "John V",
    author_team: "Development",
    content: "Good questions:\n\n1. Please model full 200MW nameplate injection\n2. Attaching the one-line diagram - see the POI configuration at Brink substation\n3. Yes, please also include light load spring scenario as NYISO has been flagging voltage issues during low-load periods",
    is_resolution: false,
    created_at: "2026-02-18T14:45:00",
  },
  {
    id: 4,
    author_name: "Sarah Chen",
    author_team: "Transmission",
    content: "Update: Power flow base cases are set up. Initial results show some thermal loading concerns on the Brink-Oakdale 345kV line under N-1 (loss of parallel circuit). Running additional contingency analysis now. Will have preliminary results by end of next week.",
    is_resolution: false,
    created_at: "2026-03-05T16:30:00",
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-800">{value || "-"}</dd>
    </div>
  );
}

const FUEL_TYPES = ["Solar", "Wind", "Battery Storage", "Solar + Storage", "Wind + Storage", "Natural Gas"];
const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

export default function RequestDetailPage() {
  const [newComment, setNewComment] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [isResolution, setIsResolution] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [converted, setConverted] = useState(false);
  const [convertedProjectId, setConvertedProjectId] = useState<number | null>(null);
  // Convert form fields
  const [convFuel, setConvFuel] = useState("Solar");
  const [convState, setConvState] = useState("NY");
  const [convCounty, setConvCounty] = useState("");
  const [convUtility, setConvUtility] = useState("");
  const [convQueue, setConvQueue] = useState("");
  const [convCod, setConvCod] = useState("2028-06-01");
  const r = MOCK_REQUEST;

  const daysSinceCreation = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
  const currentStepIndex = LIFECYCLE.indexOf(r.status);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <Link href="/requests" className="text-sm text-slate-500 hover:text-slate-700">← Back to Requests</Link>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{r.title}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                {r.status}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[r.priority]}`}>
                {r.priority}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Request #{r.id} &middot; Created {new Date(r.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} &middot; {daysSinceCreation} days elapsed
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {converted && (
              <Link href={`/projects/${convertedProjectId}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-200">
                ✓ Converted to Project →
              </Link>
            )}
            {!converted && (r.status === "Completed" || r.status === "Under Review" || r.status === "In Progress") && (
              <button onClick={() => setShowConvert(!showConvert)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 shadow-sm">
                🔄 Convert to Project
              </button>
            )}
            <Link href={`/requests/${r.id}`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Request Lifecycle</h3>
        <div className="flex items-center gap-0">
          {LIFECYCLE.map((step, i) => {
            const isPast = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const isFuture = i > currentStepIndex;
            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`flex items-center justify-center h-10 w-10 rounded-full border-2 text-sm font-bold ${
                    isPast ? "bg-emerald-500 border-emerald-500 text-white" :
                    isCurrent ? "bg-amber-500 border-amber-500 text-white" :
                    "bg-white border-slate-300 text-slate-400"
                  }`}>
                    {isPast ? "\u2713" : i + 1}
                  </div>
                  <p className={`mt-2 text-xs font-medium ${
                    isPast ? "text-emerald-600" :
                    isCurrent ? "text-amber-600" :
                    "text-slate-400"
                  }`}>{step}</p>
                </div>
                {i < LIFECYCLE.length - 1 && (
                  <div className={`h-0.5 flex-1 -mt-5 ${isPast ? "bg-emerald-400" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Status Actions */}
        <div className="mt-6 flex gap-2 border-t border-slate-100 pt-4">
          {r.status === "Open" && (
            <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400">
              Start Work
            </button>
          )}
          {r.status === "In Progress" && (
            <button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">
              Submit for Review
            </button>
          )}
          {r.status === "Under Review" && (
            <>
              <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                Approve & Complete
              </button>
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">
                Reject
              </button>
            </>
          )}
          {(r.status === "Completed" || r.status === "Rejected") && (
            <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
              Reopen
            </button>
          )}
        </div>
      </div>

      {/* Convert to Project Form */}
      {showConvert && !converted && (
        <div className="mb-8 rounded-xl bg-emerald-50 p-6 shadow-sm border-2 border-emerald-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-emerald-800">Convert Request to Queue Project</h3>
              <p className="text-sm text-emerald-600 mt-0.5">Pre-filled from request data. Complete the remaining fields to create a full-scope interconnection project.</p>
            </div>
            <button onClick={() => setShowConvert(false)} className="text-sm text-slate-500 hover:text-slate-700">✕ Close</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pre-filled (read-only) */}
            <div className="rounded-lg bg-white p-5 border border-emerald-200">
              <h4 className="text-xs font-semibold text-emerald-700 uppercase mb-3">Pre-Filled from Request</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Project Name</label>
                  <input type="text" readOnly value={r.project_name || r.title}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">ISO Region</label>
                    <input type="text" readOnly value={r.iso_region}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Size (MW)</label>
                    <input type="text" readOnly value={`${r.injection_mw} MW`}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">POI</label>
                    <input type="text" readOnly value={r.poi || ""}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Voltage (kV)</label>
                    <input type="text" readOnly value={r.voltage_kv ? `${r.voltage_kv} kV` : ""}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Source Request</label>
                  <input type="text" readOnly value={`Request #${r.id}: ${r.request_type}`}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" />
                </div>
              </div>
            </div>

            {/* User-editable fields */}
            <div className="rounded-lg bg-white p-5 border border-emerald-200">
              <h4 className="text-xs font-semibold text-amber-700 uppercase mb-3">Complete These Fields</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Fuel Type *</label>
                    <select value={convFuel} onChange={(e) => setConvFuel(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white">
                      {FUEL_TYPES.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">State *</label>
                    <select value={convState} onChange={(e) => setConvState(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white">
                      {US_STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">County</label>
                    <input type="text" value={convCounty} onChange={(e) => setConvCounty(e.target.value)} placeholder="e.g., Albany"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Utility</label>
                    <input type="text" value={convUtility} onChange={(e) => setConvUtility(e.target.value)} placeholder="e.g., PSEG"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Queue Number *</label>
                  <input type="text" value={convQueue} onChange={(e) => setConvQueue(e.target.value)} placeholder="e.g., AF2-789"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Planned COD *</label>
                  <input type="date" value={convCod} onChange={(e) => setConvCod(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-emerald-600">This will create a new project in the interconnection queue with status &quot;Pre-Application&quot;</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConvert(false)}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => {
                const newId = Math.floor(Math.random() * 1000) + 100;
                setConvertedProjectId(newId);
                setConverted(true);
                setShowConvert(false);
              }}
                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 shadow-sm">
                ✓ Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Success */}
      {converted && (
        <div className="mb-8 rounded-xl bg-emerald-50 p-5 border border-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-lg">✓</div>
            <div>
              <p className="text-sm font-bold text-emerald-800">Request successfully converted to project!</p>
              <p className="text-xs text-emerald-600">Project &quot;{r.project_name || r.title}&quot; has been added to the interconnection queue as a Pre-Application project.</p>
            </div>
          </div>
          <Link href={`/projects/${convertedProjectId}`}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
            View Project →
          </Link>
        </div>
      )}

      {/* Detail Grid */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Request Details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Request Type" value={r.request_type} />
            <Field label="Priority" value={r.priority} />
            <Field label="ISO Region" value={r.iso_region} />
            <Field label="Linked Project" value={r.project_name} />
            <Field label="POI" value={r.poi} />
            <Field label="Injection Size" value={`${r.injection_mw} MW`} />
            <Field label="Voltage Level" value={`${r.voltage_kv} kV`} />
            <Field label="Time Elapsed" value={`${daysSinceCreation} days`} />
          </div>
        </Section>

        <Section title="People">
          <div className="space-y-4">
            <div className="rounded-lg bg-sky-50 p-4 border border-sky-200">
              <p className="text-xs font-semibold text-sky-700 uppercase mb-2">Requester</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" value={r.requester_name} />
                <Field label="Team" value={r.requester_team} />
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
              <p className="text-xs font-semibold text-amber-700 uppercase mb-2">Assigned To</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" value={r.assigned_to} />
                <Field label="Team" value={r.assigned_team} />
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Description */}
      <div className="mb-8">
        <Section title="Full Description">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{r.description}</p>
        </Section>
      </div>

      {/* Comment Thread */}
      <div className="rounded-xl bg-white shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Discussion Thread</h3>
            <p className="text-xs text-slate-400 mt-0.5">{MOCK_COMMENTS.length} comments</p>
          </div>
        </div>

        {/* Comments */}
        <div className="divide-y divide-slate-100">
          {MOCK_COMMENTS.map((c) => (
            <div key={c.id} className={`px-6 py-5 ${c.is_resolution ? "bg-emerald-50" : ""}`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-full text-sm font-bold ${
                  c.author_team === "Development" ? "bg-sky-100 text-sky-700" :
                  c.author_team === "Transmission" ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {c.author_name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{c.author_name}</p>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {c.author_team}
                    </span>
                    {c.is_resolution && (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Resolution
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {new Date(c.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-line">{c.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Comment Form */}
        <div className="px-6 py-5 border-t border-slate-200 bg-slate-50">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Add Reply</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Your Name *</label>
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  placeholder="e.g., Sarah Chen"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Team</label>
                <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white">
                  <option>Development</option>
                  <option>Transmission</option>
                  <option>Engineering</option>
                  <option>Interconnection</option>
                  <option>Regulatory</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Message *</label>
              <textarea
                rows={4}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type your reply... You can share study results, ask follow-up questions, or provide updates here."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isResolution}
                  onChange={(e) => setIsResolution(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="text-slate-600">Mark as Resolution / Final Results</span>
              </label>
              <button className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-400">
                Post Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
