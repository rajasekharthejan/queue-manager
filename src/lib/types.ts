export interface Project {
  id?: number;
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
  commercial_operation_milestone: string;

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

  phase3_study_status: string;
  phase3_study_completion_date: string;

  congestion_results: string;
  power_flow_results: string;

  serc_queue_id: string;

  security_milestones: string;

  created_at?: string;
  updated_at?: string;
}

export interface SecurityMilestone {
  date: string;
  milestone_name: string;
  amount: number;
  type: "deposit" | "security";
  at_risk: boolean;
  refundable: boolean;
}

export const ISO_REGIONS = ["PJM", "MISO", "SPP", "CAISO", "NYISO", "ISO-NE", "ERCOT", "SERC"] as const;

export const FUEL_TYPES = [
  "Solar",
  "Wind",
  "Battery Storage",
  "Solar + Storage",
  "Wind + Storage",
  "Natural Gas",
  "Hybrid",
  "Nuclear",
  "Hydro",
  "Geothermal",
] as const;

export const INTERCONNECTION_STATUSES = [
  "Pre-Application",
  "Feasibility Study",
  "System Impact Study",
  "Facilities Study",
  "IA Negotiation",
  "IA Executed",
  "Under Construction",
  "Commercial Operation",
  "Suspended",
  "Withdrawn",
] as const;

export const STUDY_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
  "Restudy Required",
] as const;

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC"
] as const;
