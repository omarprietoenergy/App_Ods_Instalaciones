/**
 * AI-CTO collector v0.2
 * Run via: npx tsx scripts/ai-cto/collector-v0.2.ts [--dry-run]
 */

import { Client } from 'pg';

interface WeeklyReportMetrics {
  version: "v0.2";
  generated_at: string;
  week_range: {
    start: string;
    end: string;
    timezone: "Europe/Madrid";
  };
  headline: {
    overall_status: "ok" | "warning" | "critical";
    alerts_count: number;
    top_issue: string | null;
  };
  totals: {
    multiple_active_assignments: number;
    stale_open_shifts: number;
    completed_assignments_without_reports: number;
    installations_in_progress_without_recent_activity: number;
  };
  details: {
    by_user: any[];
    by_installation: any[];
    warnings: any[];
  };
  agent_team: {
    top_primary_agent: string | null;
    top_final_agent: string | null;
    high_delegation_tasks: number;
    manual_overrides: number;
    avg_latency_ms: number | null;
    reasoning_overuse_warning: boolean;
  };
  product_opportunities: any[];
  recommended_actions: string[];
}

function buildSummaryMd(metrics: WeeklyReportMetrics): string {
  let md = `# AI-CTO Weekly Report v0.2\n\n`;

  // 1. Executive summary
  md += `## Executive Summary\n`;
  md += `**Status:** \`${metrics.headline.overall_status}\` - ${metrics.headline.top_issue || 'Operations are stable.'}\n`;
  md += `**Week Range:** ${metrics.week_range.start} to ${metrics.week_range.end}\n`;
  md += `**Total Alerts:** ${metrics.headline.alerts_count}\n\n`;

  // 2. Operational alerts
  md += `## Operational Alerts\n`;
  md += `- **Multiple active assignments:** ${metrics.totals.multiple_active_assignments}\n`;
  md += `- **Stale open shifts:** ${metrics.totals.stale_open_shifts}\n`;
  md += `- **Completed assignments without reports:** ${metrics.totals.completed_assignments_without_reports}\n`;
  md += `- **Idle installations (>7 days):** ${metrics.totals.installations_in_progress_without_recent_activity}\n\n`;

  // 3. By technician
  md += `## By Technician\n`;
  if (metrics.details.by_user.length === 0) {
    md += `- No technician anomalies reported.\n\n`;
  } else {
    metrics.details.by_user.forEach(u => md += `- **${u.metric}:** ${JSON.stringify(u.technicians || u.incidents)}\n`);
    md += `\n`;
  }

  // 4. By installation
  md += `## By Installation\n`;
  if (metrics.details.by_installation.length === 0) {
    md += `- No installation anomalies reported.\n\n`;
  } else {
    metrics.details.by_installation.forEach(inst => {
      md += `- **${inst.metric}:** ${JSON.stringify(inst.installations)}\n`;
    });
    md += `\n`;
  }

  // 5. Agent team signals
  md += `## Agent Team Signals\n`;
  if (metrics.agent_team.avg_latency_ms !== null) {
    md += `- **Avg Latency:** ${Math.round(metrics.agent_team.avg_latency_ms)}ms\n`;
    md += `- **Primary Agent:** ${metrics.agent_team.top_primary_agent || 'N/A'}\n`;
    md += `- **Final Agent:** ${metrics.agent_team.top_final_agent || 'N/A'}\n`;
    md += `- **High Delegations:** ${metrics.agent_team.high_delegation_tasks}\n`;
    md += `- **Manual Overrides:** ${metrics.agent_team.manual_overrides}\n\n`;
  } else {
    md += `- Insufficient signal from task_metrics this week.\n\n`;
  }

  // 6. Product / process opportunities
  md += `## Product / Process Opportunities\n`;
  if (metrics.product_opportunities.length === 0) {
    md += `- No new opportunities detected.\n\n`;
  } else {
    metrics.product_opportunities.forEach(o => md += `- [${o.category}] ${o.description}\n`);
    md += `\n`;
  }

  // 7. Recommended actions
  md += `## Recommended Actions\n`;
  if (metrics.recommended_actions.length === 0) {
    md += `- Keep monitoring.\n`;
  } else {
    metrics.recommended_actions.forEach(a => md += `- ${a}\n`);
  }

  return md;
}

// Safely parse Postgres date object or string into YYYY-MM-DD
function parsePgDate(val: any): string {
  if (!val) return "1970-01-01";
  if (typeof val === 'string') return val.split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val).split(' ')[0];
}

async function main() {
  const t0 = Date.now();
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");

  console.log(`[AI-CTO v0.2] Starting collector... Dry run: ${isDryRun}`);

  if (!process.env.ODS_SOURCE_DATABASE_URL || !process.env.AI_CTO_DATABASE_URL) {
    console.error("[AI-CTO v0.2] Missing database URL in environment.");
    process.exit(1);
  }

  const odsClient = new Client({ 
    connectionString: process.env.ODS_SOURCE_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  const aictoClient = new Client({ 
    connectionString: process.env.AI_CTO_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await odsClient.connect();
    await aictoClient.connect();
  } catch (err) {
    console.error("[AI-CTO v0.2] Error connecting to databases:", err);
    process.exit(1);
  }

  if (!isDryRun) {
    await aictoClient.query('BEGIN');
  }

  try {
    const nowIso = new Date().toISOString();

    const weekRes = await aictoClient.query(`
      SELECT 
        date_trunc('week', NOW() AT TIME ZONE 'Europe/Madrid')::DATE as start_date,
        (date_trunc('week', NOW() AT TIME ZONE 'Europe/Madrid') + INTERVAL '6 days')::DATE as end_date
    `);
    
    const weekStart = parsePgDate(weekRes.rows[0]?.start_date);
    const weekEnd = parsePgDate(weekRes.rows[0]?.end_date);

    const metrics: WeeklyReportMetrics = {
      version: "v0.2",
      generated_at: nowIso,
      week_range: { start: weekStart, end: weekEnd, timezone: "Europe/Madrid" },
      headline: { overall_status: "ok", alerts_count: 0, top_issue: null },
      totals: {
        multiple_active_assignments: 0,
        stale_open_shifts: 0,
        completed_assignments_without_reports: 0,
        installations_in_progress_without_recent_activity: 0
      },
      details: { by_user: [], by_installation: [], warnings: [] },
      agent_team: {
        top_primary_agent: null,
        top_final_agent: null,
        high_delegation_tasks: 0,
        manual_overrides: 0,
        avg_latency_ms: null,
        reasoning_overuse_warning: false
      },
      product_opportunities: [],
      recommended_actions: []
    };

    // --- 1. METRICS ODS ---
    
    // 1a. Multiple active assignments
    const resActiveAssig = await odsClient.query(`
      SELECT "technicianId", COUNT(*) as count 
      FROM "technicianDailyAssignments" 
      WHERE status = 'working' AND "endTime" IS NULL
      GROUP BY "technicianId" 
      HAVING COUNT(*) > 1
    `);
    
    metrics.totals.multiple_active_assignments = resActiveAssig.rowCount || 0;
    if ((resActiveAssig.rowCount || 0) > 0) {
      metrics.details.by_user.push({
        metric: "multiple_active_assignments",
        technicians: resActiveAssig.rows.map(r => ({ technicianId: r.technicianId, active_count: parseInt(r.count, 10) }))
      });
    }

    // 1b. Stale open shifts (Strict v0.1: endAt IS NULL, active/paused, date < today in EU/Madrid)
    const resStaleShifts = await odsClient.query(`
      SELECT "technicianId", "startAt" 
      FROM "technicianShifts" 
      WHERE "endAt" IS NULL 
        AND status IN ('active', 'paused') 
        AND date < (NOW() AT TIME ZONE 'Europe/Madrid')::DATE
    `);
    
    metrics.totals.stale_open_shifts = resStaleShifts.rowCount || 0;
    if ((resStaleShifts.rowCount || 0) > 0) {
      metrics.details.by_user.push({
        metric: "stale_open_shifts",
        technicians: resStaleShifts.rows.map(r => ({ technicianId: r.technicianId, startAt: r.startAt }))
      });
    }

    // 1c. Completed assignments without reports
    const resPendingReports = await odsClient.query(`
      SELECT tda."technicianId", tda."installationId", tda."date"
      FROM "technicianDailyAssignments" tda
      LEFT JOIN "dailyReports" dr 
        ON tda."installationId" = dr."installationId" 
        AND tda."technicianId" = dr."userId" 
        AND DATE(dr."reportDate") = tda."date"
      WHERE tda.status = 'completed' 
        AND dr.id IS NULL
        AND tda."date" >= (NOW() AT TIME ZONE 'Europe/Madrid' - INTERVAL '2 days')::DATE
    `);
    
    metrics.totals.completed_assignments_without_reports = resPendingReports.rowCount || 0;
    if ((resPendingReports.rowCount || 0) > 0) {
      metrics.details.by_user.push({
        metric: "completed_assignments_without_reports",
        incidents: resPendingReports.rows.map(r => ({ technicianId: r.technicianId, installationId: r.installationId, date: r.date }))
      });
    }

    // 1d. Installations in progress without recent activity (>7 days missing reports, assignments or history)
    const resIdleInst = await odsClient.query(`
      SELECT i.id, i."updatedAt"
      FROM "installations" i
      WHERE i.status = 'in_progress'
        AND NOT EXISTS (
          SELECT 1 FROM "dailyReports" dr 
          WHERE dr."installationId" = i.id AND dr."reportDate" >= NOW() - INTERVAL '7 days'
        )
        AND NOT EXISTS (
          SELECT 1 FROM "technicianDailyAssignments" tda 
          WHERE tda."installationId" = i.id AND tda."date" >= (NOW() - INTERVAL '7 days')::DATE
        )
        AND NOT EXISTS (
          SELECT 1 FROM "installationStatusHistory" sh 
          WHERE sh."installationId" = i.id AND sh."createdAt" >= NOW() - INTERVAL '7 days'
        )
    `);
    
    metrics.totals.installations_in_progress_without_recent_activity = resIdleInst.rowCount || 0;
    if ((resIdleInst.rowCount || 0) > 0) {
      metrics.details.by_installation.push({
        metric: "idle_in_progress",
        installations: resIdleInst.rows.map(r => ({ installationId: r.id, last_updated: r.updatedAt }))
      });
    }

    // --- 2. WARNINGS & HEADLINE ---
    if (metrics.totals.multiple_active_assignments > 0 || metrics.totals.stale_open_shifts > 0) {
      metrics.headline.overall_status = "critical";
      metrics.headline.top_issue = "Critical operational drift detected in shifts/assignments.";
    } else if (metrics.totals.completed_assignments_without_reports > 0 || metrics.totals.installations_in_progress_without_recent_activity > 0) {
      metrics.headline.overall_status = "warning";
      metrics.headline.top_issue = "Missing reports or idle installations forming a backlog.";
    } else {
      metrics.headline.overall_status = "ok";
    }
    metrics.headline.alerts_count = 
      metrics.totals.multiple_active_assignments + 
      metrics.totals.stale_open_shifts + 
      metrics.totals.completed_assignments_without_reports + 
      metrics.totals.installations_in_progress_without_recent_activity;

    // --- 3. AGENT TEAM METRICS ---
    const aiMetrics = await aictoClient.query(`
      SELECT 
        COUNT(*) as total_tasks, 
        AVG(latency_ms) as avg_latency,
        SUM(CASE WHEN manual_override THEN 1 ELSE 0 END) as total_overrides,
        SUM(delegation_count) as total_delegations,
        MODE() WITHIN GROUP (ORDER BY primary_agent) as top_primary,
        MODE() WITHIN GROUP (ORDER BY final_agent) as top_final
      FROM ai_cto.task_metrics 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    
    const tasks = aiMetrics.rows[0];
    if (tasks && parseInt(tasks.total_tasks, 10) > 10) {
      metrics.agent_team.avg_latency_ms = parseFloat(tasks.avg_latency) || 0;
      metrics.agent_team.top_primary_agent = tasks.top_primary || null;
      metrics.agent_team.top_final_agent = tasks.top_final || null;
      metrics.agent_team.manual_overrides = parseInt(tasks.total_overrides, 10) || 0;
      metrics.agent_team.high_delegation_tasks = parseInt(tasks.total_delegations, 10) || 0;
    } else {
      metrics.details.warnings.push({ type: "insufficient_signal", message: "Not enough data in ai_cto.task_metrics to populate agent_team." });
    }

    // --- 4. OPPORTUNITIES & ACTIONS ---
    if (metrics.totals.completed_assignments_without_reports > 5) {
      metrics.product_opportunities.push({ category: "field_operations", description: "Implement auto-prompt for daily report upon assignment completion." });
      metrics.recommended_actions.push("Review report compliance with technicians having >2 missing reports.");
    }
    if (metrics.totals.stale_open_shifts > 0) {
      metrics.recommended_actions.push("Implement auto-checkout for shifts remaining open past midnight.");
    }

    const summary_md = buildSummaryMd(metrics);

    // --- 5. PRESTAGING PROPOSALS & EXPERIMENTS ---
    const newProposals = [
      { 
        title: "Automated Check-out Warning", 
        area: "field_operations", 
        description_md: "Send SMS 1h before shift hard-limit.", 
        expected_impact: "high", 
        estimated_effort: "low", 
        risk_level: "low", 
        status: "proposed", 
        meta: {} 
      }
    ];

    const newExperiments = [
      { 
        name: "Strict Report Blocking", 
        hypothesis: "Blocking assignments encourages reporting.", 
        design_md: "Block app if prev day report is missing.", 
        owner: "AI-CTO", 
        status: "proposed", 
        result_md: null, 
        meta: {} 
      }
    ];

    if (!isDryRun) {
      console.log("[AI-CTO v0.2] Saving to AI-CTO Schema...");
      
      const existingReport = await aictoClient.query(`
        SELECT id FROM ai_cto.weekly_reports WHERE week_start = $1
      `, [weekStart]);

      if (existingReport.rowCount && existingReport.rowCount > 0) {
        await aictoClient.query(`
          UPDATE ai_cto.weekly_reports 
          SET week_end = $2, summary_md = $3, report_html = $4, metrics = $5
          WHERE week_start = $1
        `, [weekStart, weekEnd, summary_md, null, JSON.stringify(metrics)]);
      } else {
        await aictoClient.query(`
          INSERT INTO ai_cto.weekly_reports (week_start, week_end, summary_md, report_html, metrics, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [weekStart, weekEnd, summary_md, null, JSON.stringify(metrics)]);
      }

      for (const prop of newProposals) {
        await aictoClient.query(`
          INSERT INTO ai_cto.innovation_proposals (title, area, description_md, expected_impact, estimated_effort, risk_level, status, meta, created_at)
          SELECT $1, $2, $3, $4, $5, $6, $7, $8, NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM ai_cto.innovation_proposals WHERE title = $1 AND status IN ('proposed', 'open')
          )
        `, [prop.title, prop.area, prop.description_md, prop.expected_impact, prop.estimated_effort, prop.risk_level, prop.status, prop.meta]);
      }

      for (const exp of newExperiments) {
        await aictoClient.query(`
          INSERT INTO ai_cto.experiments (name, hypothesis, design_md, owner, status, result_md, meta, created_at)
          SELECT $1, $2, $3, $4, $5, $6, $7, NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM ai_cto.experiments WHERE name = $1 AND status IN ('proposed', 'open', 'running')
          )
        `, [exp.name, exp.hypothesis, exp.design_md, exp.owner, exp.status, exp.result_md, exp.meta]);
      }

      const latencyMs = Date.now() - t0;
      const notesJson = JSON.stringify({
        execution_context: "cron_v0.2",
        dry_run: false,
        metrics_computed: 4,
        warnings_registered: metrics.details.warnings.length,
        week_start: weekStart,
        week_end: weekEnd,
        headline_status: metrics.headline.overall_status
      });

      await aictoClient.query(`
        INSERT INTO ai_cto.task_metrics (task_type, source_channel, requester, primary_agent, final_agent, success, latency_ms, delegation_count, retries, manual_override, notes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW())
      `, [
        'weekly_collector',
        'cron',
        'system',
        'collector_agent',
        'collector_agent',
        true,
        latencyMs,
        0,
        0,
        false,
        notesJson
      ]);

      await aictoClient.query('COMMIT');
      console.log("[AI-CTO v0.2] Transaction committed. Data successfully inserted.");
    } else {
      console.log("[AI-CTO v0.2] DRY RUN OUTPUT:");
      console.log(JSON.stringify(metrics, null, 2));
      console.log("\n[SUMMARY MD PREVIEW]\n" + summary_md);
      
      const notesJsonExample = JSON.stringify({
        execution_context: "cron_v0.2",
        dry_run: true,
        metrics_computed: 4,
        warnings_registered: metrics.details.warnings.length,
        week_start: weekStart,
        week_end: weekEnd,
        headline_status: metrics.headline.overall_status
      });
      console.log(`\n[AI-CTO v0.2] Example notes JSONB payload: ${notesJsonExample}`);
    }

  } catch (e) {
    if (!isDryRun) {
      console.error("[AI-CTO v0.2] Rolling back transaction due to error.");
      await aictoClient.query('ROLLBACK');
    }
    console.error("[AI-CTO v0.2] Script Failed:", e);
    // Explicitly leaving out ai_cto.failures insertion due to lack of validated DDL columns.
  } finally {
    await odsClient.end();
    await aictoClient.end();
  }
}

main().catch(console.error);
