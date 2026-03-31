// Static demo data for frontend-only demo mode
// No API calls needed - all data is hardcoded here

export var DEMO_USER = {
  email: 'demo@betweenvisits.com',
  role: 'admin',
  agency_id: 'demo-agency-001',
  first_name: 'Demo',
  last_name: 'Admin'
};

export var DEMO_PATIENTS = [
  {
    id: 'demo-p1',
    agency_id: 'demo-agency-001',
    first_name: 'Harold',
    last_name: 'Thompson',
    date_of_birth: '1941-03-15',
    medical_conditions: ['Congestive Heart Failure', 'Type 2 Diabetes', 'Hypertension'],
    medications: ['Metformin 500mg', 'Lisinopril 20mg', 'Furosemide 40mg', 'Aspirin 81mg'],
    caregiver_name: 'Linda Thompson',
    caregiver_phone: '555-0142',
    caregiver_email: 'linda.t@email.com',
    risk_level: 'critical',
    assigned_caregiver_id: 'demo-staff-2',
    assigned_first: 'Maria',
    assigned_last: 'Santos',
    total_check_ins: '12',
    last_check_in: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-p2',
    agency_id: 'demo-agency-001',
    first_name: 'Robert',
    last_name: 'Williams',
    date_of_birth: '1938-09-22',
    medical_conditions: ['COPD', 'Atrial Fibrillation', 'Osteoarthritis'],
    medications: ['Warfarin 5mg', 'Albuterol inhaler', 'Prednisone 10mg'],
    caregiver_name: 'Susan Williams',
    caregiver_phone: '555-0198',
    caregiver_email: 'susan.w@email.com',
    risk_level: 'critical',
    assigned_caregiver_id: 'demo-staff-2',
    assigned_first: 'Maria',
    assigned_last: 'Santos',
    total_check_ins: '9',
    last_check_in: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-p3',
    agency_id: 'demo-agency-001',
    first_name: 'Dorothy',
    last_name: 'Martinez',
    date_of_birth: '1945-07-10',
    medical_conditions: ['Alzheimer\'s Disease', 'Hypertension', 'Osteoporosis'],
    medications: ['Donepezil 10mg', 'Amlodipine 5mg', 'Calcium + Vitamin D'],
    caregiver_name: 'Carlos Martinez',
    caregiver_phone: '555-0167',
    caregiver_email: 'carlos.m@email.com',
    risk_level: 'elevated',
    assigned_caregiver_id: 'demo-staff-3',
    assigned_first: 'James',
    assigned_last: 'Wilson',
    total_check_ins: '15',
    last_check_in: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-p4',
    agency_id: 'demo-agency-001',
    first_name: 'Betty',
    last_name: 'Anderson',
    date_of_birth: '1950-11-30',
    medical_conditions: ['Parkinson\'s Disease', 'Depression'],
    medications: ['Levodopa/Carbidopa', 'Sertraline 50mg'],
    caregiver_name: 'Tom Anderson',
    caregiver_phone: '555-0134',
    caregiver_email: 'tom.a@email.com',
    risk_level: 'routine',
    assigned_caregiver_id: 'demo-staff-3',
    assigned_first: 'James',
    assigned_last: 'Wilson',
    total_check_ins: '8',
    last_check_in: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-p5',
    agency_id: 'demo-agency-001',
    first_name: 'Margaret',
    last_name: 'Chen',
    date_of_birth: '1948-04-18',
    medical_conditions: ['Type 2 Diabetes', 'Chronic Kidney Disease Stage 3'],
    medications: ['Insulin Glargine', 'Metformin 1000mg', 'Losartan 50mg'],
    caregiver_name: 'Lisa Chen',
    caregiver_phone: '555-0156',
    caregiver_email: 'lisa.c@email.com',
    risk_level: 'moderate',
    assigned_caregiver_id: 'demo-staff-2',
    assigned_first: 'Maria',
    assigned_last: 'Santos',
    total_check_ins: '11',
    last_check_in: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  }
];

export var DEMO_ALERTS = [
  {
    id: 'demo-a1',
    patient_id: 'demo-p1',
    patient_name: 'Harold Thompson',
    first_name: 'Harold',
    last_name: 'Thompson',
    severity: 'critical',
    alert_type: 'vitals',
    title: 'Critical vital signs detected',
    description: 'Patient reported severe chest pain (8/10), elevated heart rate (115 bpm), and temperature of 101.2F. Fall incident reported. Missed morning blood pressure medication.',
    status: 'pending',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    ai_call_script: 'Call Linda Thompson at 555-0142. Ask: 1) Is Harold experiencing chest pain right now? 2) Has he taken his Furosemide today? 3) Can you check his blood pressure? 4) Is he having difficulty breathing? If chest pain is ongoing, advise calling 911 immediately.',
    caregiver_name: 'Linda Thompson',
    caregiver_phone: '555-0142'
  },
  {
    id: 'demo-a2',
    patient_id: 'demo-p2',
    patient_name: 'Robert Williams',
    first_name: 'Robert',
    last_name: 'Williams',
    severity: 'critical',
    alert_type: 'medications',
    title: 'Missed critical medications',
    description: 'Patient missed Warfarin for 2 consecutive days. New symptoms reported: shortness of breath and dizziness. Mobility has declined from assisted to limited.',
    status: 'acknowledged',
    assigned_to: 'Maria Santos',
    acknowledged_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    ai_call_script: 'Call Susan Williams at 555-0198. Ask: 1) Why has Robert missed his Warfarin? 2) Is he experiencing any bleeding or bruising? 3) How severe is the shortness of breath? 4) Can he walk to the bathroom unassisted? Emphasize importance of resuming Warfarin immediately.',
    caregiver_name: 'Susan Williams',
    caregiver_phone: '555-0198'
  },
  {
    id: 'demo-a3',
    patient_id: 'demo-p3',
    patient_name: 'Dorothy Martinez',
    first_name: 'Dorothy',
    last_name: 'Martinez',
    severity: 'elevated',
    alert_type: 'cognitive',
    title: 'Increased confusion reported',
    description: 'Caregiver reports significant increase in confusion and disorientation over past 48 hours. Patient did not recognize family members during morning visit. Mood noted as agitated.',
    status: 'pending',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    ai_call_script: 'Call Carlos Martinez at 555-0167. Ask: 1) When did you first notice the increased confusion? 2) Has Dorothy had any recent falls or head injuries? 3) Is she eating and drinking normally? 4) Has there been any change in her sleep patterns? Consider requesting a UTI screening as infections can cause sudden confusion in elderly patients.',
    caregiver_name: 'Carlos Martinez',
    caregiver_phone: '555-0167'
  },
  {
    id: 'demo-a4',
    patient_id: 'demo-p5',
    patient_name: 'Margaret Chen',
    first_name: 'Margaret',
    last_name: 'Chen',
    severity: 'elevated',
    alert_type: 'vitals',
    title: 'Blood sugar trending high',
    description: 'Blood glucose readings have been consistently above 250 mg/dL for the past 3 check-ins. Patient reports increased thirst and frequent urination. Insulin adherence appears inconsistent.',
    status: 'pending',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    ai_call_script: 'Call Lisa Chen at 555-0156. Ask: 1) Is Margaret taking her insulin as prescribed? 2) Has there been a change in her diet recently? 3) Is she experiencing any nausea or blurred vision? 4) When was her last A1C test? Recommend scheduling an urgent appointment with her endocrinologist.',
    caregiver_name: 'Lisa Chen',
    caregiver_phone: '555-0156'
  }
];

export var DEMO_DASHBOARD = {
  riskDistribution: [
    { risk_level: 'critical', count: '2' },
    { risk_level: 'elevated', count: '1' },
    { risk_level: 'moderate', count: '1' },
    { risk_level: 'routine', count: '1' }
  ],
  totalPatients: '5',
  recentCheckIns: '14',
  pendingAlerts: [
    { severity: 'critical', count: '1' },
    { severity: 'elevated', count: '2' }
  ],
  dailyTrends: [
    { date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0], check_ins: '2', avg_risk_score: '35', high_risk_count: '0' },
    { date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], check_ins: '3', avg_risk_score: '42', high_risk_count: '1' },
    { date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], check_ins: '1', avg_risk_score: '28', high_risk_count: '0' },
    { date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], check_ins: '2', avg_risk_score: '55', high_risk_count: '1' },
    { date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], check_ins: '3', avg_risk_score: '61', high_risk_count: '2' },
    { date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], check_ins: '2', avg_risk_score: '72', high_risk_count: '2' },
    { date: new Date().toISOString().split('T')[0], check_ins: '1', avg_risk_score: '68', high_risk_count: '1' }
  ]
};

export var DEMO_CHECK_INS = {
  'demo-p1': [
    {
      id: 'demo-ci-1',
      patient_id: 'demo-p1',
      submitted_by: 'Linda Thompson',
      submitted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      pain_level: 8,
      risk_score: 85,
      risk_level: 'critical',
      ai_summary: 'Critical check-in: Patient reports severe chest pain (8/10) with elevated heart rate of 115 bpm and fever of 101.2F. Fall incident reported during bathroom visit. Missed morning Lisinopril dose. Immediate follow-up recommended.'
    },
    {
      id: 'demo-ci-2',
      patient_id: 'demo-p1',
      submitted_by: 'Maria Santos',
      submitted_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      pain_level: 4,
      risk_score: 45,
      risk_level: 'moderate',
      ai_summary: 'Moderate concern: Patient reports mild chest discomfort (4/10), stable vitals. All medications taken. Mobility slightly reduced compared to previous check-in. Continue monitoring.'
    },
    {
      id: 'demo-ci-3',
      patient_id: 'demo-p1',
      submitted_by: 'Linda Thompson',
      submitted_at: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
      pain_level: 2,
      risk_score: 22,
      risk_level: 'routine',
      ai_summary: 'Routine check-in: Patient in good spirits. Minor knee stiffness (2/10). All medications taken on schedule. Vitals within normal range. No new concerns.'
    }
  ],
  'demo-p2': [
    {
      id: 'demo-ci-4',
      patient_id: 'demo-p2',
      submitted_by: 'Susan Williams',
      submitted_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      pain_level: 3,
      risk_score: 78,
      risk_level: 'critical',
      ai_summary: 'Critical: Patient missed Warfarin for second consecutive day. New shortness of breath and dizziness reported. Mobility declined from assisted to limited. Urgent medication review needed.'
    }
  ],
  'demo-p3': [
    {
      id: 'demo-ci-5',
      patient_id: 'demo-p3',
      submitted_by: 'Carlos Martinez',
      submitted_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      pain_level: 1,
      risk_score: 52,
      risk_level: 'elevated',
      ai_summary: 'Elevated concern: Significant increase in confusion and disorientation. Patient did not recognize son during morning visit. Mood agitated. All medications taken. Recommend cognitive assessment.'
    }
  ],
  'demo-p4': [
    {
      id: 'demo-ci-6',
      patient_id: 'demo-p4',
      submitted_by: 'Tom Anderson',
      submitted_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      pain_level: 2,
      risk_score: 18,
      risk_level: 'routine',
      ai_summary: 'Routine: Patient stable. Mild tremor in left hand as expected with Parkinson\'s. Mood slightly low but responsive. All medications taken. Good appetite and sleep.'
    }
  ],
  'demo-p5': [
    {
      id: 'demo-ci-7',
      patient_id: 'demo-p5',
      submitted_by: 'Lisa Chen',
      submitted_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      pain_level: 1,
      risk_score: 48,
      risk_level: 'elevated',
      ai_summary: 'Elevated: Blood glucose reading of 267 mg/dL, third consecutive high reading. Patient reports increased thirst. Insulin may not have been administered correctly. Dietary review recommended.'
    }
  ]
};

export var DEMO_STAFF = [
  { id: 'demo-staff-1', email: 'demo@betweenvisits.com', first_name: 'Demo', last_name: 'Admin', role: 'admin' },
  { id: 'demo-staff-2', email: 'maria@betweenvisits.com', first_name: 'Maria', last_name: 'Santos', role: 'caregiver' },
  { id: 'demo-staff-3', email: 'james@betweenvisits.com', first_name: 'James', last_name: 'Wilson', role: 'caregiver' }
];
