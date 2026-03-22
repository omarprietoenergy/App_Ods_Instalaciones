import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;

// Cargamos variables de entorno (ideal para ejecución local por CLI)
dotenv.config();

/**
 * AI CTO Collector v0.1
 * 
 * Este script es un MVP para leer métricas operativas de OpenClaw/ODS.
 * Lee del esquema principal `public.*` en ODS (solo lectura)
 * y persiste snapshots y alertas en `ai_cto.*` (lectura/escritura).
 */

const SOURCE_DB_URL = process.env.ODS_SOURCE_DATABASE_URL;
const AI_CTO_DB_URL = process.env.AI_CTO_DATABASE_URL;
const TIMEZONE = process.env.AI_CTO_TIMEZONE || 'Europe/Madrid';
const IS_DRY_RUN = process.env.AI_CTO_COLLECTOR_DRY_RUN === 'true';

if (!SOURCE_DB_URL) {
  console.error("❌ ODS_SOURCE_DATABASE_URL no está definido en el entorno.");
  process.exit(1);
}

if (!IS_DRY_RUN && !AI_CTO_DB_URL) {
  console.error("❌ AI_CTO_DATABASE_URL no está definido (requerido cuando no es modo dry-run).");
  process.exit(1);
}

// Configuración de clientes (usamos pg pool para permitir manejo asíncrono robusto)
const sourcePool = new Pool({
  connectionString: SOURCE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

const ctoPool = IS_DRY_RUN ? null : new Pool({
  connectionString: AI_CTO_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function runCollector() {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Iniciando AI-CTO Collector v0.1`);
  console.log(`🌍 Timezone configurado: ${TIMEZONE}`);
  console.log(`🚀 Modo de ejecución: ${IS_DRY_RUN ? 'DRY-RUN (solo muestra JSON, no escribe en BD)' : 'PRODUCCIÓN (escribiendo en ai_cto.*)'}`);

  const metrics: Record<string, number> = {};
  const details: any = { warnings: [] };
  
  try {
    // ---------------------------------------------------------
    // Métrica 1: Conflictos de "una sola actividad activa" por técnico
    // Validamos si un técnico tiene >1 tarea con status = 'working' simultáneamente
    // ---------------------------------------------------------
    const activeConflictsRes = await sourcePool.query(`
      SELECT "technicianId", COUNT(*) as count
      FROM public."technicianDailyAssignments"
      WHERE status = 'working' AND "endAt" IS NULL
      GROUP BY "technicianId"
      HAVING COUNT(*) > 1
    `);
    metrics['multiple_active_assignments'] = activeConflictsRes.rowCount || 0;
    
    // ---------------------------------------------------------
    // Métrica 2: Jornadas de días anteriores sin cerrar (stale shifts)
    // Al finalizar el día, todos los shifts deberían tener endAt NOT NULL.
    // ---------------------------------------------------------
    const staleShiftsRes = await sourcePool.query(`
      SELECT id, "technicianId", date, "startAt"
      FROM public."technicianShifts"
      WHERE "endAt" IS NULL 
        AND status IN ('active', 'paused')
        AND date < (CURRENT_TIMESTAMP AT TIME ZONE $1)::date
    `, [TIMEZONE]);
    metrics['stale_open_shifts'] = staleShiftsRes.rowCount || 0;

    // ---------------------------------------------------------
    // Métrica 3: Trabajo realizado sin parte diario
    // Tareas con status 'completed' en los últimos 2 días, pero sin un registro
    // en "dailyReports" para ese día/instalación/técnico.
    // ---------------------------------------------------------
    const missingReportsRes = await sourcePool.query(`
      SELECT tda.id, tda."technicianId", tda."installationId", tda.date
      FROM public."technicianDailyAssignments" tda
      LEFT JOIN public."dailyReports" dr
        ON tda."installationId" = dr."installationId"
       AND tda."technicianId" = dr."userId"
       AND dr."reportDate"::date = tda.date
      WHERE tda.status = 'completed' 
        AND dr.id IS NULL
        AND tda.date >= ((CURRENT_TIMESTAMP AT TIME ZONE $1) - INTERVAL '2 days')::date
    `, [TIMEZONE]);
    metrics['completed_assignments_without_reports'] = missingReportsRes.rowCount || 0;
    
    // ---------------------------------------------------------
    // Métrica 4: Instalaciones 'En proceso' sin reportes ni actividad reciente (>7 días)
    // Buscamos explícitamente las que están en progress.
    // ---------------------------------------------------------
    const stalledInstallationsRes = await sourcePool.query(`
      SELECT i.id, i."clientName"
      FROM public.installations i
      LEFT JOIN public."dailyReports" dr
        ON i.id = dr."installationId" AND dr."createdAt" > (CURRENT_TIMESTAMP AT TIME ZONE $1) - INTERVAL '7 days'
      LEFT JOIN public."technicianDailyAssignments" tda
        ON i.id = tda."installationId" AND tda."createdAt" > (CURRENT_TIMESTAMP AT TIME ZONE $1) - INTERVAL '7 days'
      LEFT JOIN public."installationStatusHistory" ish
        ON i.id = ish."installationId" AND ish."changedAt" > (CURRENT_TIMESTAMP AT TIME ZONE $1) - INTERVAL '7 days'
      WHERE i.status = 'in_progress'
        AND dr.id IS NULL
        AND tda.id IS NULL
        AND ish.id IS NULL
    `, [TIMEZONE]);
    metrics['installations_in_progress_without_recent_activity'] = stalledInstallationsRes.rowCount || 0;

    // ---------------------------------------------------------
    // Construcción del Snapshot Payload
    // ---------------------------------------------------------
    const windowEnd = new Date().toISOString();
    const snapshotPayload = {
      kind: 'ods_metrics_snapshot',
      window: {
        start: startTime.toISOString(),
        end: windowEnd,
        timezone: TIMEZONE
      },
      metrics,
      details: {
        by_user: [], // Reservado para v0.2
        by_installation: [], // Reservado para v0.2
        warnings: details.warnings
      }
    };
    
    // ---------------------------------------------------------
    // Cálculo Rango de Semana usando la DB (Postgres) Timezone-aware
    // ---------------------------------------------------------
    const weekRangeRes = await sourcePool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('week', CURRENT_TIMESTAMP AT TIME ZONE $1), 'YYYY-MM-DD') AS week_start,
        TO_CHAR(DATE_TRUNC('week', CURRENT_TIMESTAMP AT TIME ZONE $1) + INTERVAL '6 days', 'YYYY-MM-DD') AS week_end
    `, [TIMEZONE]);
    
    const weekStartStr = weekRangeRes.rows[0].week_start;
    const weekEndStr = weekRangeRes.rows[0].week_end;

    const allMetricsZero = (
      metrics.multiple_active_assignments === 0 &&
      metrics.stale_open_shifts === 0 &&
      metrics.completed_assignments_without_reports === 0 &&
      metrics.installations_in_progress_without_recent_activity === 0
    );

    const summaryMd = `
# ODS Energy - Reporte Operativo v0.1

**Resumen Ejecutivo:**
Se ha ejecutado el snapshot del estado operativo. Se detectan las siguientes fricciones principales:

**Top fricciones detectadas:**
- Asignaciones conflictivas (múltiples activas): ${metrics.multiple_active_assignments}
- Jornadas abiertas de días anteriores: ${metrics.stale_open_shifts}
- Asignaciones completadas sin parte de trabajo (últimos 2 días): ${metrics.completed_assignments_without_reports}
- Instalaciones activas sin movimiento en 7 días: ${metrics.installations_in_progress_without_recent_activity}

**Prioridades Propuestas (P0/P1/P2):**
${metrics.stale_open_shifts > 0 ? '- P0: Cerrar jornadas de días anteriores inmediatamente.' : ''}
${metrics.completed_assignments_without_reports > 0 ? '- P1: Reclamar partes de trabajo faltantes a los técnicos.' : ''}
${metrics.installations_in_progress_without_recent_activity > 0 ? '- P2: Revisar instalaciones estancadas sin actividad de 7 días.' : ''}
${allMetricsZero ? '- Todo perfecto operativo. Sin incidentes graves.' : ''}
    `.trim();

    // ---------------------------------------------------------
    // Persistencia o Log en consola (Modo Dry Run)
    // ---------------------------------------------------------
    if (IS_DRY_RUN) {
      console.log("\n✅ --- RESULTADOS MODO DRY-RUN --- ✅");
      console.log(JSON.stringify(snapshotPayload, null, 2));
      console.log(`\n📅 Rango del Reporte Semanal (Timezone: ${TIMEZONE}): ${weekStartStr} al ${weekEndStr}`);
      console.log("------------------------------------\n");
    } else {
      const client = await ctoPool!.connect();
      try {
        await client.query('BEGIN');

        // 1. Snapshot a ai_cto.task_metrics
        await client.query(`
          INSERT INTO ai_cto.task_metrics (
            task_type, source_channel, requester, primary_agent, final_agent, success, notes
          ) VALUES (
            'collector_v0_1_snapshot', 'ods_app', 'system', 'collector_v0_1', 'collector_v0_1', true, $1
          )
        `, [JSON.stringify(snapshotPayload)]);
        
        // 2. Reporte semanal rule-based a ai_cto.weekly_reports
        const existingReportRes = await client.query(
          `SELECT id FROM ai_cto.weekly_reports WHERE week_start = $1::date`,
          [weekStartStr]
        );
        
        if ((existingReportRes.rowCount || 0) > 0) {
          await client.query(`
            UPDATE ai_cto.weekly_reports 
            SET summary_md = $1, metrics = $2, week_end = $3::date
            WHERE id = $4
          `, [summaryMd, JSON.stringify(metrics), weekEndStr, existingReportRes.rows[0].id]);
        } else {
          await client.query(`
            INSERT INTO ai_cto.weekly_reports (
              week_start, week_end, summary_md, metrics
            ) VALUES (
              $1::date, $2::date, $3, $4
            )
          `, [weekStartStr, weekEndStr, summaryMd, JSON.stringify(metrics)]);
        }

        await client.query('COMMIT');
        console.log("✅ Métricas guardadas satisfactoriamente en esquema ai_cto bajo transacción.");
      } catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Transacción revertida por error.");
        throw e; // Lanza el error para que sea atrapado por el bloque externo
      } finally {
        client.release();
      }
    }
  } catch (error: any) {
    console.error("❌ Fallo durante la recolección de métricas:", error);
    
    // Tratamos de registrar el error en tabla de failures fuera de la tx original
    if (!IS_DRY_RUN && ctoPool) {
      try {
        await ctoPool.query(`
          INSERT INTO ai_cto.failures (
            agent_id, task_type, severity, error_summary, meta, resolved
          ) VALUES (
            'collector_v0_1', 'metrics_collection', 'critical', $1, $2, false
          )
        `, [error.message, JSON.stringify({ stack: error.stack })]);
        console.log("⚠️ Detalles del error registrados exitosamente en ai_cto.failures.");
      } catch (logError) {
        console.error("🔥 Error crítico al intentar guardar fallback en ai_cto.failures:", logError);
      }
    }
  } finally {
    // Cerramos explícitamente las conexiones
    await sourcePool.end();
    if (ctoPool) await ctoPool.end();
  }
}

// Inicializar
runCollector().catch(e => {
  console.error("Unhandled error en collector:", e);
  process.exit(1);
});
