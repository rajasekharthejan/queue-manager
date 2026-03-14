-- ============================================================================
-- QueueManager: Projects Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,

  -- Basic Project Info
  project_name TEXT NOT NULL,
  description TEXT,
  fuel_type TEXT NOT NULL DEFAULT 'Solar',
  size_mw NUMERIC NOT NULL DEFAULT 0,
  capacity_mw NUMERIC DEFAULT 0,
  co_located TEXT DEFAULT 'No',
  co_located_fuel_type TEXT,
  co_located_size_mw NUMERIC DEFAULT 0,

  -- Location
  state TEXT,
  county TEXT,
  latitude NUMERIC,
  longitude NUMERIC,

  -- ISO / Queue Info
  iso_region TEXT NOT NULL DEFAULT 'PJM',
  queue_number TEXT,
  queue_cycle TEXT,
  utility TEXT,
  poi TEXT,
  poi_voltage NUMERIC,

  -- People
  project_manager TEXT,
  admin_emails TEXT,
  developer_emails TEXT,

  -- Interconnection Status
  interconnection_status TEXT,
  option_to_build TEXT DEFAULT 'Full Build',
  suspension TEXT DEFAULT 'No',
  provisional_ia_status TEXT DEFAULT 'Not Available',
  ssr_status TEXT,

  -- Financial: Security & Deposits
  security_posted_to_date NUMERIC DEFAULT 0,
  security_at_risk_to_date NUMERIC DEFAULT 0,
  study_deposits_posted NUMERIC DEFAULT 0,
  sunk_cost_to_date NUMERIC DEFAULT 0,

  -- Financial: Costs
  interconnection_facilities_cost NUMERIC DEFAULT 0,
  grid_network_upgrades NUMERIC DEFAULT 0,
  affected_system_costs NUMERIC DEFAULT 0,
  affected_system TEXT,

  -- LGIA / Security
  lgia_security NUMERIC DEFAULT 0,
  next_security_milestone NUMERIC DEFAULT 0,

  -- Milestones & Dates
  qsa_deadline TEXT,
  next_due_date TEXT,
  planned_cod TEXT,

  -- Study Statuses
  feasibility_study_status TEXT DEFAULT 'Not Started',
  feasibility_study_completion_date TEXT,
  system_impact_study_status TEXT DEFAULT 'Not Started',
  system_impact_study_completion_date TEXT,
  facilities_study_status TEXT DEFAULT 'Not Started',
  facilities_study_completion_date TEXT,
  ia_execution_date TEXT,
  commercial_operation_milestone TEXT,

  -- PJM Specific
  pjm_queue_position TEXT,
  pjm_transition_cycle TEXT,
  pjm_cluster_window TEXT,

  -- MISO Specific
  miso_dpp_phase TEXT,
  miso_definitive_planning_phase TEXT,

  -- SPP Specific
  spp_disis_cluster TEXT,
  spp_study_group TEXT,

  -- CAISO Specific
  caiso_cluster TEXT,
  caiso_phase TEXT,
  caiso_zone TEXT,

  -- Security Milestone Schedule (JSON array)
  security_milestones JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_iso ON projects(iso_region);
CREATE INDEX IF NOT EXISTS idx_projects_state ON projects(state);
CREATE INDEX IF NOT EXISTS idx_projects_fuel ON projects(fuel_type);
CREATE INDEX IF NOT EXISTS idx_projects_queue ON projects(queue_number);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(interconnection_status);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Disable RLS for now (admin-only app)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON projects FOR ALL USING (true) WITH CHECK (true);
