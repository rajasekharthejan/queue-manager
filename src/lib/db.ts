import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "queue-manager.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      -- Basic Project Info
      project_name TEXT NOT NULL,
      description TEXT,
      fuel_type TEXT NOT NULL DEFAULT 'Solar',
      size_mw REAL NOT NULL DEFAULT 0,
      capacity_mw REAL DEFAULT 0,
      co_located TEXT DEFAULT 'No',
      co_located_fuel_type TEXT,
      co_located_size_mw REAL DEFAULT 0,

      -- Location
      state TEXT,
      county TEXT,
      latitude REAL,
      longitude REAL,

      -- ISO / Queue Info
      iso_region TEXT NOT NULL DEFAULT 'PJM',
      queue_number TEXT,
      queue_cycle TEXT,
      utility TEXT,
      poi TEXT,
      poi_voltage REAL,

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
      security_posted_to_date REAL DEFAULT 0,
      security_at_risk_to_date REAL DEFAULT 0,
      study_deposits_posted REAL DEFAULT 0,
      sunk_cost_to_date REAL DEFAULT 0,

      -- Financial: Costs
      interconnection_facilities_cost REAL DEFAULT 0,
      grid_network_upgrades REAL DEFAULT 0,
      affected_system_costs REAL DEFAULT 0,
      affected_system TEXT,

      -- LGIA / Security
      lgia_security REAL DEFAULT 0,
      next_security_milestone REAL DEFAULT 0,

      -- Milestones & Dates
      qsa_deadline TEXT,
      next_due_date TEXT,
      planned_cod TEXT,

      -- BPM-15 / PJM Specific Fields
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
      -- Each entry: { date, milestone_name, amount, type: 'deposit'|'security', at_risk: bool }
      security_milestones TEXT DEFAULT '[]',

      -- Timestamps
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_projects_iso ON projects(iso_region);
    CREATE INDEX IF NOT EXISTS idx_projects_state ON projects(state);
    CREATE INDEX IF NOT EXISTS idx_projects_fuel ON projects(fuel_type);
    CREATE INDEX IF NOT EXISTS idx_projects_queue ON projects(queue_number);
  `);
}
