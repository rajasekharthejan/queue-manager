"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProjectFormProps {
  initialData?: Record<string, unknown>;
  isEdit?: boolean;
}

const ISO_REGIONS = ["PJM", "MISO", "SPP", "CAISO", "NYISO", "ISO-NE", "ERCOT"];
const FUEL_TYPES = ["Solar", "Wind", "Battery Storage", "Solar + Storage", "Wind + Storage", "Natural Gas", "Hybrid", "Nuclear", "Hydro"];
const STUDY_STATUSES = ["Not Started", "In Progress", "Completed", "Restudy Required"];
const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

function InputField({ label, name, type = "text", value, onChange, required, placeholder }: {
  label: string; name: string; type?: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-slate-500 mb-1">{label}{required && " *"}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, required }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[]; required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-slate-500 mb-1">{label}{required && " *"}</label>
      <select
        id={name}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
      >
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className="col-span-full text-sm font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2 mt-4 first:mt-0">{title}</h3>;
}

interface MilestoneEntry {
  date: string;
  milestone_name: string;
  amount: number;
  type: string;
  at_risk: boolean;
  refundable: boolean;
}

export default function ProjectForm({ initialData, isEdit }: ProjectFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const defaults: Record<string, unknown> = {
    project_name: "",
    description: "",
    fuel_type: "Solar",
    size_mw: 0,
    capacity_mw: 0,
    co_located: "No",
    co_located_fuel_type: "",
    co_located_size_mw: 0,
    state: "",
    county: "",
    latitude: 0,
    longitude: 0,
    iso_region: "PJM",
    queue_number: "",
    queue_cycle: "",
    utility: "",
    poi: "",
    poi_voltage: 0,
    project_manager: "",
    admin_emails: "",
    developer_emails: "",
    interconnection_status: "Pre-Application",
    option_to_build: "Full Build",
    suspension: "No",
    provisional_ia_status: "Not Available",
    ssr_status: "",
    security_posted_to_date: 0,
    security_at_risk_to_date: 0,
    study_deposits_posted: 0,
    sunk_cost_to_date: 0,
    interconnection_facilities_cost: 0,
    grid_network_upgrades: 0,
    affected_system_costs: 0,
    affected_system: "",
    lgia_security: 0,
    next_security_milestone: 0,
    qsa_deadline: "",
    next_due_date: "",
    planned_cod: "",
    feasibility_study_status: "Not Started",
    feasibility_study_completion_date: "",
    system_impact_study_status: "Not Started",
    system_impact_study_completion_date: "",
    facilities_study_status: "Not Started",
    facilities_study_completion_date: "",
    ia_execution_date: "",
    commercial_operation_milestone: "",
    pjm_queue_position: "",
    pjm_transition_cycle: "",
    pjm_cluster_window: "",
    miso_dpp_phase: "",
    miso_definitive_planning_phase: "",
    spp_disis_cluster: "",
    spp_study_group: "",
    caiso_cluster: "",
    caiso_phase: "",
    caiso_zone: "",
    security_milestones: "[]",
    ...initialData,
  };

  const [form, setForm] = useState<Record<string, unknown>>(defaults);
  const [milestones, setMilestones] = useState<MilestoneEntry[]>(
    JSON.parse((defaults.security_milestones as string) || "[]")
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : parseFloat(value)) : value,
    }));
  };

  const addMilestone = () => {
    setMilestones([...milestones, {
      date: "",
      milestone_name: "",
      amount: 0,
      type: "security",
      at_risk: true,
      refundable: false,
    }]);
  };

  const updateMilestone = (index: number, field: string, value: unknown) => {
    const updated = [...milestones];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    setMilestones(updated);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      security_milestones: JSON.stringify(milestones),
    };

    try {
      const url = isEdit ? `/api/projects/${form.id}` : "/api/projects";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save project");
      const data = await res.json();
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError("Failed to save project. Please check your inputs.");
      setSaving(false);
    }
  }

  const isoRegion = form.iso_region as string;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Basic Info */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <SectionHeader title="Project Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <InputField label="Project Name" name="project_name" value={form.project_name as string} onChange={handleChange} required />
          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <textarea
              id="description"
              name="description"
              value={(form.description as string) ?? ""}
              onChange={handleChange}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <SelectField label="Fuel Type" name="fuel_type" value={form.fuel_type as string} onChange={handleChange} options={FUEL_TYPES} required />
          <InputField label="Size (MW)" name="size_mw" type="number" value={form.size_mw as number} onChange={handleChange} required />
          <InputField label="Capacity (MW)" name="capacity_mw" type="number" value={form.capacity_mw as number} onChange={handleChange} />
          <SelectField label="Co-Located" name="co_located" value={form.co_located as string} onChange={handleChange} options={["Yes", "No"]} />
          {form.co_located === "Yes" && (
            <>
              <SelectField label="Co-Located Fuel Type" name="co_located_fuel_type" value={form.co_located_fuel_type as string} onChange={handleChange} options={FUEL_TYPES} />
              <InputField label="Co-Located Size (MW)" name="co_located_size_mw" type="number" value={form.co_located_size_mw as number} onChange={handleChange} />
            </>
          )}
          <InputField label="Project Manager" name="project_manager" value={form.project_manager as string} onChange={handleChange} />
          <SelectField label="Option to Build" name="option_to_build" value={form.option_to_build as string} onChange={handleChange} options={["Full Build", "Self-Build", "Turnkey"]} />
        </div>
      </div>

      {/* Location & ISO */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <SectionHeader title="Location & Queue Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <SelectField label="ISO Region" name="iso_region" value={form.iso_region as string} onChange={handleChange} options={ISO_REGIONS} required />
          <InputField label="Queue Number" name="queue_number" value={form.queue_number as string} onChange={handleChange} />
          <InputField label="Queue Cycle" name="queue_cycle" value={form.queue_cycle as string} onChange={handleChange} />
          <SelectField label="State" name="state" value={form.state as string} onChange={handleChange} options={US_STATES} />
          <InputField label="County" name="county" value={form.county as string} onChange={handleChange} />
          <InputField label="Utility" name="utility" value={form.utility as string} onChange={handleChange} />
          <InputField label="POI (Point of Interconnection)" name="poi" value={form.poi as string} onChange={handleChange} />
          <InputField label="POI Voltage (kV)" name="poi_voltage" type="number" value={form.poi_voltage as number} onChange={handleChange} />
          <InputField label="Latitude" name="latitude" type="number" value={form.latitude as number} onChange={handleChange} />
          <InputField label="Longitude" name="longitude" type="number" value={form.longitude as number} onChange={handleChange} />
        </div>
      </div>

      {/* Interconnection Status */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <SectionHeader title="Interconnection Status & Studies" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <SelectField label="Interconnection Status" name="interconnection_status" value={form.interconnection_status as string} onChange={handleChange}
            options={["Pre-Application", "Feasibility Study", "System Impact Study", "Facilities Study", "IA Negotiation", "IA Executed", "Under Construction", "Commercial Operation", "Suspended", "Withdrawn"]} />
          <SelectField label="Suspension" name="suspension" value={form.suspension as string} onChange={handleChange} options={["Yes", "No"]} />
          <SelectField label="Provisional IA Status" name="provisional_ia_status" value={form.provisional_ia_status as string} onChange={handleChange} options={["Not Available", "Eligible", "Applied", "Granted"]} />
          <InputField label="SSR Status" name="ssr_status" value={form.ssr_status as string} onChange={handleChange} />

          <SelectField label="Feasibility Study Status" name="feasibility_study_status" value={form.feasibility_study_status as string} onChange={handleChange} options={STUDY_STATUSES} />
          <InputField label="Feasibility Completion Date" name="feasibility_study_completion_date" type="date" value={form.feasibility_study_completion_date as string} onChange={handleChange} />
          <SelectField label="System Impact Study Status" name="system_impact_study_status" value={form.system_impact_study_status as string} onChange={handleChange} options={STUDY_STATUSES} />
          <InputField label="SIS Completion Date" name="system_impact_study_completion_date" type="date" value={form.system_impact_study_completion_date as string} onChange={handleChange} />
          <SelectField label="Facilities Study Status" name="facilities_study_status" value={form.facilities_study_status as string} onChange={handleChange} options={STUDY_STATUSES} />
          <InputField label="Facilities Completion Date" name="facilities_study_completion_date" type="date" value={form.facilities_study_completion_date as string} onChange={handleChange} />
          <InputField label="IA Execution Date" name="ia_execution_date" type="date" value={form.ia_execution_date as string} onChange={handleChange} />
        </div>
      </div>

      {/* Financial */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <SectionHeader title="Financial - Security & Deposits" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <InputField label="Security Posted to Date ($)" name="security_posted_to_date" type="number" value={form.security_posted_to_date as number} onChange={handleChange} />
          <InputField label="Security at Risk to Date ($)" name="security_at_risk_to_date" type="number" value={form.security_at_risk_to_date as number} onChange={handleChange} />
          <InputField label="Study Deposits Posted ($)" name="study_deposits_posted" type="number" value={form.study_deposits_posted as number} onChange={handleChange} />
          <InputField label="Sunk Cost to Date ($)" name="sunk_cost_to_date" type="number" value={form.sunk_cost_to_date as number} onChange={handleChange} />
          <InputField label="Interconnection Facilities Cost ($)" name="interconnection_facilities_cost" type="number" value={form.interconnection_facilities_cost as number} onChange={handleChange} />
          <InputField label="Grid Network Upgrades ($)" name="grid_network_upgrades" type="number" value={form.grid_network_upgrades as number} onChange={handleChange} />
          <InputField label="Affected System Costs ($)" name="affected_system_costs" type="number" value={form.affected_system_costs as number} onChange={handleChange} />
          <InputField label="Affected System" name="affected_system" value={form.affected_system as string} onChange={handleChange} />
          <InputField label="LGIA Security ($)" name="lgia_security" type="number" value={form.lgia_security as number} onChange={handleChange} />
          <InputField label="Next Security Milestone ($)" name="next_security_milestone" type="number" value={form.next_security_milestone as number} onChange={handleChange} />
        </div>
      </div>

      {/* Key Dates */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <SectionHeader title="Key Dates" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <InputField label="QSA Deadline" name="qsa_deadline" type="date" value={form.qsa_deadline as string} onChange={handleChange} />
          <InputField label="Next Due Date" name="next_due_date" type="date" value={form.next_due_date as string} onChange={handleChange} />
          <InputField label="Planned COD" name="planned_cod" type="date" value={form.planned_cod as string} onChange={handleChange} />
        </div>
      </div>

      {/* ISO-Specific Fields */}
      {(isoRegion === "PJM" || isoRegion === "MISO" || isoRegion === "SPP" || isoRegion === "CAISO") && (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <SectionHeader title={`${isoRegion}-Specific Fields`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {isoRegion === "PJM" && (
              <>
                <InputField label="PJM Queue Position" name="pjm_queue_position" value={form.pjm_queue_position as string} onChange={handleChange} />
                <InputField label="PJM Transition Cycle" name="pjm_transition_cycle" value={form.pjm_transition_cycle as string} onChange={handleChange} />
                <InputField label="PJM Cluster Window" name="pjm_cluster_window" value={form.pjm_cluster_window as string} onChange={handleChange} />
              </>
            )}
            {isoRegion === "MISO" && (
              <>
                <InputField label="DPP Phase" name="miso_dpp_phase" value={form.miso_dpp_phase as string} onChange={handleChange} />
                <InputField label="Definitive Planning Phase" name="miso_definitive_planning_phase" value={form.miso_definitive_planning_phase as string} onChange={handleChange} />
              </>
            )}
            {isoRegion === "SPP" && (
              <>
                <InputField label="DISIS Cluster" name="spp_disis_cluster" value={form.spp_disis_cluster as string} onChange={handleChange} />
                <InputField label="Study Group" name="spp_study_group" value={form.spp_study_group as string} onChange={handleChange} />
              </>
            )}
            {isoRegion === "CAISO" && (
              <>
                <InputField label="CAISO Cluster" name="caiso_cluster" value={form.caiso_cluster as string} onChange={handleChange} />
                <InputField label="CAISO Phase" name="caiso_phase" value={form.caiso_phase as string} onChange={handleChange} />
                <InputField label="CAISO Zone" name="caiso_zone" value={form.caiso_zone as string} onChange={handleChange} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Security Milestones */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Security Milestone Schedule" />
          <button
            type="button"
            onClick={addMilestone}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
          >
            + Add Milestone
          </button>
        </div>
        {milestones.length === 0 ? (
          <p className="text-sm text-slate-400">No milestones added. Click &quot;Add Milestone&quot; to create security milestone schedule entries.</p>
        ) : (
          <div className="space-y-3">
            {milestones.map((m, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end rounded-lg bg-slate-50 p-3 border border-slate-200">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={m.date}
                    onChange={(e) => updateMilestone(i, "date", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Milestone Name</label>
                  <input
                    type="text"
                    value={m.milestone_name}
                    onChange={(e) => updateMilestone(i, "milestone_name", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    value={m.amount}
                    onChange={(e) => updateMilestone(i, "amount", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={m.at_risk} onChange={(e) => updateMilestone(i, "at_risk", e.target.checked)} className="rounded" />
                    At Risk
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={m.refundable} onChange={(e) => updateMilestone(i, "refundable", e.target.checked)} className="rounded" />
                    Refundable
                  </label>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    className="rounded-md px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <SectionHeader title="Contact Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <InputField label="Admin Email IDs (semicolon separated)" name="admin_emails" value={form.admin_emails as string} onChange={handleChange} placeholder="admin1@co.com;admin2@co.com" />
          <InputField label="Developer Email IDs (semicolon separated)" name="developer_emails" value={form.developer_emails as string} onChange={handleChange} placeholder="dev1@co.com;dev2@co.com" />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-400 disabled:opacity-50"
        >
          {saving ? "Saving..." : isEdit ? "Update Project" : "Create Project"}
        </button>
      </div>
    </form>
  );
}
