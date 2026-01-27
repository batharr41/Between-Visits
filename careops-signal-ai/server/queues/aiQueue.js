import Queue from 'bull';
import dotenv from 'dotenv';
import pool from '../database/pool.js';
import {
  generateHandoffSummary,
  generateRiskExplanation,
  generateTriageGuidance
} from '../services/aiService.js';

dotenv.config();

// Create queues
export const summaryQueue = new Queue('summary-generation', process.env.REDIS_URL || 'redis://localhost:6379');
export const triageQueue = new Queue('triage-generation', process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Process summary generation jobs
 */
summaryQueue.process(async (job) => {
  const { checkInId, patientId } = job.data;
  
  console.log(`📝 Processing summary for check-in ${checkInId}`);
  
  try {
    // Get check-in data
    const checkInResult = await pool.query(
      'SELECT * FROM check_ins WHERE id = $1',
      [checkInId]
    );
    const checkIn = checkInResult.rows[0];
    
    // Get patient data
    const patientResult = await pool.query(
      'SELECT * FROM patients WHERE id = $1',
      [patientId]
    );
    const patient = patientResult.rows[0];
    
    // Get prior notes
    const priorNotesResult = await pool.query(
      `SELECT additional_notes, submitted_at 
       FROM check_ins 
       WHERE patient_id = $1 AND id != $2 
       ORDER BY submitted_at DESC 
       LIMIT 3`,
      [patientId, checkInId]
    );
    const priorNotes = priorNotesResult.rows;
    
    // Generate summary
    const summaryResult = await generateHandoffSummary(checkIn, patient, priorNotes);
    
    // Store in database
    await pool.query(
      `INSERT INTO llm_summaries (check_in_id, summary_type, content, grounding_data, model_used, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (check_in_id, summary_type) DO UPDATE
       SET content = $3, grounding_data = $4, model_used = $5, tokens_used = $6, generated_at = NOW()`,
      [
        checkInId,
        'shift_handoff',
        summaryResult.summary,
        JSON.stringify(summaryResult.groundingData),
        'claude-sonnet-4-20250514',
        summaryResult.tokensUsed
      ]
    );
    
    console.log(`✅ Summary generated for check-in ${checkInId}`);
    return { success: true, checkInId };
    
  } catch (error) {
    console.error(`❌ Error processing summary for check-in ${checkInId}:`, error);
    throw error;
  }
});

/**
 * Process risk explanation jobs
 */
summaryQueue.process('risk-explanation', async (job) => {
  const { checkInId, riskScoreId } = job.data;
  
  console.log(`🎯 Processing risk explanation for check-in ${checkInId}`);
  
  try {
    // Get risk score
    const riskResult = await pool.query(
      'SELECT * FROM risk_scores WHERE id = $1',
      [riskScoreId]
    );
    const riskScore = riskResult.rows[0];
    
    // Get check-in
    const checkInResult = await pool.query(
      'SELECT * FROM check_ins WHERE id = $1',
      [checkInId]
    );
    const checkIn = checkInResult.rows[0];
    
    // Get patient
    const patientResult = await pool.query(
      'SELECT * FROM patients WHERE id = $1',
      [checkIn.patient_id]
    );
    const patient = patientResult.rows[0];
    
    // Get prior scores
    const priorScoresResult = await pool.query(
      `SELECT rs.score, rs.risk_level, ci.submitted_at as date
       FROM risk_scores rs
       JOIN check_ins ci ON rs.check_in_id = ci.id
       WHERE ci.patient_id = $1 AND rs.id != $2
       ORDER BY ci.submitted_at DESC
       LIMIT 5`,
      [checkIn.patient_id, riskScoreId]
    );
    const priorScores = priorScoresResult.rows;
    
    // Generate explanation
    const explanationResult = await generateRiskExplanation(
      {
        score: riskScore.score,
        riskLevel: riskScore.risk_level,
        factors: riskScore.risk_factors
      },
      checkIn,
      patient,
      priorScores
    );
    
    // Update risk score with explanation
    await pool.query(
      'UPDATE risk_scores SET explanation = $1 WHERE id = $2',
      [explanationResult.explanation, riskScoreId]
    );
    
    console.log(`✅ Risk explanation generated for check-in ${checkInId}`);
    return { success: true, riskScoreId };
    
  } catch (error) {
    console.error(`❌ Error processing risk explanation:`, error);
    throw error;
  }
});

/**
 * Process triage guidance jobs
 */
triageQueue.process(async (job) => {
  const { alertId } = job.data;
  
  console.log(`🚨 Processing triage guidance for alert ${alertId}`);
  
  try {
    // Get alert
    const alertResult = await pool.query(
      'SELECT * FROM alerts WHERE id = $1',
      [alertId]
    );
    const alert = alertResult.rows[0];
    
    // Get check-in
    const checkInResult = await pool.query(
      'SELECT * FROM check_ins WHERE id = $1',
      [alert.check_in_id]
    );
    const checkIn = checkInResult.rows[0];
    
    // Get patient
    const patientResult = await pool.query(
      'SELECT * FROM patients WHERE id = $1',
      [alert.patient_id]
    );
    const patient = patientResult.rows[0];
    
    // Generate triage guidance
    const triageResult = await generateTriageGuidance(alert, checkIn, patient);
    
    // Calculate priority based on severity
    const priorityMap = {
      critical: 90,
      elevated: 70,
      moderate: 50,
      routine: 30
    };
    const priority = priorityMap[alert.severity] || 50;
    
    // Store in triage queue
    await pool.query(
      `INSERT INTO triage_queue (alert_id, priority, call_script, suggested_actions)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (alert_id) DO UPDATE
       SET priority = $2, call_script = $3, suggested_actions = $4`,
      [
        alertId,
        priority,
        triageResult.callScript,
        [triageResult.triageMessage]
      ]
    );
    
    console.log(`✅ Triage guidance generated for alert ${alertId}`);
    return { success: true, alertId };
    
  } catch (error) {
    console.error(`❌ Error processing triage guidance:`, error);
    throw error;
  }
});

// Queue event listeners
summaryQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed:`, result);
});

summaryQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

triageQueue.on('completed', (job, result) => {
  console.log(`✅ Triage job ${job.id} completed:`, result);
});

triageQueue.on('failed', (job, err) => {
  console.error(`❌ Triage job ${job.id} failed:`, err.message);
});

export default { summaryQueue, triageQueue };
