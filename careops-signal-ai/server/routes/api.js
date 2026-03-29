import express from 'express';
import checkInController from '../controllers/checkInController.js';
import dashboardController from '../controllers/dashboardController.js';
import pool from '../database/pool.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { generatePatientReport, generateAgencyReport } from '../services/reportService.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
router.use(authenticateJWT);

router.get('/me', async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(401).json({ error: 'No user email in token' });
    const staffResult = await pool.query(
      'SELECT id, agency_id, email, first_name, last_name, role FROM staff_users WHERE email = $1',
      [userEmail]
    );
    if (staffResult.rows.length > 0) {
      return res.json(staffResult.rows[0]);
    }
    const familyResult = await pool.query(
      'SELECT id, agency_id, patient_id, email, first_name, last_name, relationship FROM family_users WHERE email = $1',
      [userEmail]
    );
    if (familyResult.rows.length > 0) {
      return res.json({ ...familyResult.rows[0], role: 'family' });
    }
    return res.status(404).json({ error: 'User not found' });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

router.post('/check-ins', requireRole('admin', 'caregiver'), checkInController.submitCheckIn);
router.get('/check-ins/:id', checkInController.getCheckIn);
router.get('/patients/:patientId/check-ins', checkInController.getPatientCheckIns);

router.get('/agencies/:agencyId/dashboard', requireRole('admin', 'caregiver'), dashboardController.getDashboardOverview);
router.get('/agencies/:agencyId/triage-queue', requireRole('admin', 'caregiver'), dashboardController.getTriageQueue);
router.get('/patients/:patientId/trends', dashboardController.getPatientTrends);

router.get('/agencies/:agencyId/staff', requireRole('admin'), dashboardController.getStaffMembers);

router.put('/alerts/:alertId/acknowledge', requireRole('admin', 'caregiver'), dashboardController.acknowledgeAlert);
router.put('/alerts/:alertId/resolve', requireRole('admin', 'caregiver'), dashboardController.resolveAlert);

router.get('/agencies/:agencyId/alerts/resolved', requireRole('admin', 'caregiver'), async (req, res) => {
  try {
    const { agencyId } = req.params;
    const { limit = 20 } = req.query;
    const result = await pool.query(
      `SELECT a.*, p.first_name || ' ' || p.last_name as patient_name, su.first_name as resolved_by_first, su.last_name as resolved_by_last FROM alerts a JOIN patients p ON a.patient_id = p.id LEFT JOIN staff_users su ON a.resolved_by = su.id WHERE p.agency_id = $1 AND a.status = 'resolved' ORDER BY a.resolved_at DESC LIMIT $2`,
      [agencyId, limit]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching resolved alerts:', error);
    res.status(500).json({ error: 'Failed to fetch resolved alerts' });
  }
});

router.get('/agencies/:agencyId/patients', requireRole('admin', 'caregiver'), async (req, res) => {
  try {
    const { agencyId } = req.params;
    let whereClause = 'WHERE p.agency_id = $1';
    const params = [agencyId];
    if (req.userRole === 'caregiver' && req.staffUser) {
      whereClause += ' AND p.assigned_caregiver_id = $2';
      params.push(req.staffUser.id);
    }
    const result = await pool.query(
      `SELECT p.*, COUNT(ci.id) as total_check_ins, MAX(ci.submitted_at) as last_check_in, su.first_name as caregiver_first, su.last_name as caregiver_last FROM patients p LEFT JOIN check_ins ci ON p.id = ci.patient_id LEFT JOIN staff_users su ON p.assigned_caregiver_id = su.id ${whereClause} GROUP BY p.id, su.first_name, su.last_name ORDER BY p.last_name, p.first_name`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

router.get('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (req.userRole === 'family' && req.linkedPatientId !== id) {
      return res.status(403).json({ error: 'Access denied - you can only view your linked patient' });
    }
    if (req.userRole === 'caregiver' && req.staffUser) {
      const check = await pool.query('SELECT id FROM patients WHERE id = $1 AND assigned_caregiver_id = $2', [id, req.staffUser.id]);
      if (check.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied - patient not assigned to you' });
      }
    }
    const result = await pool.query(
      `SELECT p.*, su.first_name as assigned_first, su.last_name as assigned_last, su.email as assigned_email FROM patients p LEFT JOIN staff_users su ON p.assigned_caregiver_id = su.id WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});
