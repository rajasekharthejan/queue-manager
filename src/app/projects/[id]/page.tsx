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
  "ISO-NE": "bg-cyan-100 text-cyan-800",
  ERCOT: "bg-red-100 text-red-800",
};

const MOCK_PROJECTS: Record<number, ProjectDetail> = {
  1: { id: 1, project_name: "Manor Solar v2", description: "200 MW solar project in Albany County", fuel_type: "Solar", size_mw: 200, capacity_mw: 120, co_located: "No", co_located_fuel_type: "", co_located_size_mw: 0, state: "NY", county: "Albany", latitude: 42.65, longitude: -73.75, iso_region: "NYISO", queue_number: "NY-2024-0142", queue_cycle: "2024 Q1", utility: "PSEG", poi: "Brink - Pine Wood 345kV", poi_voltage: 345, project_manager: "Sarah Chen", admin_emails: "admin@dev.com", developer_emails: "dev@dev.com", interconnection_status: "Feasibility Study", option_to_build: "", suspension: "No", provisional_ia_status: "", ssr_status: "", security_posted_to_date: 500000, security_at_risk_to_date: 200000, study_deposits_posted: 80000, sunk_cost_to_date: 120000, interconnection_facilities_cost: 15000000, grid_network_upgrades: 8500000, affected_system_costs: 2000000, affected_system: "Con Edison", lgia_security: 0, next_security_milestone: 300000, qsa_deadline: "2025-09-01", next_due_date: "2025-06-15", planned_cod: "2026-11-01", feasibility_study_status: "In Progress", feasibility_study_completion_date: "2025-08-01", system_impact_study_status: "Not Started", system_impact_study_completion_date: "", facilities_study_status: "Not Started", facilities_study_completion_date: "", ia_execution_date: "", pjm_queue_position: "", pjm_transition_cycle: "", pjm_cluster_window: "", miso_dpp_phase: "", miso_definitive_planning_phase: "", spp_disis_cluster: "", spp_study_group: "", caiso_cluster: "", caiso_phase: "", caiso_zone: "", security_milestones: "[]", created_at: "2025-01-15", updated_at: "2025-03-01" },
  2: { id: 2, project_name: "Midwest Wind Farm", description: "350 MW wind farm in McLean County, IL", fuel_type: "Wind", size_mw: 350, capacity_mw: 280, co_located: "No", co_located_fuel_type: "", co_located_size_mw: 0, state: "IL", county: "McLean", latitude: 40.49, longitude: -88.99, iso_region: "MISO", queue_number: "J1042", queue_cycle: "DPP 2023", utility: "Ameren", poi: "Bloomington 345kV", poi_voltage: 345, project_manager: "Mike Torres", admin_emails: "", developer_emails: "", interconnection_status: "System Impact Study", option_to_build: "", suspension: "No", provisional_ia_status: "", ssr_status: "", security_posted_to_date: 2100000, security_at_risk_to_date: 1400000, study_deposits_posted: 250000, sunk_cost_to_date: 380000, interconnection_facilities_cost: 22000000, grid_network_upgrades: 18000000, affected_system_costs: 4500000, affected_system: "PJM", lgia_security: 0, next_security_milestone: 1800000, qsa_deadline: "", next_due_date: "2025-09-01", planned_cod: "2027-06-01", feasibility_study_status: "Complete", feasibility_study_completion_date: "2024-12-01", system_impact_study_status: "In Progress", system_impact_study_completion_date: "2025-06-01", facilities_study_status: "Not Started", facilities_study_completion_date: "", ia_execution_date: "", pjm_queue_position: "", pjm_transition_cycle: "", pjm_cluster_window: "", miso_dpp_phase: "Phase 2", miso_definitive_planning_phase: "DPP 2023", spp_disis_cluster: "", spp_study_group: "", caiso_cluster: "", caiso_phase: "", caiso_zone: "", security_milestones: "[]", created_at: "2024-11-01", updated_at: "2025-02-15" },
  3: { id: 3, project_name: "PJM Solar Hub", description: "200 MW solar + storage hybrid in Lancaster County", fuel_type: "Solar + Storage", size_mw: 200, capacity_mw: 150, co_located: "Yes", co_located_fuel_type: "Battery Storage", co_located_size_mw: 50, state: "PA", county: "Lancaster", latitude: 40.04, longitude: -76.31, iso_region: "PJM", queue_number: "AH1-234", queue_cycle: "Transition Cycle 1", utility: "PPL Electric", poi: "Susquehanna 500kV", poi_voltage: 500, project_manager: "Emily Johnson", admin_emails: "", developer_emails: "", interconnection_status: "Facilities Study", option_to_build: "", suspension: "No", provisional_ia_status: "", ssr_status: "", security_posted_to_date: 3500000, security_at_risk_to_date: 2800000, study_deposits_posted: 400000, sunk_cost_to_date: 550000, interconnection_facilities_cost: 30000000, grid_network_upgrades: 25000000, affected_system_costs: 3200000, affected_system: "NYISO", lgia_security: 0, next_security_milestone: 2400000, qsa_deadline: "", next_due_date: "2025-08-01", planned_cod: "2027-03-01", feasibility_study_status: "Complete", feasibility_study_completion_date: "2024-06-01", system_impact_study_status: "Complete", system_impact_study_completion_date: "2024-11-15", facilities_study_status: "In Progress", facilities_study_completion_date: "2025-05-01", ia_execution_date: "", pjm_queue_position: "AH1-234", pjm_transition_cycle: "Transition Cycle 1", pjm_cluster_window: "2023 Q4", miso_dpp_phase: "", miso_definitive_planning_phase: "", spp_disis_cluster: "", spp_study_group: "", caiso_cluster: "", caiso_phase: "", caiso_zone: "", security_milestones: "[]", created_at: "2024-08-01", updated_at: "2025-01-20" },
  4: { id: 4, project_name: "Desert Sun BESS", description: "400 MW battery storage in Riverside County, CA", fuel_type: "Battery Storage", size_mw: 400, capacity_mw: 400, co_located: "No", co_located_fuel_type: "", co_located_size_mw: 0, state: "CA", county: "Riverside", latitude: 33.95, longitude: -117.39, iso_region: "CAISO", queue_number: "CL2023-456", queue_cycle: "Cluster 15", utility: "SCE", poi: "Devers 230kV", poi_voltage: 230, project_manager: "James Wright", admin_emails: "", developer_emails: "", interconnection_status: "System Impact Study", option_to_build: "", suspension: "No", provisional_ia_status: "", ssr_status: "", security_posted_to_date: 4200000, security_at_risk_to_date: 3000000, study_deposits_posted: 500000, sunk_cost_to_date: 720000, interconnection_facilities_cost: 35000000, grid_network_upgrades: 28000000, affected_system_costs: 0, affected_system: "", lgia_security: 0, next_security_milestone: 3300000, qsa_deadline: "", next_due_date: "2025-12-01", planned_cod: "2028-01-01", feasibility_study_status: "Complete", feasibility_study_completion_date: "2024-09-01", system_impact_study_status: "In Progress", system_impact_study_completion_date: "2025-09-01", facilities_study_status: "Not Started", facilities_study_completion_date: "", ia_execution_date: "", pjm_queue_position: "", pjm_transition_cycle: "", pjm_cluster_window: "", miso_dpp_phase: "", miso_definitive_planning_phase: "", spp_disis_cluster: "", spp_study_group: "", caiso_cluster: "Cluster 15", caiso_phase: "Phase II", caiso_zone: "SP26", security_milestones: "[]", created_at: "2024-06-15", updated_at: "2025-02-01" },
  5: { id: 5, project_name: "Prairie Wind SPP", description: "300 MW wind project in Woodward County, OK", fuel_type: "Wind", size_mw: 300, capacity_mw: 250, co_located: "No", co_located_fuel_type: "", co_located_size_mw: 0, state: "OK", county: "Woodward", latitude: 36.42, longitude: -99.39, iso_region: "SPP", queue_number: "DISIS-2024-089", queue_cycle: "DISIS 2024", utility: "OGE", poi: "Woodward 345kV", poi_voltage: 345, project_manager: "Lisa Park", admin_emails: "", developer_emails: "", interconnection_status: "Feasibility Study", option_to_build: "", suspension: "No", provisional_ia_status: "", ssr_status: "", security_posted_to_date: 900000, security_at_risk_to_date: 500000, study_deposits_posted: 120000, sunk_cost_to_date: 180000, interconnection_facilities_cost: 12000000, grid_network_upgrades: 9000000, affected_system_costs: 1500000, affected_system: "MISO", lgia_security: 0, next_security_milestone: 1200000, qsa_deadline: "", next_due_date: "2025-07-15", planned_cod: "2028-06-01", feasibility_study_status: "In Progress", feasibility_study_completion_date: "2025-06-01", system_impact_study_status: "Not Started", system_impact_study_completion_date: "", facilities_study_status: "Not Started", facilities_study_completion_date: "", ia_execution_date: "", pjm_queue_position: "", pjm_transition_cycle: "", pjm_cluster_window: "", miso_dpp_phase: "", miso_definitive_planning_phase: "", spp_disis_cluster: "DISIS 2024-1", spp_study_group: "SG-24-089", caiso_cluster: "", caiso_phase: "", caiso_zone: "", security_milestones: "[]", created_at: "2025-01-10", updated_at: "2025-03-05" },
  6: { id: 6, project_name: "Texas Solar Ranch", description: "500 MW utility-scale solar in Webb County, TX", fuel_type: "Solar", size_mw: 500, capacity_mw: 450, co_located: "No", co_located_fuel_type: "", co_located_size_mw: 0, state: "TX", county: "Webb", latitude: 27.56, longitude: -99.49, iso_region: "ERCOT", queue_number: "INR-2023-1105", queue_cycle: "2023", utility: "Oncor", poi: "Laredo 345kV", poi_voltage: 345, project_manager: "Carlos Mendez", admin_emails: "", developer_emails: "", interconnection_status: "Commercial Operation", option_to_build: "", suspension: "No", provisional_ia_status: "", ssr_status: "", security_posted_to_date: 6000000, security_at_risk_to_date: 0, study_deposits_posted: 350000, sunk_cost_to_date: 900000, interconnection_facilities_cost: 45000000, grid_network_upgrades: 38000000, affected_system_costs: 0, affected_system: "", lgia_security: 0, next_security_milestone: 0, qsa_deadline: "", next_due_date: "", planned_cod: "2025-09-01", feasibility_study_status: "Complete", feasibility_study_completion_date: "2023-06-01", system_impact_study_status: "Complete", system_impact_study_completion_date: "2024-01-15", facilities_study_status: "Complete", facilities_study_completion_date: "2024-06-01", ia_execution_date: "2024-09-15", pjm_queue_position: "", pjm_transition_cycle: "", pjm_cluster_window: "", miso_dpp_phase: "", miso_definitive_planning_phase: "", spp_disis_cluster: "", spp_study_group: "", caiso_cluster: "", caiso_phase: "", caiso_zone: "", security_milestones: "[]", created_at: "2023-05-01", updated_at: "2025-09-01" },
  7: { id: 7, project_name: "Appalachian Wind", description: "275 MW wind project in Grant County, WV", fuel_type: "Wind", size_mw: 275, capacity_mw: 220, co_located: "No", co_located_fuel_type: "", co_located_size_mw: 0, state: "WV", county: "Grant", latitude: 38.99, longitude: -79.18, iso_region: "PJM", queue_number: "AF2-567", queue_cycle: "Transition Cycle 2", utility: "AEP", poi: "Mt Storm 500kV", poi_voltage: 500, project_manager: "David Kim", admin_emails: "", developer_emails: "", interconnection_status: "Feasibility Study", option_to_build: "", suspension: "No", provisional_ia_status: "", ssr_status: "", security_posted_to_date: 400000, security_at_risk_to_date: 150000, study_deposits_posted: 60000, sunk_cost_to_date: 95000, interconnection_facilities_cost: 18000000, grid_network_upgrades: 14000000, affected_system_costs: 2500000, affected_system: "MISO", lgia_security: 0, next_security_milestone: 500000, qsa_deadline: "", next_due_date: "2025-10-01", planned_cod: "2029-03-01", feasibility_study_status: "In Progress", feasibility_study_completion_date: "2025-08-01", system_impact_study_status: "Not Started", system_impact_study_completion_date: "", facilities_study_status: "Not Started", facilities_study_completion_date: "", ia_execution_date: "", pjm_queue_position: "AF2-567", pjm_transition_cycle: "Transition Cycle 2", pjm_cluster_window: "2024 Q1", miso_dpp_phase: "", miso_definitive_planning_phase: "", spp_disis_cluster: "", spp_study_group: "", caiso_cluster: "", caiso_phase: "", caiso_zone: "", security_milestones: "[]", created_at: "2025-02-01", updated_at: "2025-03-10" },
  8: { id: 8, project_name: "Nevada BESS", description: "250 MW battery storage in Clark County, NV", fuel_type: "Battery Storage", size_mw: 250, capacity_mw: 250, co_located: "No", co_located_fuel_type: "", co_located_size_mw: 0, state: "NV", county: "Clark", latitude: 36.17, longitude: -115.14, iso_region: "CAISO", queue_number: "CL2023-789", queue_cycle: "Cluster 15", utility: "NVE", poi: "Eldorado 230kV", poi_voltage: 230, project_manager: "Anna Rivera", admin_emails: "", developer_emails: "", interconnection_status: "Facilities Study", option_to_build: "", suspension: "No", provisional_ia_status: "", ssr_status: "", security_posted_to_date: 2800000, security_at_risk_to_date: 2200000, study_deposits_posted: 300000, sunk_cost_to_date: 420000, interconnection_facilities_cost: 20000000, grid_network_upgrades: 16000000, affected_system_costs: 0, affected_system: "", lgia_security: 0, next_security_milestone: 2000000, qsa_deadline: "", next_due_date: "2025-11-01", planned_cod: "2027-09-01", feasibility_study_status: "Complete", feasibility_study_completion_date: "2024-07-01", system_impact_study_status: "Complete", system_impact_study_completion_date: "2024-12-01", facilities_study_status: "In Progress", facilities_study_completion_date: "2025-07-01", ia_execution_date: "", pjm_queue_position: "", pjm_transition_cycle: "", pjm_cluster_window: "", miso_dpp_phase: "", miso_definitive_planning_phase: "", spp_disis_cluster: "", spp_study_group: "", caiso_cluster: "Cluster 15", caiso_phase: "Phase II", caiso_zone: "SP26", security_milestones: "[]", created_at: "2024-07-15", updated_at: "2025-01-30" },
  9: { id: 9, project_name: "Gulf Coast Wind", description: "450 MW wind farm in Cameron County, LA", fuel_type: "Wind", size_mw: 450, capacity_mw: 380, co_located: "No", co_located_fuel_type: "", co_located_size_mw: 0, state: "LA", county: "Cameron", latitude: 29.80, longitude: -93.33, iso_region: "MISO", queue_number: "J1198", queue_cycle: "DPP 2024", utility: "Entergy", poi: "Nelson 230kV", poi_voltage: 230, project_manager: "Robert Williams", admin_emails: "", developer_emails: "", interconnection_status: "System Impact Study", option_to_build: "", suspension: "No", provisional_ia_status: "", ssr_status: "", security_posted_to_date: 1500000, security_at_risk_to_date: 1000000, study_deposits_posted: 200000, sunk_cost_to_date: 310000, interconnection_facilities_cost: 28000000, grid_network_upgrades: 22000000, affected_system_costs: 5000000, affected_system: "SPP", lgia_security: 0, next_security_milestone: 2800000, qsa_deadline: "", next_due_date: "2025-08-15", planned_cod: "2028-09-01", feasibility_study_status: "Complete", feasibility_study_completion_date: "2025-01-15", system_impact_study_status: "In Progress", system_impact_study_completion_date: "2025-07-01", facilities_study_status: "Not Started", facilities_study_completion_date: "", ia_execution_date: "", pjm_queue_position: "", pjm_transition_cycle: "", pjm_cluster_window: "", miso_dpp_phase: "Phase 1", miso_definitive_planning_phase: "DPP 2024", spp_disis_cluster: "", spp_study_group: "", caiso_cluster: "", caiso_phase: "", caiso_zone: "", security_milestones: "[]", created_at: "2024-09-01", updated_at: "2025-02-20" },
  10: { id: 10, project_name: "Carolina Hybrid", description: "320 MW solar + storage hybrid in Cumberland County, NC", fuel_type: "Solar + Storage", size_mw: 320, capacity_mw: 260, co_located: "Yes", co_located_fuel_type: "Battery Storage", co_located_size_mw: 80, state: "NC", county: "Cumberland", latitude: 35.05, longitude: -78.88, iso_region: "PJM", queue_number: "AH2-890", queue_cycle: "Transition Cycle 2", utility: "Duke", poi: "Fayetteville 230kV", poi_voltage: 230, project_manager: "Patricia Lee", admin_emails: "", developer_emails: "", interconnection_status: "System Impact Study", option_to_build: "", suspension: "No", provisional_ia_status: "", ssr_status: "", security_posted_to_date: 1800000, security_at_risk_to_date: 1200000, study_deposits_posted: 280000, sunk_cost_to_date: 350000, interconnection_facilities_cost: 24000000, grid_network_upgrades: 19000000, affected_system_costs: 3000000, affected_system: "", lgia_security: 0, next_security_milestone: 1600000, qsa_deadline: "", next_due_date: "2025-09-15", planned_cod: "2028-03-01", feasibility_study_status: "Complete", feasibility_study_completion_date: "2024-10-01", system_impact_study_status: "In Progress", system_impact_study_completion_date: "2025-06-15", facilities_study_status: "Not Started", facilities_study_completion_date: "", ia_execution_date: "", pjm_queue_position: "AH2-890", pjm_transition_cycle: "Transition Cycle 2", pjm_cluster_window: "2024 Q2", miso_dpp_phase: "", miso_definitive_planning_phase: "", spp_disis_cluster: "", spp_study_group: "", caiso_cluster: "", caiso_phase: "", caiso_zone: "", security_milestones: "[]", created_at: "2024-10-01", updated_at: "2025-02-28" },
  11: { id: 11, project_name: "Kansas Wind Farm", description: "400 MW wind farm in Ford County, KS", fuel_type: "Wind", size_mw: 400, capacity_mw: 340, co_located: "No", co_located_fuel_type: "", co_located_size_mw: 0, state: "KS", county: "Ford", latitude: 37.77, longitude: -99.89, iso_region: "SPP", queue_number: "DISIS-2022-045", queue_cycle: "DISIS 2022", utility: "Evergy", poi: "Dodge City 345kV", poi_voltage: 345, project_manager: "Tom Anderson", admin_emails: "", developer_emails: "", interconnection_status: "Commercial Operation", option_to_build: "", suspension: "No", provisional_ia_status: "", ssr_status: "", security_posted_to_date: 7500000, security_at_risk_to_date: 0, study_deposits_posted: 400000, sunk_cost_to_date: 1200000, interconnection_facilities_cost: 55000000, grid_network_upgrades: 42000000, affected_system_costs: 8000000, affected_system: "MISO", lgia_security: 0, next_security_milestone: 0, qsa_deadline: "", next_due_date: "", planned_cod: "2025-12-01", feasibility_study_status: "Complete", feasibility_study_completion_date: "2023-03-01", system_impact_study_status: "Complete", system_impact_study_completion_date: "2023-09-01", facilities_study_status: "Complete", facilities_study_completion_date: "2024-03-01", ia_execution_date: "2024-07-15", pjm_queue_position: "", pjm_transition_cycle: "", pjm_cluster_window: "", miso_dpp_phase: "", miso_definitive_planning_phase: "", spp_disis_cluster: "DISIS 2022-1", spp_study_group: "SG-22-045", caiso_cluster: "", caiso_phase: "", caiso_zone: "", security_milestones: "[]", created_at: "2022-06-01", updated_at: "2025-12-01" },
  12: { id: 12, project_name: "New England Solar", description: "120 MW solar project in Berkshire County, MA", fuel_type: "Solar", size_mw: 120, capacity_mw: 100, co_located: "No", co_located_fuel_type: "", co_located_size_mw: 0, state: "MA", county: "Berkshire", latitude: 42.45, longitude: -73.25, iso_region: "ISO-NE", queue_number: "NE-2024-0331", queue_cycle: "2024", utility: "Eversource", poi: "Berkshire 115kV", poi_voltage: 115, project_manager: "Jennifer White", admin_emails: "", developer_emails: "", interconnection_status: "Facilities Study", option_to_build: "", suspension: "No", provisional_ia_status: "", ssr_status: "", security_posted_to_date: 1200000, security_at_risk_to_date: 900000, study_deposits_posted: 150000, sunk_cost_to_date: 210000, interconnection_facilities_cost: 10000000, grid_network_upgrades: 7500000, affected_system_costs: 1000000, affected_system: "NYISO", lgia_security: 0, next_security_milestone: 800000, qsa_deadline: "", next_due_date: "2025-07-01", planned_cod: "2027-06-01", feasibility_study_status: "Complete", feasibility_study_completion_date: "2024-11-01", system_impact_study_status: "Complete", system_impact_study_completion_date: "2025-02-15", facilities_study_status: "In Progress", facilities_study_completion_date: "2025-06-01", ia_execution_date: "", pjm_queue_position: "", pjm_transition_cycle: "", pjm_cluster_window: "", miso_dpp_phase: "", miso_definitive_planning_phase: "", spp_disis_cluster: "", spp_study_group: "", caiso_cluster: "", caiso_phase: "", caiso_zone: "", security_milestones: "[]", created_at: "2024-12-01", updated_at: "2025-03-01" },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pid = Number(params.id);
    fetch(`/api/projects/${pid}`)
      .then((r) => {
        if (!r.ok) throw new Error("API unavailable");
        return r.json();
      })
      .then((data) => {
        if (data && data.id) {
          // Ensure security_milestones is a string for JSON.parse
          if (typeof data.security_milestones !== "string") {
            data.security_milestones = JSON.stringify(data.security_milestones || []);
          }
          setProject(data);
        } else {
          setProject(MOCK_PROJECTS[pid] || null);
        }
        setLoading(false);
      })
      .catch(() => {
        setProject(MOCK_PROJECTS[pid] || null);
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

        {/* Study Results & Attachments */}
        <Section title="Study Results & Attachments">
          <div className="space-y-6">
            {/* Congestion Results */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                Congestion Study Results
              </h4>
              <div className="space-y-2">
                {[
                  { name: "Congestion_Analysis_N1_Report.pdf", size: "2.4 MB", date: "2026-01-15", by: "Sarah Chen", type: "Congestion" },
                  { name: "Thermal_Loading_Results_Summer_Peak.xlsx", size: "890 KB", date: "2026-02-03", by: "Mike Johnson", type: "Congestion" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-sm font-bold">
                        {f.name.endsWith(".pdf") ? "PDF" : "XLS"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{f.name}</p>
                        <p className="text-xs text-slate-400">{f.size} · Uploaded {new Date(f.date).toLocaleDateString()} by {f.by}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{f.type}</span>
                      <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">Download</button>
                    </div>
                  </div>
                ))}
                <button className="w-full rounded-lg border-2 border-dashed border-slate-300 p-3 text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors">
                  + Upload Congestion Results
                </button>
              </div>
            </div>

            {/* Power Flow Results */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                Power Flow Study Results
              </h4>
              <div className="space-y-2">
                {[
                  { name: "PowerFlow_BaseCase_2026_Summer.pdf", size: "5.1 MB", date: "2026-01-20", by: "Sarah Chen", type: "Power Flow" },
                  { name: "Voltage_Impact_Analysis.pdf", size: "1.8 MB", date: "2026-02-10", by: "David Park", type: "Power Flow" },
                  { name: "N1_Contingency_Results.xlsx", size: "3.2 MB", date: "2026-02-15", by: "Sarah Chen", type: "Power Flow" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
                        {f.name.endsWith(".pdf") ? "PDF" : "XLS"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{f.name}</p>
                        <p className="text-xs text-slate-400">{f.size} · Uploaded {new Date(f.date).toLocaleDateString()} by {f.by}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{f.type}</span>
                      <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">Download</button>
                    </div>
                  </div>
                ))}
                <button className="w-full rounded-lg border-2 border-dashed border-slate-300 p-3 text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors">
                  + Upload Power Flow Results
                </button>
              </div>
            </div>

            {/* Other Documents */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Other Documents
              </h4>
              <div className="space-y-2">
                {[
                  { name: "One_Line_Diagram_POI.pdf", size: "450 KB", date: "2025-11-05", by: "John V", type: "Diagram" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-bold">
                        {f.name.endsWith(".pdf") ? "PDF" : "DOC"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{f.name}</p>
                        <p className="text-xs text-slate-400">{f.size} · Uploaded {new Date(f.date).toLocaleDateString()} by {f.by}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{f.type}</span>
                      <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">Download</button>
                    </div>
                  </div>
                ))}
                <button className="w-full rounded-lg border-2 border-dashed border-slate-300 p-3 text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors">
                  + Upload Document
                </button>
              </div>
            </div>
          </div>
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
