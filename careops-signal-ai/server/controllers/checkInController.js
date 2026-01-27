import pool from '../database/pool.js';
import { calculateRiskScore } from '../services/aiService.js';
import { summaryQueue, triageQueue } from '../queues/aiQueue.js';

/**
 * Submit a new check-in
 */
export async function submitCheckIn(req, res) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      patientId,
      submittedBy,
      painLevel,
      painLocation,
      mobilityStatus,
      appetite,
      sleepQuality,
      mood,
      medicationsTaken,
      missedMedications,
      temperature,
      bloodPressure,
      heartRate,
      newSymptoms,
      fallIncident,
      catheterConcerns,
      woundConcerns,
      additionalNotes
    } = req.body;
    
    // Insert check-in
    const checkInResult = await client.query(
      `INSERT INTO check_ins (
        patient_id, submitted_by, pain_level, pain_location, mobility_status,
        appetite, sleep_quality, mood, medications_taken, missed_medications,
        temperature, blood_pressure, heart_rate, new_symptoms, fall_incident,
        catheter_concerns, wound_concerns, additional_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        patientId, submittedBy, painLevel, painLocation, mobilityStatus,
        appetite, sleepQuality, mood, medicationsTaken, missedMedications,
        temperature, bloodPressure, heartRate, newSymptoms, fallIncident,
        catheterConcerns, woundConcerns, additionalNotes
      ]
    );
    
    const checkIn = checkInResult.rows[0];
    
    // Get patient history for pattern detection
    const historyResult = await client.query(
      `SELECT rs.score, rs.risk_level 
       FROM risk_scores rs
       JOIN check_ins ci ON rs.check_in_id = ci.id
       WHERE ci.patient_id = $1
       ORDER BY ci.submitted_at DESC
       LIMIT 5`,
      [patientId]
    );
    const patientHistory = historyResult.rows;
    
    // Calculate risk score (synchronous, rules-based)
    const riskScore = calculateRiskScore(checkIn, patientHistory);
    
    // Store risk score
    const riskScoreResult = await client.query(
      `INSERT INTO risk_scores (check_in_id, score, risk_level, risk_factors)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [checkIn.id, riskScore.score, riskScore.riskLevel, riskScore.factors]
    );
    
    const storedRiskScore = riskScoreResult.rows[0];
    
    // Update patient risk level
    await client.query(
      'UPDATE patients SET risk_level = $1 WHERE id = $2',
      [riskScore.riskLevel, patientId]
    );
    
    // Create alert if high risk
    let alert = null;
    if (riskScore.riskLevel === 'critical' || riskScore.riskLevel === 'elevated') {
      const alertTitle = riskScore.riskLevel === 'critical' 
        ? '🚨 Critical Alert: Immediate Assessment Needed'
        : '⚠️ Elevated Risk: Review Required';
      
      const alertResult = await client.query(
        `INSERT INTO alerts (
          patient_id, check_in_id, severity, alert_type, title, description, action_needed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          patientId,
          checkIn.id,
          riskScore.riskLevel,
          'risk_assessment',
          alertTitle,
          riskScore.factors.join('; '),
          riskScore.riskLevel === 'critical' 
            ? 'Contact patient/caregiver within 30 minutes'
            : 'Review within 2 hours'
        ]
      );
      
      alert = alertResult.rows[0];
      
      // Queue triage guidance generation (async)
      await triageQueue.add(
        { alertId: alert.id },
        { 
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          priority: riskScore.riskLevel === 'critical' ? 1 : 5
        }
      );
    }
    
    // Queue summary generation (async)
    await summaryQueue.add(
      { checkInId: checkIn.id, patientId },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
    );
    
    // Queue risk explanation generation (async)
    await summaryQueue.add(
      'risk-explanation',
      { checkInId: checkIn.id, riskScoreId: storedRiskScore.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      checkIn,
      riskScore: {
        score: riskScore.score,
        level: riskScore.riskLevel,
        factors: riskScore.factors
      },
      alert,
      message: alert 
        ? `Check-in recorded. ${alert.title}` 
        : 'Check-in recorded successfully.'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting check-in:', error);
    res.status(500).json({ error: 'Failed to submit check-in', details: error.message });
  } finally {
    client.release();
  }
}

/**
 * Get check-in with full details
 */
export async function getCheckIn(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        ci.*,
        rs.score, rs.risk_level, rs.risk_factors, rs.explanation,
        ls.content as summary,
        p.first_name, p.last_name
       FROM check_ins ci
       LEFT JOIN risk_scores rs ON ci.id = rs.check_in_id
       LEFT JOIN llm_summaries ls ON ci.id = ls.check_in_id AND ls.summary_type = 'shift_handoff'
       LEFT JOIN patients p ON ci.patient_id = p.id
       WHERE ci.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Check-in not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching check-in:', error);
    res.status(500).json({ error: 'Failed to fetch check-in' });
  }
}

/**
 * Get patient check-in history
 */
export async function getPatientCheckIns(req, res) {
  try {
    const { patientId } = req.params;
    const { limit = 30, offset = 0 } = req.query;
    
    const result = await pool.query(
      `SELECT 
        ci.*,
        rs.score, rs.risk_level, rs.risk_factors
       FROM check_ins ci
       LEFT JOIN risk_scores rs ON ci.id = rs.check_in_id
       WHERE ci.patient_id = $1
       ORDER BY ci.submitted_at DESC
       LIMIT $2 OFFSET $3`,
      [patientId, limit, offset]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patient check-ins:', error);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
}

export default {
  submitCheckIn,
  getCheckIn,
  getPatientCheckIns
};
