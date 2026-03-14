"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface SecurityMilestone {
  date: string;
  milestone_name: string;
  amount: number;
  type: string;
  at_risk: boolean;
  refundable: boolean;
}

interface ProjectDetail {
  id: number;
  project_name: string;
  description: string;
  fuel_type: string;
  size_mw: number;
  capacity_mw: number;
  co_located: string;
  co_located_fuel_type: string;
  co_located_size_mw: number;
  state: string;
  county: string;
  latitude: number;
  longitude: number;
  iso_region: string;
  queue_number: string;
  queue_cycle: string;
  utility: string;
  poi: string;
  poi_voltage: number;
  project_manager: string;
  admin_emails: string;
  developer_emails: string;
  interconnection_status: string;
  option_to_build: string;
  suspension: string;
  provisional_ia_status: string;
  ssr_status: string;
  security_posted_to_date: number;
  security_at_risk_to_date: number;
  study_deposits_posted: number;
  sunk_cost_to_date: number;
  interconnection_facilities_cost: number;
  grid_network_upgrades: number;
  affected_system_costs: number;
  affected_system: string;
  lgia_security: number;
  next_security_milestone: number;
  qsa_deadline: string;
  next_due_date: string;
  planned_cod: string;
  feasibility_study_status: string;
  feasibility_study_completion_date: string;
  system_impact_study_status: string;
  system_impact_study_completion_date: string;
  facilities_study_status: string;
  facilities_study_completion_date: string;
  ia_execution_date: string;
  pjm_queue_position: string;
  pjm_transition_cycle: string;
  pjm_cluster_window: string;
  miso_dpp_phase: string;
  miso_definitive_planning_phase: string;
  spp_disis_cluster: string;
  spp_study_group: string;
  caiso_cluster: string;
  caiso_phase: string;
  caiso_zone: string;
  security_milestones: string;
  created_at: string;
  updated_at: string;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

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

const ISO_COLORS: Record<string, string> = {
  PJM: "bg-blue-100 text-blue-800",
  MISO: "bg-green-100 text-green-800",
  SPP: "bg-purple-100 text-purple-800",
  CAISO: "bg-orange-100 text-orange-800",
  NYISO: "bg-pink-100 text-pink-800",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setProject(data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-lg text-slate-500">Project not found</p>
        <Link href="/" className="mt-4 text-amber-600 hover:text-amber-700">Back to Dashboard</Link>
      </div>
    );
  }

  const milestones: SecurityMilestone[] = JSON.parse(project.security_milestones || "[]");
  const today = new Date().toISOString().split("T")[0];

  const isoSpecificFields = () => {
    switch (project.iso_region) {
      case "PJM":
        return (
          <Section title="PJM-Specific (BPM-15)">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Queue Position" value={project.pjm_queue_position} />
              <Field label="Transition Cycle" value={project.pjm_transition_cycle} />
              <Field label="Cluster Window" value={project.pjm_cluster_window} />
            </div>
          </Section>
        );
      case "MISO":
        return (
          <Section title="MISO-Specific">
            <div className="grid grid-cols-2 gap-4">
              <Field label="DPP Phase" value={project.miso_dpp_phase} />
              <Field label="Definitive Planning Phase" value={project.miso_definitive_planning_phase} />
            </div>
          </Section>
        );
      case "SPP":
        return (
          <Section title="SPP-Specific">
            <div className="grid grid-cols-2 gap-4">
              <Field label="DISIS Cluster" value={project.spp_disis_cluster} />
              <Field label="Study Group" value={project.spp_study_group} />
            </div>
          </Section>
        );
      case "CAISO":
        return (
          <Section title="CAISO-Specific">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Cluster" value={project.caiso_cluster} />
              <Field label="Phase" value={project.caiso_phase} />
              <Field label="Zone" value={project.caiso_zone} />
            </div>
          </Section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb & Actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to Dashboard
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{project.project_name}</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ISO_COLORS[project.iso_region] || "bg-gray-100 text-gray-800"}`}>
              {project.iso_region}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/projects/${project.id}/edit`}
            className="inline-flex items-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
          >
            Edit Project
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200">
            <p className="text-xs font-medium text-emerald-600 uppercase">Security Posted</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{formatCurrency(project.security_posted_to_date)}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-4 border border-red-200">
            <p className="text-xs font-medium text-red-600 uppercase">Security at Risk</p>
            <p className="mt-1 text-2xl font-bold text-red-700">{formatCurrency(project.security_at_risk_to_date)}</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4 border border-blue-200">
            <p className="text-xs font-medium text-blue-600 uppercase">Study Deposits</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{formatCurrency(project.study_deposits_posted)}</p>
          </div>
          <div className="rounded-xl bg-slate-100 p-4 border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase">Sunk Cost</p>
            <p className="mt-1 text-2xl font-bold text-slate-700">{formatCurrency(project.sunk_cost_to_date)}</p>
          </div>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Project Information">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fuel Type" value={project.fuel_type} />
              <Field label="Size" value={`${project.size_mw} MW`} />
              <Field label="Capacity" value={`${project.capacity_mw} MW`} />
              <Field label="Co-Located" value={project.co_located} />
              {project.co_located === "Yes" && (
                <>
                  <Field label="Co-Located Fuel" value={project.co_located_fuel_type} />
                  <Field label="Co-Located Size" value={project.co_located_size_mw ? `${project.co_located_size_mw} MW` : "-"} />
                </>
              )}
              <Field label="Project Manager" value={project.project_manager} />
              <Field label="Option to Build" value={project.option_to_build} />
            </div>
          </Section>

          <Section title="Location & Interconnection">
            <div className="grid grid-cols-2 gap-4">
              <Field label="State" value={project.state} />
              <Field label="County" value={project.county} />
              <Field label="Utility" value={project.utility} />
              <Field label="POI" value={project.poi} />
              <Field label="POI Voltage" value={project.poi_voltage ? `${project.poi_voltage} kV` : "-"} />
              <Field label="Queue Number" value={project.queue_number} />
              <Field label="Queue Cycle" value={project.queue_cycle} />
              <Field label="Suspension" value={project.suspension} />
            </div>
          </Section>

          <Section title="Study Progress">
            <div className="space-y-3">
              {[
                { name: "Feasibility Study", status: project.feasibility_study_status, date: project.feasibility_study_completion_date },
                { name: "System Impact Study", status: project.system_impact_study_status, date: project.system_impact_study_completion_date },
                { name: "Facilities Study", status: project.facilities_study_status, date: project.facilities_study_completion_date },
              ].map((study) => (
                <div key={study.name} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{study.name}</p>
                    {study.date && <p className="text-xs text-slate-400">{study.date}</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    study.status === "Completed" ? "bg-green-100 text-green-700" :
                    study.status === "In Progress" ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {study.status || "Not Started"}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Cost Breakdown">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Interconnection Facilities</span>
                <span className="text-sm font-semibold text-slate-800">{formatCurrency(project.interconnection_facilities_cost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Grid Network Upgrades</span>
                <span className="text-sm font-semibold text-slate-800">{formatCurrency(project.grid_network_upgrades)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Affected System Costs</span>
                <span className="text-sm font-semibold text-slate-800">{formatCurrency(project.affected_system_costs)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">LGIA Security Required</span>
                <span className="text-sm font-semibold text-slate-800">{formatCurrency(project.lgia_security)}</span>
              </div>
              <hr className="border-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Total Estimated Cost</span>
                <span className="text-base font-bold text-slate-900">
                  {formatCurrency(project.interconnection_facilities_cost + project.grid_network_upgrades + project.affected_system_costs)}
                </span>
              </div>
            </div>
          </Section>
        </div>

        {/* ISO-Specific */}
        {isoSpecificFields()}

        {/* Security Milestones Timeline */}
        <Section title="Security Milestone Timeline">
          {milestones.length === 0 ? (
            <p className="text-sm text-slate-400">No milestones configured</p>
          ) : (
            <div className="space-y-3">
              {milestones.map((m, i) => {
                const isPast = m.date <= today;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded-lg p-3 border ${
                      isPast ? "bg-slate-50 border-slate-200" : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${isPast ? "bg-green-500" : "bg-amber-400"}`} />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{m.milestone_name}</p>
                        <p className="text-xs text-slate-400">{new Date(m.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{formatCurrency(m.amount)}</p>
                      <div className="flex gap-1.5 mt-0.5 justify-end">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${m.type === "deposit" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                          {m.type}
                        </span>
                        {m.at_risk && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">at risk</span>
                        )}
                        {m.refundable && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">refundable</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Key Dates */}
        <Section title="Key Dates">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="QSA Deadline" value={project.qsa_deadline ? new Date(project.qsa_deadline).toLocaleDateString() : undefined} />
            <Field label="Next Due Date" value={project.next_due_date} />
            <Field label="Planned COD" value={project.planned_cod ? new Date(project.planned_cod).toLocaleDateString() : undefined} />
            <Field label="IA Execution Date" value={project.ia_execution_date ? new Date(project.ia_execution_date).toLocaleDateString() : undefined} />
          </div>
        </Section>
      </div>
    </div>
  );
}
