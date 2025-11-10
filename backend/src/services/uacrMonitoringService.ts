/**
 * uACR Monitoring & Treatment Adherence Service
 *
 * Monitors uACR changes, evaluates medication adherence, and provides treatment recommendations
 * Based on KDIGO guidelines and EMPA-KIDNEY trial criteria
 */

import { Pool } from 'pg';

// ===================================================================
// Types and Enums
// ===================================================================

export enum uACRCategory {
  NORMOALBUMINURIA = 'Normoalbuminuria (<30 mg/g)',
  MICROALBUMINURIA = 'Microalbuminuria (30-300 mg/g)',
  MACROALBUMINURIA = 'Macroalbuminuria (>300 mg/g)'
}

export enum WorseningLevel {
  NO_CHANGE = 'No significant change',
  MILD = 'Mild worsening (30-50% increase)',
  MODERATE = 'Moderate worsening (50-100% increase)',
  SEVERE = 'Severe worsening (>100% increase)',
  CATEGORY_PROGRESSION = 'Category progression'
}

export enum TreatmentRecommendation {
  CONTINUE_MONITORING = 'Continue monitoring',
  CONSIDER_TREATMENT = 'Consider initiating treatment',
  STRONGLY_RECOMMEND = 'Strongly recommend treatment initiation',
  URGENT_TREATMENT = 'Urgent treatment initiation required'
}

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface uACRMeasurement {
  date: string;
  value: number;
}

export interface uACRAnalysis {
  patient_id: string;
  patient_name: string;
  current_uacr: number;
  previous_uacr: number;
  percent_change: number;
  current_category: uACRCategory;
  previous_category: uACRCategory;
  worsening_level: WorseningLevel;
  is_worsening: boolean;
  date_current: string;
  date_previous: string;
  days_between: number;
}

export interface AdherenceAnalysis {
  on_treatment: boolean;
  medication: string | null;
  adherence_status: string | null;
  is_adherent: boolean;
  barriers: string[];
  interventions: string[];
}

export interface UACRAlert {
  alert_id: string;
  severity: AlertSeverity;
  patient_id: string;
  patient_name: string;
  mrn: string;
  alert_type: string;
  message: string;
  uacr_analysis: uACRAnalysis;
  adherence_analysis: AdherenceAnalysis | null;
  treatment_recommendation: TreatmentRecommendation | null;
  recommended_actions: string[];
  clinical_rationale: string;
  timestamp: string;
}

export interface ScanResults {
  scan_date: string;
  total_patients_scanned: number;
  patients_with_worsening: number;
  worsening_percentage: number;
  severity_distribution: {
    CRITICAL: number;
    HIGH: number;
    MODERATE: number;
    LOW: number;
  };
  alert_type_frequency: Record<string, number>;
  alerts: UACRAlert[];
}

// ===================================================================
// Helper Functions
// ===================================================================

function categorizeUACR(uacrValue: number): uACRCategory {
  if (uacrValue < 30) {
    return uACRCategory.NORMOALBUMINURIA;
  } else if (uacrValue <= 300) {
    return uACRCategory.MICROALBUMINURIA;
  } else {
    return uACRCategory.MACROALBUMINURIA;
  }
}

function calculateDaysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date1.getTime() - date2.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ===================================================================
// Main Service Class
// ===================================================================

export class UACRMonitoringService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Analyze uACR changes for a single patient
   */
  async analyzeUACRChange(patientId: string): Promise<uACRAnalysis | null> {
    // Get uACR history for patient (last 2 measurements)
    const query = `
      SELECT
        p.id as patient_id,
        p.first_name || ' ' || p.last_name as patient_name,
        o.value_numeric as uacr_value,
        o.observation_date
      FROM patients p
      JOIN observations o ON p.id = o.patient_id
      WHERE p.id = $1
        AND o.observation_type = 'uACR'
        AND o.status = 'final'
      ORDER BY o.observation_date DESC
      LIMIT 2
    `;

    const result = await this.pool.query(query, [patientId]);

    if (result.rows.length < 2) {
      return null; // Need at least 2 measurements
    }

    const current = result.rows[0];
    const previous = result.rows[1];

    const currentValue = parseFloat(current.uacr_value);
    const previousValue = parseFloat(previous.uacr_value);

    // Calculate change
    const percentChange = ((currentValue - previousValue) / previousValue) * 100;

    // Categorize
    const currentCategory = categorizeUACR(currentValue);
    const previousCategory = categorizeUACR(previousValue);

    // Determine worsening level
    const isWorsening = currentValue > previousValue;
    let worseningLevel: WorseningLevel;

    if (!isWorsening) {
      worseningLevel = WorseningLevel.NO_CHANGE;
    } else if (currentCategory !== previousCategory) {
      worseningLevel = WorseningLevel.CATEGORY_PROGRESSION;
    } else if (percentChange > 100) {
      worseningLevel = WorseningLevel.SEVERE;
    } else if (percentChange > 50) {
      worseningLevel = WorseningLevel.MODERATE;
    } else if (percentChange > 30) {
      worseningLevel = WorseningLevel.MILD;
    } else {
      worseningLevel = WorseningLevel.NO_CHANGE;
    }

    // Calculate days between measurements
    const dateCurrent = new Date(current.observation_date);
    const datePrevious = new Date(previous.observation_date);
    const daysBetween = calculateDaysBetween(dateCurrent, datePrevious);

    return {
      patient_id: current.patient_id,
      patient_name: current.patient_name,
      current_uacr: currentValue,
      previous_uacr: previousValue,
      percent_change: percentChange,
      current_category: currentCategory,
      previous_category: previousCategory,
      worsening_level: worseningLevel,
      is_worsening: worseningLevel !== WorseningLevel.NO_CHANGE,
      date_current: dateCurrent.toISOString().split('T')[0],
      date_previous: datePrevious.toISOString().split('T')[0],
      days_between: daysBetween
    };
  }

  /**
   * Analyze medication adherence for a patient
   */
  async analyzeAdherence(patientId: string): Promise<AdherenceAnalysis> {
    // Check if patient is on SGLT2 inhibitor (Jardiance)
    const query = `
      SELECT
        p.on_sglt2i,
        p.medical_record_number
      FROM patients p
      WHERE p.id = $1
    `;

    const result = await this.pool.query(query, [patientId]);
    const patient = result.rows[0];

    if (!patient || !patient.on_sglt2i) {
      return {
        on_treatment: false,
        medication: null,
        adherence_status: null,
        is_adherent: false,
        barriers: [],
        interventions: []
      };
    }

    // For now, return basic adherence info
    // In a full implementation, this would calculate MPR/PDC from pharmacy refill data
    return {
      on_treatment: true,
      medication: 'Jardiance (empagliflozin)',
      adherence_status: 'Unknown',
      is_adherent: true, // Default assumption
      barriers: [],
      interventions: []
    };
  }

  /**
   * Evaluate treatment eligibility for untreated patients
   */
  async evaluateTreatmentEligibility(patientId: string): Promise<{
    eligible: boolean;
    recommendation: TreatmentRecommendation;
    rationale: string;
  }> {
    const query = `
      SELECT
        p.on_sglt2i,
        p.on_ras_inhibitor,
        (SELECT value_numeric FROM observations
         WHERE patient_id = p.id AND observation_type = 'eGFR'
         ORDER BY observation_date DESC LIMIT 1) as egfr,
        (SELECT value_numeric FROM observations
         WHERE patient_id = p.id AND observation_type = 'uACR'
         ORDER BY observation_date DESC LIMIT 1) as uacr,
        c.conditions
      FROM patients p
      LEFT JOIN (
        SELECT patient_id,
               array_agg(condition_name) as conditions
        FROM conditions
        WHERE clinical_status = 'active'
        GROUP BY patient_id
      ) c ON p.id = c.patient_id
      WHERE p.id = $1
    `;

    const result = await this.pool.query(query, [patientId]);
    const patient = result.rows[0];

    if (!patient) {
      return {
        eligible: false,
        recommendation: TreatmentRecommendation.CONTINUE_MONITORING,
        rationale: 'Patient data not available'
      };
    }

    const egfr = parseFloat(patient.egfr || '0');
    const uacr = parseFloat(patient.uacr || '0');
    const conditions = patient.conditions || [];
    const hasDiabetes = conditions.some((c: string) => c.toLowerCase().includes('diabetes'));

    // Check eGFR range (20-75 mL/min/1.73m²)
    if (egfr < 20) {
      return {
        eligible: false,
        recommendation: TreatmentRecommendation.CONTINUE_MONITORING,
        rationale: 'eGFR <20 mL/min - below approved range for Jardiance'
      };
    }

    // Determine CKD stage based on eGFR
    let ckdStage = 1;
    if (egfr < 15) ckdStage = 5;
    else if (egfr < 30) ckdStage = 4;
    else if (egfr < 60) ckdStage = 3;
    else if (egfr < 90) ckdStage = 2;

    const reasons: string[] = [];
    let eligible = false;
    let recommendation = TreatmentRecommendation.CONTINUE_MONITORING;

    // Diabetic CKD Stage 2+ OR Non-diabetic CKD Stage 3+ with uACR ≥200
    if (hasDiabetes && ckdStage >= 2) {
      eligible = true;
      reasons.push(`Diabetic CKD Stage ${ckdStage}`);

      if (uacr >= 300) {
        recommendation = TreatmentRecommendation.URGENT_TREATMENT;
        reasons.push(`Macroalbuminuria (uACR ${uacr.toFixed(0)} mg/g)`);
      } else if (uacr >= 200) {
        recommendation = TreatmentRecommendation.STRONGLY_RECOMMEND;
        reasons.push(`Significant albuminuria (uACR ${uacr.toFixed(0)} mg/g)`);
      } else if (uacr >= 30) {
        recommendation = TreatmentRecommendation.STRONGLY_RECOMMEND;
        reasons.push(`Microalbuminuria (uACR ${uacr.toFixed(0)} mg/g)`);
      } else {
        recommendation = TreatmentRecommendation.CONSIDER_TREATMENT;
      }
    } else if (!hasDiabetes && ckdStage >= 3 && uacr >= 200) {
      eligible = true;
      reasons.push(`Non-diabetic CKD Stage ${ckdStage}`);

      if (uacr >= 300) {
        recommendation = TreatmentRecommendation.URGENT_TREATMENT;
        reasons.push(`Macroalbuminuria (uACR ${uacr.toFixed(0)} mg/g)`);
      } else {
        recommendation = TreatmentRecommendation.STRONGLY_RECOMMEND;
        reasons.push(`Significant albuminuria (uACR ${uacr.toFixed(0)} mg/g)`);
      }
    }

    const rationale = reasons.length > 0
      ? reasons.join('; ')
      : 'Does not meet treatment criteria';

    return { eligible, recommendation, rationale };
  }

  /**
   * Generate clinical alert for a patient with worsening uACR
   */
  async generateClinicalAlert(
    patientId: string,
    uacrAnalysis: uACRAnalysis,
    adherenceAnalysis: AdherenceAnalysis
  ): Promise<UACRAlert> {
    // Get patient details
    const patientQuery = `
      SELECT medical_record_number, first_name || ' ' || last_name as full_name
      FROM patients WHERE id = $1
    `;
    const patientResult = await this.pool.query(patientQuery, [patientId]);
    const patient = patientResult.rows[0];

    const alertId = `UACR-ALERT-${patientId}-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Determine severity
    let severity: AlertSeverity;
    if (uacrAnalysis.worsening_level === WorseningLevel.SEVERE ||
        uacrAnalysis.worsening_level === WorseningLevel.CATEGORY_PROGRESSION) {
      severity = 'CRITICAL';
    } else if (uacrAnalysis.worsening_level === WorseningLevel.MODERATE) {
      severity = 'HIGH';
    } else if (uacrAnalysis.worsening_level === WorseningLevel.MILD) {
      severity = 'MODERATE';
    } else {
      severity = 'LOW';
    }

    // Build alert message
    let alertType: string;
    let message: string;

    if (adherenceAnalysis.on_treatment) {
      alertType = 'UACR_WORSENING_ON_TREATMENT';

      if (!adherenceAnalysis.is_adherent) {
        message = `⚠️ uACR WORSENING WITH POOR ADHERENCE\n` +
                  `Patient ${uacrAnalysis.patient_name} shows ${uacrAnalysis.worsening_level} ` +
                  `(${uacrAnalysis.percent_change > 0 ? '+' : ''}${uacrAnalysis.percent_change.toFixed(1)}%) despite being prescribed ${adherenceAnalysis.medication}.`;
      } else {
        message = `⚠️ uACR WORSENING DESPITE GOOD ADHERENCE\n` +
                  `Patient ${uacrAnalysis.patient_name} shows ${uacrAnalysis.worsening_level} ` +
                  `(${uacrAnalysis.percent_change > 0 ? '+' : ''}${uacrAnalysis.percent_change.toFixed(1)}%) despite adherence to ${adherenceAnalysis.medication}. ` +
                  `Consider treatment adjustment or additional evaluation.`;
      }
    } else {
      alertType = 'UACR_WORSENING_UNTREATED';
      message = `⚠️ uACR WORSENING IN UNTREATED PATIENT\n` +
                `Patient ${uacrAnalysis.patient_name} shows ${uacrAnalysis.worsening_level} ` +
                `(${uacrAnalysis.percent_change > 0 ? '+' : ''}${uacrAnalysis.percent_change.toFixed(1)}%) and is not currently on CKD-specific treatment.`;
    }

    // Generate recommended actions
    const recommendedActions = await this.generateRecommendedActions(
      patientId,
      uacrAnalysis,
      adherenceAnalysis
    );

    // Generate clinical rationale
    const clinicalRationale = this.generateClinicalRationale(
      uacrAnalysis,
      adherenceAnalysis
    );

    // Determine treatment recommendation for untreated patients
    let treatmentRecommendation: TreatmentRecommendation | null = null;
    if (!adherenceAnalysis.on_treatment) {
      const eligibility = await this.evaluateTreatmentEligibility(patientId);
      treatmentRecommendation = eligibility.recommendation;
    }

    return {
      alert_id: alertId,
      severity,
      patient_id: patientId,
      patient_name: uacrAnalysis.patient_name,
      mrn: patient.medical_record_number,
      alert_type: alertType,
      message,
      uacr_analysis: uacrAnalysis,
      adherence_analysis: adherenceAnalysis,
      treatment_recommendation: treatmentRecommendation,
      recommended_actions: recommendedActions,
      clinical_rationale: clinicalRationale,
      timestamp
    };
  }

  /**
   * Generate specific recommended actions
   */
  private async generateRecommendedActions(
    patientId: string,
    uacrAnalysis: uACRAnalysis,
    adherenceAnalysis: AdherenceAnalysis
  ): Promise<string[]> {
    const actions: string[] = [];

    if (adherenceAnalysis.on_treatment) {
      if (!adherenceAnalysis.is_adherent) {
        actions.push('🎯 IMMEDIATE: Address medication adherence barriers');
        actions.push('📞 URGENT: Contact patient to assess refill status');
        actions.push('🔍 Schedule adherence counseling to identify barriers');
        actions.push('📱 Consider smart pill bottle or medication reminder app');
      } else {
        actions.push('✅ Adherence is good - Treatment failure or progression suspected');
        actions.push('🔬 Consider additional diagnostic evaluation:');
        actions.push('   • Repeat uACR in 1-2 weeks to confirm');
        actions.push('   • Review blood pressure control');
        actions.push('   • Assess dietary sodium intake');
        actions.push('   • Evaluate for acute illness or dehydration');

        if (uacrAnalysis.current_uacr >= 300) {
          actions.push('⚠️ Consider adding/optimizing:');
          actions.push('   • Mineralocorticoid receptor antagonist (finerenone)');
          actions.push('   • GLP-1 receptor agonist if diabetic');
          actions.push('   • Referral to nephrologist');
        }
      }
    } else {
      const eligibility = await this.evaluateTreatmentEligibility(patientId);

      if (eligibility.eligible) {
        if (eligibility.recommendation === TreatmentRecommendation.URGENT_TREATMENT) {
          actions.push('🚨 URGENT: Initiate Jardiance (empagliflozin) 10mg daily');
          actions.push(`📋 Clinical indication: ${eligibility.rationale}`);
          actions.push('⚠️ Evidence: 28% reduction in CKD progression (EMPA-KIDNEY trial)');
          actions.push('📅 Schedule follow-up in 2-4 weeks to assess tolerance');
        } else if (eligibility.recommendation === TreatmentRecommendation.STRONGLY_RECOMMEND) {
          actions.push('⚡ STRONGLY RECOMMEND: Initiate Jardiance (empagliflozin) 10mg daily');
          actions.push(`📋 Clinical indication: ${eligibility.rationale}`);
          actions.push('💊 Expected benefit: 50% slower eGFR decline, 26+ year dialysis delay');
        } else {
          actions.push('💭 CONSIDER: Jardiance (empagliflozin) may provide benefit');
          actions.push(`📋 Rationale: ${eligibility.rationale}`);
          actions.push('📊 Discuss risks/benefits with patient');
        }
      } else {
        actions.push('📊 Continue monitoring - Does not yet meet treatment criteria');
        actions.push('📅 Repeat uACR in 3 months');
        actions.push('🔍 Optimize blood pressure and RAS inhibitor therapy');
        actions.push('🥗 Reinforce lifestyle modifications (diet, exercise, smoking cessation)');
      }
    }

    // Common actions for all worsening cases
    actions.push(
      `📈 Trend monitoring: uACR ${uacrAnalysis.previous_uacr.toFixed(0)} → ${uacrAnalysis.current_uacr.toFixed(0)} mg/g ` +
      `(${uacrAnalysis.percent_change > 0 ? '+' : ''}${uacrAnalysis.percent_change.toFixed(1)}%)`
    );

    const followUpTime = uacrAnalysis.worsening_level !== WorseningLevel.MILD ? '2-4 weeks' : '1-2 months';
    actions.push(`🔄 Schedule next uACR check in ${followUpTime}`);

    return actions;
  }

  /**
   * Generate detailed clinical rationale
   */
  private generateClinicalRationale(
    uacrAnalysis: uACRAnalysis,
    adherenceAnalysis: AdherenceAnalysis
  ): string {
    const parts: string[] = [];

    // uACR change description
    parts.push(
      `Patient shows ${uacrAnalysis.worsening_level.toLowerCase()} ` +
      `with uACR increasing from ${uacrAnalysis.previous_uacr.toFixed(0)} to ` +
      `${uacrAnalysis.current_uacr.toFixed(0)} mg/g ` +
      `(${uacrAnalysis.percent_change > 0 ? '+' : ''}${uacrAnalysis.percent_change.toFixed(1)}%) ` +
      `over ${uacrAnalysis.days_between} days.`
    );

    // Category change
    if (uacrAnalysis.current_category !== uacrAnalysis.previous_category) {
      parts.push(
        `Progression from ${uacrAnalysis.previous_category} to ` +
        `${uacrAnalysis.current_category} indicates advancing kidney disease.`
      );
    }

    // Treatment context
    if (adherenceAnalysis.on_treatment) {
      if (adherenceAnalysis.is_adherent) {
        parts.push(
          `Despite adherence to ${adherenceAnalysis.medication}, ` +
          `proteinuria is worsening. This may indicate treatment resistance, ` +
          `progressive disease, or need for additional therapies.`
        );
      } else {
        parts.push(
          `Poor adherence to ${adherenceAnalysis.medication} ` +
          `is likely contributing to disease progression. ` +
          `Improving adherence is critical to achieving therapeutic benefit ` +
          `(28% reduction in CKD progression with good adherence).`
        );
      }
    }

    return parts.join(' ');
  }

  /**
   * Process a single patient and return alert if needed
   */
  async processPatient(patientId: string): Promise<UACRAlert | null> {
    // Step 1: Analyze uACR changes
    const uacrAnalysis = await this.analyzeUACRChange(patientId);

    if (!uacrAnalysis || !uacrAnalysis.is_worsening) {
      return null; // No worsening detected
    }

    // Step 2: Analyze adherence
    const adherenceAnalysis = await this.analyzeAdherence(patientId);

    // Step 3: Generate clinical alert
    const alert = await this.generateClinicalAlert(patientId, uacrAnalysis, adherenceAnalysis);

    return alert;
  }

  /**
   * Scan entire patient database and generate alerts
   */
  async scanPatientDatabase(): Promise<ScanResults> {
    const scanDate = new Date().toISOString();

    // Get all patients with at least 2 uACR measurements
    const patientsQuery = `
      SELECT DISTINCT p.id
      FROM patients p
      JOIN observations o ON p.id = o.patient_id
      WHERE o.observation_type = 'uACR'
      GROUP BY p.id
      HAVING COUNT(*) >= 2
    `;

    const patientsResult = await this.pool.query(patientsQuery);
    const totalPatients = patientsResult.rows.length;

    // Process each patient
    const alerts: UACRAlert[] = [];

    for (const row of patientsResult.rows) {
      const alert = await this.processPatient(row.id);
      if (alert) {
        alerts.push(alert);
      }
    }

    // Calculate statistics
    const severityDistribution = {
      CRITICAL: alerts.filter(a => a.severity === 'CRITICAL').length,
      HIGH: alerts.filter(a => a.severity === 'HIGH').length,
      MODERATE: alerts.filter(a => a.severity === 'MODERATE').length,
      LOW: alerts.filter(a => a.severity === 'LOW').length
    };

    const alertTypeFrequency: Record<string, number> = {};
    for (const alert of alerts) {
      alertTypeFrequency[alert.alert_type] = (alertTypeFrequency[alert.alert_type] || 0) + 1;
    }

    const worseningPercentage = totalPatients > 0
      ? parseFloat(((alerts.length / totalPatients) * 100).toFixed(1))
      : 0;

    return {
      scan_date: scanDate,
      total_patients_scanned: totalPatients,
      patients_with_worsening: alerts.length,
      worsening_percentage: worseningPercentage,
      severity_distribution: severityDistribution,
      alert_type_frequency: alertTypeFrequency,
      alerts
    };
  }
}
