import pool from './pool.js';
import bcrypt from 'bcrypt';

async function seed() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Seeding database...');
    
    // Create sample agency
    const agencyResult = await client.query(
      `INSERT INTO agencies (name, contact_email)
       VALUES ('Sunrise Home Care', 'contact@sunrisehomecare.com')
       RETURNING id`
    );
    const agencyId = agencyResult.rows[0].id;
    console.log('✅ Created agency:', agencyId);
    
    // Create staff user
    const passwordHash = await bcrypt.hash('demo123', 10);
    await client.query(
      `INSERT INTO staff_users (agency_id, email, password_hash, first_name, last_name, role)
       VALUES ($1, 'nurse@sunrisehomecare.com', $2, 'Sarah', 'Johnson', 'nurse')`,
      [agencyId, passwordHash]
    );
    console.log('✅ Created staff user: nurse@sunrisehomecare.com (password: demo123)');
    
    // Create sample patients
    const patients = [
      {
        firstName: 'Margaret',
        lastName: 'Chen',
        dob: '1942-05-15',
        conditions: ['Type 2 Diabetes', 'Hypertension', 'Arthritis'],
        medications: ['Metformin 500mg', 'Lisinopril 10mg', 'Aspirin 81mg'],
        caregiverName: 'Lisa Chen',
        caregiverPhone: '555-0123'
      },
      {
        firstName: 'Robert',
        lastName: 'Williams',
        dob: '1938-11-22',
        conditions: ['CHF', 'COPD', 'Atrial Fibrillation'],
        medications: ['Furosemide 40mg', 'Warfarin 5mg', 'Albuterol inhaler'],
        caregiverName: 'James Williams',
        caregiverPhone: '555-0124'
      },
      {
        firstName: 'Dorothy',
        lastName: 'Martinez',
        dob: '1945-08-30',
        conditions: ['Dementia', 'Osteoporosis', 'Depression'],
        medications: ['Donepezil 10mg', 'Calcium + Vitamin D', 'Sertraline 50mg'],
        caregiverName: 'Maria Martinez',
        caregiverPhone: '555-0125'
      },
      {
        firstName: 'Harold',
        lastName: 'Thompson',
        dob: '1940-03-10',
        conditions: ['Post-stroke', 'Dysphagia', 'Hypertension'],
        medications: ['Plavix 75mg', 'Amlodipine 5mg', 'Atorvastatin 20mg'],
        caregiverName: 'Nancy Thompson',
        caregiverPhone: '555-0126'
      },
      {
        firstName: 'Betty',
        lastName: 'Anderson',
        dob: '1950-12-05',
        conditions: ['Parkinsons Disease', 'Anxiety'],
        medications: ['Carbidopa-Levodopa', 'Lorazepam 0.5mg'],
        caregiverName: 'Susan Anderson',
        caregiverPhone: '555-0127'
      }
    ];
    
    const patientIds = [];
    for (const p of patients) {
      const result = await client.query(
        `INSERT INTO patients (
          agency_id, first_name, last_name, date_of_birth, 
          medical_conditions, medications, caregiver_name, caregiver_phone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`,
        [
          agencyId, p.firstName, p.lastName, p.dob,
          p.conditions, p.medications, p.caregiverName, p.caregiverPhone
        ]
      );
      patientIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${patients.length} patients`);
    
    // Create sample check-ins for the last 7 days
    const now = new Date();
    const checkInScenarios = [
      // Margaret Chen - stable patient
      {
        patientIdx: 0,
        daysAgo: 0,
        data: {
          painLevel: 2,
          painLocation: 'knees',
          mobilityStatus: 'walking_with_aid',
          appetite: 'good',
          sleepQuality: 'fair',
          mood: 'content',
          medicationsTaken: true,
          temperature: 98.2,
          bloodPressure: '132/78',
          heartRate: 72,
          submittedBy: 'Lisa Chen (daughter)'
        }
      },
      // Robert Williams - elevated risk (missed meds)
      {
        patientIdx: 1,
        daysAgo: 0,
        data: {
          painLevel: 3,
          painLocation: 'chest',
          mobilityStatus: 'limited',
          appetite: 'poor',
          sleepQuality: 'poor',
          mood: 'tired',
          medicationsTaken: false,
          missedMedications: ['Furosemide morning dose', 'Warfarin'],
          temperature: 98.6,
          bloodPressure: '145/92',
          heartRate: 88,
          newSymptoms: ['increased shortness of breath', 'ankle swelling'],
          additionalNotes: 'Patient reports feeling more winded than usual',
          submittedBy: 'James Williams (son)'
        }
      },
      // Dorothy Martinez - moderate risk (confusion)
      {
        patientIdx: 2,
        daysAgo: 0,
        data: {
          painLevel: 1,
          mobilityStatus: 'walking_slowly',
          appetite: 'fair',
          sleepQuality: 'restless',
          mood: 'confused',
          medicationsTaken: true,
          temperature: 98.4,
          heartRate: 76,
          newSymptoms: ['more confused than usual', 'forgot daughter\'s name'],
          additionalNotes: 'Caregiver concerned about increased confusion',
          submittedBy: 'Maria Martinez (daughter)'
        }
      },
      // Harold Thompson - critical risk (fall + high pain)
      {
        patientIdx: 3,
        daysAgo: 0,
        data: {
          painLevel: 8,
          painLocation: 'right hip',
          mobilityStatus: 'unable_to_walk',
          appetite: 'none',
          sleepQuality: 'poor',
          mood: 'distressed',
          medicationsTaken: true,
          temperature: 99.1,
          bloodPressure: '158/95',
          heartRate: 95,
          fallIncident: true,
          newSymptoms: ['severe hip pain after fall', 'unable to bear weight'],
          additionalNotes: 'Fell in bathroom this morning around 8am. Cannot stand.',
          submittedBy: 'Nancy Thompson (wife)'
        }
      },
      // Betty Anderson - routine
      {
        patientIdx: 4,
        daysAgo: 0,
        data: {
          painLevel: 3,
          painLocation: 'general muscle stiffness',
          mobilityStatus: 'walking_slowly',
          appetite: 'good',
          sleepQuality: 'good',
          mood: 'anxious',
          medicationsTaken: true,
          temperature: 97.9,
          heartRate: 68,
          additionalNotes: 'Tremors about the same as usual',
          submittedBy: 'Susan Anderson (daughter)'
        }
      }
    ];
    
    // Add some historical check-ins (1-2 days ago)
    const historicalCheckIns = [
      {
        patientIdx: 0,
        daysAgo: 1,
        data: {
          painLevel: 2,
          mobilityStatus: 'walking_with_aid',
          appetite: 'good',
          sleepQuality: 'good',
          mood: 'content',
          medicationsTaken: true,
          temperature: 98.3,
          heartRate: 70,
          submittedBy: 'Lisa Chen'
        }
      },
      {
        patientIdx: 1,
        daysAgo: 1,
        data: {
          painLevel: 2,
          mobilityStatus: 'limited',
          appetite: 'fair',
          sleepQuality: 'fair',
          mood: 'tired',
          medicationsTaken: true,
          temperature: 98.4,
          bloodPressure: '138/85',
          heartRate: 82,
          submittedBy: 'James Williams'
        }
      },
      {
        patientIdx: 3,
        daysAgo: 1,
        data: {
          painLevel: 4,
          painLocation: 'lower back',
          mobilityStatus: 'walking_with_aid',
          appetite: 'fair',
          sleepQuality: 'fair',
          mood: 'okay',
          medicationsTaken: true,
          temperature: 98.6,
          heartRate: 78,
          submittedBy: 'Nancy Thompson'
        }
      }
    ];
    
    const allCheckIns = [...checkInScenarios, ...historicalCheckIns];
    
    for (const scenario of allCheckIns) {
      const submittedAt = new Date(now);
      submittedAt.setDate(submittedAt.getDate() - scenario.daysAgo);
      
      const checkInResult = await client.query(
        `INSERT INTO check_ins (
          patient_id, submitted_by, submitted_at,
          pain_level, pain_location, mobility_status, appetite, sleep_quality, mood,
          medications_taken, missed_medications, temperature, blood_pressure, heart_rate,
          new_symptoms, fall_incident, catheter_concerns, wound_concerns, additional_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id`,
        [
          patientIds[scenario.patientIdx],
          scenario.data.submittedBy,
          submittedAt,
          scenario.data.painLevel,
          scenario.data.painLocation || null,
          scenario.data.mobilityStatus,
          scenario.data.appetite,
          scenario.data.sleepQuality,
          scenario.data.mood,
          scenario.data.medicationsTaken,
          scenario.data.missedMedications || null,
          scenario.data.temperature || null,
          scenario.data.bloodPressure || null,
          scenario.data.heartRate || null,
          scenario.data.newSymptoms || null,
          scenario.data.fallIncident || false,
          scenario.data.catheterConcerns || false,
          scenario.data.woundConcerns || false,
          scenario.data.additionalNotes || null
        ]
      );
      
      const checkInId = checkInResult.rows[0].id;
      
      // Calculate and store risk score
      const riskFactors = [];
      let score = 0;
      
      if (!scenario.data.medicationsTaken) {
        score += 25;
        riskFactors.push('Medications not taken');
      }
      if (scenario.data.missedMedications?.length) {
        score += 15 * scenario.data.missedMedications.length;
        riskFactors.push(`Missed medications: ${scenario.data.missedMedications.join(', ')}`);
      }
      if (scenario.data.painLevel >= 8) {
        score += 20;
        riskFactors.push(`Severe pain (${scenario.data.painLevel}/10)`);
      }
      if (scenario.data.fallIncident) {
        score += 30;
        riskFactors.push('Fall incident reported');
      }
      if (scenario.data.newSymptoms?.length) {
        score += 10 * scenario.data.newSymptoms.length;
        riskFactors.push(`New symptoms: ${scenario.data.newSymptoms.join(', ')}`);
      }
      
      let riskLevel = 'routine';
      if (score >= 60) riskLevel = 'critical';
      else if (score >= 35) riskLevel = 'elevated';
      else if (score >= 15) riskLevel = 'moderate';
      
      await client.query(
        `INSERT INTO risk_scores (check_in_id, score, risk_level, risk_factors)
         VALUES ($1, $2, $3, $4)`,
        [checkInId, score, riskLevel, riskFactors]
      );
      
      // Update patient risk level
      await client.query(
        'UPDATE patients SET risk_level = $1 WHERE id = $2',
        [riskLevel, patientIds[scenario.patientIdx]]
      );
      
      // Create alerts for high-risk check-ins
      if (riskLevel === 'critical' || riskLevel === 'elevated') {
        const alertTitle = riskLevel === 'critical'
          ? '🚨 Critical Alert: Immediate Assessment Needed'
          : '⚠️ Elevated Risk: Review Required';
        
        await client.query(
          `INSERT INTO alerts (
            patient_id, check_in_id, severity, alert_type, title, description, 
            action_needed, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            patientIds[scenario.patientIdx],
            checkInId,
            riskLevel,
            'risk_assessment',
            alertTitle,
            riskFactors.join('; '),
            riskLevel === 'critical' ? 'Contact patient/caregiver within 30 minutes' : 'Review within 2 hours',
            scenario.daysAgo === 0 ? 'pending' : 'acknowledged'
          ]
        );
      }
    }
    
    console.log(`✅ Created ${allCheckIns.length} check-ins with risk scores and alerts`);
    
    await client.query('COMMIT');
    
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║  ✅ Database seeded successfully!                      ║
║                                                        ║
║  Agency: Sunrise Home Care                             ║
║  Patients: ${patients.length}                                               ║
║  Check-ins: ${allCheckIns.length}                                             ║
║                                                        ║
║  Test Login:                                           ║
║  Email: nurse@sunrisehomecare.com                      ║
║  Password: demo123                                     ║
║                                                        ║
║  Agency ID: ${agencyId}                  ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
