import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Risk scoring rules - deterministic pattern detection
 */
export function calculateRiskScore(checkIn, patientHistory = []) {
  const factors = [];
  let score = 0;

  // Medication compliance (critical)
  if (!checkIn.medications_taken) {
    score += 25;
    factors.push('Medications not taken as prescribed');
  }
  if (checkIn.missed_medications && checkIn.missed_medications.length > 0) {
    score += 15 * Math.min(checkIn.missed_medications.length, 3);
    factors.push(`Missed ${checkIn.missed_medications.length} medication(s): ${checkIn.missed_medications.join(', ')}`);
  }

  // Pain assessment
  if (checkIn.pain_level >= 8) {
    score += 20;
    factors.push(`Severe pain reported (${checkIn.pain_level}/10) in ${checkIn.pain_location || 'unspecified area'}`);
  } else if (checkIn.pain_level >= 6) {
    score += 10;
    factors.push(`Moderate pain (${checkIn.pain_level}/10)`);
  }

  // Fall risk
  if (checkIn.fall_incident) {
    score += 30;
    factors.push('Fall incident reported - immediate assessment needed');
  }

  // Mobility concerns
  if (checkIn.mobility_status === 'unable_to_walk' || checkIn.mobility_status === 'bedbound') {
    score += 15;
    factors.push('Significant mobility limitation');
  }

  // Medical device concerns
  if (checkIn.catheter_concerns) {
    score += 20;
    factors.push('Catheter-related concerns reported');
  }
  if (checkIn.wound_concerns) {
    score += 20;
    factors.push('Wound care concerns reported');
  }

  // Vital signs
  if (checkIn.temperature && checkIn.temperature >= 100.4) {
    score += 15;
    factors.push(`Elevated temperature: ${checkIn.temperature}°F`);
  }
  if (checkIn.heart_rate && (checkIn.heart_rate > 110 || checkIn.heart_rate < 50)) {
    score += 15;
    factors.push(`Abnormal heart rate: ${checkIn.heart_rate} bpm`);
  }

  // New symptoms
  if (checkIn.new_symptoms && checkIn.new_symptoms.length > 0) {
    score += 10 * Math.min(checkIn.new_symptoms.length, 3);
    factors.push(`New symptoms: ${checkIn.new_symptoms.join(', ')}`);
  }

  // Quality of life indicators
  if (checkIn.appetite === 'poor' || checkIn.appetite === 'none') {
    score += 10;
    factors.push('Poor appetite reported');
  }
  if (checkIn.sleep_quality === 'poor' || checkIn.sleep_quality === 'none') {
    score += 5;
    factors.push('Sleep disturbances');
  }

  // Mood concerns
  if (checkIn.mood === 'depressed' || checkIn.mood === 'anxious') {
    score += 10;
    factors.push(`Mental health concern: ${checkIn.mood} mood`);
  }

  // Historical pattern detection
  if (patientHistory.length >= 3) {
    const recentHighRisk = patientHistory.slice(0, 3).filter(h => h.risk_level === 'critical' || h.risk_level === 'elevated').length;
    if (recentHighRisk >= 2) {
      score += 15;
      factors.push('Concerning trend: Multiple recent high-risk check-ins');
    }
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Determine risk level
  let riskLevel = 'routine';
  if (score >= 60) {
    riskLevel = 'critical';
  } else if (score >= 35) {
    riskLevel = 'elevated';
  } else if (score >= 15) {
    riskLevel = 'moderate';
  }

  return {
    score,
    riskLevel,
    factors
  };
}

/**
 * Generate shift handoff summary using Claude
 * Uses ONLY structured check-in data and prior logged notes
 */
export async function generateHandoffSummary(checkIn, patient, priorNotes = []) {
  const groundingData = {
    patient: {
      name: `${patient.first_name} ${patient.last_name}`,
      age: patient.date_of_birth ? calculateAge(patient.date_of_birth) : 'unknown',
      conditions: patient.medical_conditions || [],
      medications: patient.medications || []
    },
    currentCheckIn: {
      date: checkIn.submitted_at,
      submittedBy: checkIn.submitted_by,
      painLevel: checkIn.pain_level,
      painLocation: checkIn.pain_location,
      mobility: checkIn.mobility_status,
      appetite: checkIn.appetite,
      sleep: checkIn.sleep_quality,
      mood: checkIn.mood,
      medicationsTaken: checkIn.medications_taken,
      missedMedications: checkIn.missed_medications || [],
      vitalSigns: {
        temperature: checkIn.temperature,
        bloodPressure: checkIn.blood_pressure,
        heartRate: checkIn.heart_rate
      },
      concerns: {
        newSymptoms: checkIn.new_symptoms || [],
        fallIncident: checkIn.fall_incident,
        catheterConcerns: checkIn.catheter_concerns,
        woundConcerns: checkIn.wound_concerns
      },
      additionalNotes: checkIn.additional_notes
    },
    priorNotes: priorNotes.slice(0, 3) // Last 3 notes only
  };

  const prompt = `You are a clinical care coordinator creating a shift handoff summary. Use ONLY the following structured data - do not add outside medical knowledge or recommendations.

PATIENT INFORMATION:
${JSON.stringify(groundingData.patient, null, 2)}

TODAY'S CHECK-IN:
${JSON.stringify(groundingData.currentCheckIn, null, 2)}

RECENT NOTES (last 3 check-ins):
${JSON.stringify(groundingData.priorNotes, null, 2)}

Create a concise shift handoff summary (3-4 sentences) that:
1. States the patient's current status based ONLY on today's check-in data
2. Highlights any changes from recent notes
3. Notes any concerns that require follow-up
4. Uses clear, professional language

Do NOT:
- Add medical interpretations beyond what's in the data
- Suggest diagnoses or treatments
- Include information not present in the data above

Summary:`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      summary: message.content[0].text,
      groundingData,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens
    };
  } catch (error) {
    console.error('Error generating handoff summary:', error);
    throw error;
  }
}

/**
 * Generate risk score explanation using Claude
 * Explains WHY the score changed and what to verify next
 */
export async function generateRiskExplanation(riskScore, checkIn, patient, priorScores = []) {
  const context = {
    currentScore: riskScore.score,
    currentLevel: riskScore.riskLevel,
    factors: riskScore.factors,
    patientName: `${patient.first_name} ${patient.last_name}`,
    recentTrend: priorScores.map(s => ({
      date: s.date,
      score: s.score,
      level: s.risk_level
    }))
  };

  const prompt = `You are explaining a risk score to clinical staff. Use ONLY the data provided.

CURRENT RISK ASSESSMENT:
- Score: ${context.currentScore}/100
- Level: ${context.currentLevel}
- Detected factors:
${context.factors.map(f => `  • ${f}`).join('\n')}

RECENT RISK TREND:
${context.recentTrend.map(t => `- ${t.date}: ${t.score}/100 (${t.level})`).join('\n') || 'No prior data'}

Provide a clear 2-3 sentence explanation that:
1. States what triggered this risk level
2. Notes any changes from the recent trend
3. Suggests ONE specific thing to verify or monitor next

Be direct and actionable. Do not add medical advice beyond verification steps.

Explanation:`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      explanation: message.content[0].text,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens
    };
  } catch (error) {
    console.error('Error generating risk explanation:', error);
    throw error;
  }
}

/**
 * Generate triage message and call script
 * Uses ONLY recorded symptoms and patient history
 */
export async function generateTriageGuidance(alert, checkIn, patient) {
  const context = {
    alertTitle: alert.title,
    alertDescription: alert.description,
    severity: alert.severity,
    patient: {
      name: `${patient.first_name} ${patient.last_name}`,
      conditions: patient.medical_conditions || [],
      medications: patient.medications || [],
      caregiverName: patient.caregiver_name,
      caregiverPhone: patient.caregiver_phone
    },
    symptoms: {
      pain: checkIn.pain_level ? `${checkIn.pain_level}/10 in ${checkIn.pain_location || 'unspecified area'}` : 'Not reported',
      newSymptoms: checkIn.new_symptoms || [],
      vitalSigns: {
        temperature: checkIn.temperature,
        bloodPressure: checkIn.blood_pressure,
        heartRate: checkIn.heart_rate
      },
      concerns: {
        fall: checkIn.fall_incident,
        catheter: checkIn.catheter_concerns,
        wound: checkIn.wound_concerns
      }
    }
  };

  const prompt = `You are drafting triage guidance for clinical staff. Use ONLY the data provided.

ALERT: ${context.alertTitle}
${context.alertDescription}
Severity: ${context.severity}

PATIENT: ${context.patient.name}
Known conditions: ${context.patient.conditions.join(', ') || 'None listed'}
Current medications: ${context.patient.medications.join(', ') || 'None listed'}
Caregiver: ${context.patient.caregiverName || 'Not listed'} ${context.patient.caregiverPhone ? `(${context.patient.caregiverPhone})` : ''}

CURRENT SYMPTOMS:
${JSON.stringify(context.symptoms, null, 2)}

Create:
1. A brief triage message (2-3 sentences) summarizing the situation
2. A call script with 3-4 specific questions to ask the caregiver to verify symptoms

Use ONLY the information provided. Focus on verification, not diagnosis.

Response:`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    });

    const response = message.content[0].text;
    
    return {
      triageMessage: response.split('Call Script:')[0].replace('Triage Message:', '').trim(),
      callScript: response.split('Call Script:')[1]?.trim() || response,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens
    };
  } catch (error) {
    console.error('Error generating triage guidance:', error);
    throw error;
  }
}

// Helper function
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default {
  calculateRiskScore,
  generateHandoffSummary,
  generateRiskExplanation,
  generateTriageGuidance
};
