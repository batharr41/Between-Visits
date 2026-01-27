import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/careops_signal'
});

const schema = `
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  medical_conditions TEXT[],
  medications TEXT[],
  caregiver_name VARCHAR(255),
  caregiver_phone VARCHAR(20),
  risk_level VARCHAR(20) DEFAULT 'routine',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Check-ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  submitted_by VARCHAR(100),
  submitted_at TIMESTAMP DEFAULT NOW(),
  
  -- Structured check-in data
  pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 10),
  pain_location VARCHAR(255),
  mobility_status VARCHAR(50),
  appetite VARCHAR(50),
  sleep_quality VARCHAR(50),
  mood VARCHAR(50),
  
  -- Medications
  medications_taken BOOLEAN,
  missed_medications TEXT[],
  
  -- Vital signs
  temperature DECIMAL(4,1),
  blood_pressure VARCHAR(20),
  heart_rate INTEGER,
  
  -- Concerns
  new_symptoms TEXT[],
  fall_incident BOOLEAN DEFAULT false,
  catheter_concerns BOOLEAN DEFAULT false,
  wound_concerns BOOLEAN DEFAULT false,
  
  -- Free text
  additional_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Risk scores table
CREATE TABLE IF NOT EXISTS risk_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_in_id UUID REFERENCES check_ins(id) ON DELETE CASCADE,
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  risk_level VARCHAR(20),
  risk_factors TEXT[],
  explanation TEXT,
  calculated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(check_in_id)
);

-- LLM summaries table
CREATE TABLE IF NOT EXISTS llm_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_in_id UUID REFERENCES check_ins(id) ON DELETE CASCADE,
  summary_type VARCHAR(50),
  content TEXT,
  grounding_data JSONB,
  model_used VARCHAR(50),
  tokens_used INTEGER,
  generated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(check_in_id, summary_type)
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  check_in_id UUID REFERENCES check_ins(id) ON DELETE CASCADE,
  severity VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  action_needed TEXT,
  
  status VARCHAR(20) DEFAULT 'pending',
  assigned_to VARCHAR(255),
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Triage queue table
CREATE TABLE IF NOT EXISTS triage_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 50,
  call_script TEXT,
  suggested_actions TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(alert_id)
);

-- Staff users table
CREATE TABLE IF NOT EXISTS staff_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES staff_users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_agency ON patients(agency_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_patient ON check_ins(patient_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_submitted_at ON check_ins(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_patient ON alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_scores_check_in ON risk_scores(check_in_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up database schema...');
    await client.query(schema);
    console.log('✅ Database schema created successfully!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase().catch(console.error);
