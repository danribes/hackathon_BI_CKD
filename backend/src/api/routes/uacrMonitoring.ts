/**
 * uACR Monitoring & Adherence API Routes
 *
 * Endpoints for the uACR monitoring and treatment adherence system
 */

import { Router, Request, Response } from 'express';
import { UACRMonitoringService } from '../../services/uacrMonitoringService';
import { getPool } from '../../config/database';

const router = Router();

/**
 * GET /api/uacr-monitoring/scan
 * Run a complete scan of all patients and return uACR monitoring results
 */
router.get('/scan', async (_req: Request, res: Response): Promise<void> => {
  try {
    const pool = getPool();
    const monitoringService = new UACRMonitoringService(pool);

    const results = await monitoringService.scanPatientDatabase();

    res.json({
      status: 'success',
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error scanning patients for uACR monitoring:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to scan patients for uACR monitoring',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/uacr-monitoring/patient/:patientId
 * Get uACR monitoring alert for a specific patient
 */
router.get('/patient/:patientId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const pool = getPool();
    const monitoringService = new UACRMonitoringService(pool);

    const alert = await monitoringService.processPatient(patientId);

    if (!alert) {
      res.json({
        status: 'success',
        data: null,
        message: 'No uACR worsening detected for this patient',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      status: 'success',
      data: alert,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error analyzing patient ${req.params.patientId}:`, error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to analyze patient',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/uacr-monitoring/critical
 * Get all critical severity alerts
 */
router.get('/critical', async (_req: Request, res: Response): Promise<void> => {
  try {
    const pool = getPool();
    const monitoringService = new UACRMonitoringService(pool);

    const results = await monitoringService.scanPatientDatabase();
    const criticalAlerts = results.alerts.filter(alert => alert.severity === 'CRITICAL');

    res.json({
      status: 'success',
      data: criticalAlerts,
      count: criticalAlerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching critical uACR alerts:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch critical uACR alerts',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/uacr-monitoring/severity/:severity
 * Get alerts filtered by severity level
 * @param severity - CRITICAL, HIGH, MODERATE, or LOW
 */
router.get('/severity/:severity', async (req: Request, res: Response): Promise<void> => {
  try {
    const severity = req.params.severity.toUpperCase();

    // Validate severity
    if (!['CRITICAL', 'HIGH', 'MODERATE', 'LOW'].includes(severity)) {
      res.status(400).json({
        status: 'error',
        error: 'Invalid severity level',
        message: 'Severity must be one of: CRITICAL, HIGH, MODERATE, LOW',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const pool = getPool();
    const monitoringService = new UACRMonitoringService(pool);

    const results = await monitoringService.scanPatientDatabase();
    const filteredAlerts = results.alerts.filter(alert => alert.severity === severity);

    res.json({
      status: 'success',
      data: filteredAlerts,
      count: filteredAlerts.length,
      severity,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching uACR alerts by severity:`, error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch uACR alerts by severity',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/uacr-monitoring/stats
 * Get uACR monitoring statistics without full alert list
 */
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const pool = getPool();
    const monitoringService = new UACRMonitoringService(pool);

    const results = await monitoringService.scanPatientDatabase();

    // Return only statistics, not full alert list
    res.json({
      status: 'success',
      data: {
        scan_date: results.scan_date,
        total_patients_scanned: results.total_patients_scanned,
        patients_with_worsening: results.patients_with_worsening,
        worsening_percentage: results.worsening_percentage,
        severity_distribution: results.severity_distribution,
        alert_type_frequency: results.alert_type_frequency
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching uACR monitoring stats:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch uACR monitoring statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
