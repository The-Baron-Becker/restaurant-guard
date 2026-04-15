import { Router } from 'express';
import pool from '../db';

const router = Router();

// Supported time ranges. Values are Postgres interval strings. "all" skips
// the completed-date filter entirely so historical data is included.
const RANGE_INTERVALS: Record<string, string | null> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  all: null,
};

// Aggregated analytics endpoint. One round-trip so the Reports page doesn't
// fire five separate requests on load.
router.get('/summary', async (req, res) => {
  try {
    const rawRange = typeof req.query.range === 'string' ? req.query.range : '30d';
    const range = rawRange in RANGE_INTERVALS ? rawRange : '30d';
    const interval = RANGE_INTERVALS[range];

    // When a range is specified we narrow to inspections completed within that window.
    // Corrective-action severity + restaurant counts stay global — they reflect
    // current open workload which is not time-bounded.
    const dateClause = interval
      ? `AND completed_date >= (CURRENT_DATE - INTERVAL '${interval}')`
      : '';
    const dateClauseI = interval
      ? `AND i.completed_date >= (CURRENT_DATE - INTERVAL '${interval}')`
      : '';

    const [
      passRate,
      byType,
      severity,
      topRisk,
      inspectorStats,
      inspectionVolume,
    ] = await Promise.all([
      // Pass rate: inspections with score >= 80 out of all scored completed inspections
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE score >= 80)::int AS passed,
          COUNT(*) FILTER (WHERE score < 80)::int AS failed
        FROM inspections
        WHERE status = 'Completed' AND score IS NOT NULL
        ${dateClause}
      `),
      // Avg score by restaurant type
      pool.query(`
        SELECT r.type AS type,
               COUNT(i.id)::int AS inspection_count,
               ROUND(AVG(i.score))::int AS avg_score
        FROM restaurants r
        LEFT JOIN inspections i ON i.restaurant_id = r.id
          AND i.status = 'Completed' AND i.score IS NOT NULL
          ${dateClauseI}
        GROUP BY r.type
        ORDER BY avg_score DESC NULLS LAST
      `),
      // Corrective action severity breakdown (open only)
      pool.query(`
        SELECT severity, COUNT(*)::int AS count
        FROM corrective_actions
        WHERE status = 'Open'
        GROUP BY severity
        ORDER BY CASE severity
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Low' THEN 4
          ELSE 5 END
      `),
      // Top-risk restaurants: ranked by open critical/high CAs and latest score
      pool.query(`
        SELECT r.id, r.name, r.type, r.city, r.state,
          COUNT(ca.id) FILTER (WHERE ca.status = 'Open' AND ca.severity IN ('Critical','High'))::int AS open_high_severity,
          COUNT(ca.id) FILTER (WHERE ca.status = 'Open')::int AS open_total,
          (SELECT i.score FROM inspections i
           WHERE i.restaurant_id = r.id AND i.status = 'Completed' AND i.score IS NOT NULL
           ORDER BY i.completed_date DESC LIMIT 1) AS latest_score
        FROM restaurants r
        LEFT JOIN corrective_actions ca ON ca.restaurant_id = r.id
        GROUP BY r.id
        HAVING COUNT(ca.id) FILTER (WHERE ca.status = 'Open') > 0
            OR (SELECT i.score FROM inspections i
                WHERE i.restaurant_id = r.id AND i.status = 'Completed' AND i.score IS NOT NULL
                ORDER BY i.completed_date DESC LIMIT 1) < 85
        ORDER BY open_high_severity DESC, open_total DESC, latest_score ASC NULLS FIRST
        LIMIT 10
      `),
      // Inspector performance
      pool.query(`
        SELECT COALESCE(inspector_name, 'Unassigned') AS inspector,
               COUNT(*)::int AS inspection_count,
               ROUND(AVG(score))::int AS avg_score
        FROM inspections
        WHERE status = 'Completed' AND score IS NOT NULL
        ${dateClause}
        GROUP BY COALESCE(inspector_name, 'Unassigned')
        ORDER BY inspection_count DESC
        LIMIT 10
      `),
      // Monthly inspection volume (6 months)
      pool.query(`
        SELECT TO_CHAR(date_trunc('month', completed_date), 'YYYY-MM') AS month,
               COUNT(*)::int AS completed,
               COUNT(*) FILTER (WHERE score >= 80)::int AS passed
        FROM inspections
        WHERE status = 'Completed' AND completed_date IS NOT NULL
          AND completed_date >= (CURRENT_DATE - INTERVAL '6 months')
        GROUP BY 1
        ORDER BY 1 ASC
      `),
    ]);

    const passRow = passRate.rows[0] || { total: 0, passed: 0, failed: 0 };
    const passRatePct = passRow.total > 0
      ? Math.round((passRow.passed / passRow.total) * 100)
      : 0;

    res.json({
      range,
      pass_rate: {
        total: passRow.total,
        passed: passRow.passed,
        failed: passRow.failed,
        pct: passRatePct,
      },
      score_by_type: byType.rows,
      severity_breakdown: severity.rows,
      top_risk_restaurants: topRisk.rows,
      inspector_performance: inspectorStats.rows,
      monthly_volume: inspectionVolume.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reports summary' });
  }
});

export default router;
