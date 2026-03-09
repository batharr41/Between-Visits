import dotenv from 'dotenv';
import pool from '../database/pool.js';
import {
  generateHandoffSummary,
  generateRiskExplanation,
  generateTriageGuidance
} from '../services/aiService.js';

dotenv.config();

let summaryQueue = null;
let triageQueue = null;

// Only initialize Redis queues if REDIS_URL is available
if (process.env.REDIS_URL) {
  try {
    const Queue = (await import('bull')).default;
    summaryQueue = new Queue('summary-generation', process.env.REDIS_URL);
    triageQueue = new Queue('triage-generation', process.env.REDIS_URL);
    console.log('✅ Redis queues initialized');

    summaryQueue.process(async (job) => {
      const { checkInId, patientId } = job.data;
      console.log(`📝 Processing summary for check-in ${checkInId}`);
      try {
        const checkInResult = await pool.query('SELECT * FROM check_ins WHERE id = $1', [checkInId]);
        const checkIn = checkInResult.rows[0];
        const patientResult = await pool.query('SELECT * FROM patients WHERE id = $1', [patientId]);
        const patient = patientResult.rows[0];
        const priorNotesResult = await pool.query(
          `SELECT additional_notes, submitted_at FROM check_ins WHERE patient_id = $1 AND id != $2 ORDER BY submitted_at DESC LIMIT 3`,
          [patientId, checkInId]
        );
        const summaryResult = await generateHandoffSummary(checkIn, patient, priorNotesResult.rows);
        await pool.query(
          `INSERT INTO llm_summaries (check_in_id, summary_type, content, grounding_data, model_used, tokens_used)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (check_in_id, summary_type) DO UPDATE
           SET content = $3, grounding_data = $4, model_used = $5, tokens_used = $6, generated_at = NOW()`,
          [checkInId, 'shift_handoff', summaryResult.summary, JSON.stringify(summaryResult.groundingData), 'claude-sonnet-4-20250514', summaryResult.tokensUsed]
        );
        console.log(`✅ Summary generated for check-in ${checkInId}`);
        return { success: true, checkInId };
      } catch (error) {
        console.error(`❌ Error processing summary:`, error);
        throw error;
      }
    });

    triageQueue.process(async (job) => {
      const { alertId } = job.data;
      console.log(`🚨 Processing triage guidance for alert ${alertId}`);
      try {
        const alertResult = await pool.query('SELECT * FROM alerts WHERE id = $1', [alertId]);
        const alert = alertResult.rows[0];
        const checkInResult = await pool.query('SELECT * FROM check_ins WHERE id = $1', [alert.check_in_id]);
        const checkIn = checkInResult.rows[0];
        const patientResult = await pool.query('SELECT * FROM patients WHERE id = $1', [alert.patient_id]);
        const patient = patientResult.rows[0];
        const triageResult = await generateTriageGuidance(alert, checkIn, patient);
        const priorityMap = { critical: 90, elevated: 70, moderate: 50, routine: 30 };
        await pool.query(
          `INSERT INTO triage_queue (alert_id, priority, call_script, suggested_actions)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (alert_id) DO UPDATE
           SET priority = $2, call_script = $3, suggested_actions = $4`,
          [alertId, priorityMap[alert.severity] || 50, triageResult.callScript, [triageResult.triageMessage]]
        );
        console.log(`✅ Triage guidance generated for alert ${alertId}`);
        return { success: true, alertId };
      } catch (error) {
        console.error(`❌ Error processing triage guidance:`, error);
        throw error;
      }
    });

    summaryQueue.on('failed', (job, err) => console.error(`❌ Job ${job.id} failed:`, err.message));
    triageQueue.on('failed', (job, err) => console.error(`❌ Triage job ${job.id} failed:`, err.message));

  } catch (err) {
    console.warn('⚠️ Redis unavailable, AI queue disabled:', err.message);
  }
} else {
  console.warn('⚠️ No REDIS_URL set — AI queue disabled, check-ins will still work');
}

export { summaryQueue, triageQueue };
export default { summaryQueue, triageQueue };
