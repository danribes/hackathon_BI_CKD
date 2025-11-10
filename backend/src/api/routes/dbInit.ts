/**
 * Database Initialization Route
 *
 * This endpoint initializes the database with all required tables and data.
 * Access via: GET /api/db/init
 *
 * ⚠️ WARNING: This should only be run once on initial deployment
 */

import { Router, Request, Response } from 'express';
import { getPool } from '../../config/database';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * Initialize database with schema and data
 * GET /api/db/init
 */
router.get('/init', async (_req: Request, res: Response): Promise<any> => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('[DB Init] Starting database initialization...');

    // Begin transaction
    await client.query('BEGIN');

    // Check if already initialized
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'patients'
      ) as table_exists
    `);

    if (checkResult.rows[0].table_exists) {
      const countResult = await client.query('SELECT COUNT(*) FROM patients');
      const patientCount = parseInt(countResult.rows[0].count);

      if (patientCount > 0) {
        client.release();
        return res.json({
          status: 'already_initialized',
          message: 'Database already contains data',
          patient_count: patientCount,
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log('[DB Init] Creating extensions...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await client.query('SET timezone = \'UTC\'');

    // Read and execute init.sql
    console.log('[DB Init] Creating base schema...');
    const initSqlPath = path.join(__dirname, '../../../infrastructure/postgres/init.sql');

    if (fs.existsSync(initSqlPath)) {
      const initSql = fs.readFileSync(initSqlPath, 'utf8');
      await client.query(initSql);
      console.log('[DB Init] ✓ Base schema created');
    } else {
      console.log('[DB Init] Warning: init.sql not found, creating tables manually...');

      // Create core tables manually
      await client.query(`
        CREATE TABLE IF NOT EXISTS patients (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          medical_record_number VARCHAR(20) UNIQUE NOT NULL,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          date_of_birth DATE NOT NULL,
          gender VARCHAR(10) NOT NULL,
          email VARCHAR(100),
          phone VARCHAR(20),
          weight DECIMAL(5, 2),
          height INTEGER,
          smoking_status VARCHAR(20),
          cvd_history BOOLEAN DEFAULT false,
          family_history_esrd BOOLEAN DEFAULT false,
          on_ras_inhibitor BOOLEAN DEFAULT false,
          on_sglt2i BOOLEAN DEFAULT false,
          nephrotoxic_meds BOOLEAN DEFAULT false,
          nephrologist_referral BOOLEAN DEFAULT false,
          diagnosis_date DATE,
          last_visit_date DATE,
          next_visit_date DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS observations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
          observation_type VARCHAR(50) NOT NULL,
          value_numeric DECIMAL(10, 2),
          value_text VARCHAR(100),
          unit VARCHAR(20),
          observation_date TIMESTAMP NOT NULL,
          status VARCHAR(20) DEFAULT 'final',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS conditions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
          condition_code VARCHAR(20) NOT NULL,
          condition_name VARCHAR(200) NOT NULL,
          clinical_status VARCHAR(20) NOT NULL,
          onset_date DATE,
          recorded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          severity VARCHAR(20),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS risk_assessments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
          risk_score DECIMAL(3, 2) NOT NULL,
          risk_level VARCHAR(20) NOT NULL,
          recommendations TEXT[],
          reasoning TEXT,
          assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('[DB Init] ✓ Core tables created');
    }

    // Run migrations
    const migrationsPath = path.join(__dirname, '../../../infrastructure/postgres/migrations');
    const migrations = [
      '001_add_enhanced_patient_fields.sql',
      '002_add_200_mock_patients.sql',
      '003_add_monitoring_triggers.sql',
      '004_add_ckd_diagnosis_detection.sql'
    ];

    for (const migration of migrations) {
      const migrationPath = path.join(migrationsPath, migration);

      if (fs.existsSync(migrationPath)) {
        console.log(`[DB Init] Running migration: ${migration}...`);
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        await client.query(migrationSql);
        console.log(`[DB Init] ✓ ${migration} completed`);
      } else {
        console.log(`[DB Init] Warning: ${migration} not found, skipping...`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    // Verify data loaded
    const verifyResult = await client.query('SELECT COUNT(*) as count FROM patients');
    const patientCount = parseInt(verifyResult.rows[0].count);

    console.log('[DB Init] ✓ Database initialization complete!');

    res.json({
      status: 'success',
      message: 'Database initialized successfully',
      patient_count: patientCount,
      tables_created: ['patients', 'observations', 'conditions', 'risk_assessments',
                      'patient_risk_history', 'doctor_notifications',
                      'ckd_diagnosis_events', 'ckd_treatment_protocols', 'doctor_action_queue'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('[DB Init] Error:', error);

    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize database',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
});

/**
 * Check initialization status
 * GET /api/db/init/status
 */
router.get('/init/status', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();

    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(r => r.table_name);

    // Count patients if table exists
    let patientCount = 0;
    if (tables.includes('patients')) {
      const countResult = await pool.query('SELECT COUNT(*) FROM patients');
      patientCount = parseInt(countResult.rows[0].count);
    }

    const isInitialized = tables.length > 0 && patientCount > 0;

    res.json({
      status: 'ok',
      initialized: isInitialized,
      tables: tables,
      patient_count: patientCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to check initialization status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
