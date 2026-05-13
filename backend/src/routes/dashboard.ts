import { Router } from 'express';
import pool from '../db';

const router = Router();

router.get('/stats', async (_req, res) => {
  try {
    const restaurants = await pool.query('SELECT COUNT(*) as count FROM restaurants');
    const upcoming = await pool.query(
      `SELECT COUNT(*) as count FROM inspections WHERE status = 'Scheduled' AND scheduled_date >= CURRENT_DATE`
    );
    const openActions = await pool.query(
      `SELECT COUNT(*) as count FROM corrective_actions WHERE status = 'Open'`
    );
    const unreadAlerts = await pool.query(
      `SELECT COUNT(*) as count FROM alerts WHERE is_read = FALSE`
    );
    const avgScore = await pool.query(
      `SELECT ROUND(AVG(score)) as avg_score FROM inspections WHERE score IS NOT NULL`
    );
    const recentInspections = await pool.query(
      `SELECT i.*, r.name as restaurant_name
       FROM inspections i JOIN restaurants r ON i.restaurant_id = r.id
       WHERE i.status = 'Completed'
       ORDER BY i.completed_date DESC LIMIT 5`
    );
    const upcomingInspections = await pool.query(
      `SELECT i.*, r.name as restaurant_name
       FROM inspections i JOIN restaurants r ON i.restaurant_id = r.id
       WHERE i.status = 'Scheduled'
       ORDER BY i.scheduled_date ASC LIMIT 5`
    );

    res.json({
      total_restaurants: parseInt(restaurants.rows[0].count),
      upcoming_inspections: parseInt(upcoming.rows[0].count),
      open_corrective_actions: parseInt(openActions.rows[0].count),
      unread_alerts: parseInt(unreadAlerts.rows[0].count),
      average_score: parseInt(avgScore.rows[0].avg_score) || 0,
      recent_inspections: recentInspections.rows,
      upcoming_inspection_list: upcomingInspections.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Restaurants with the highest compliance risk right now. Ranks by open
// high-severity corrective actions first, then by the count of all open
// actions, tie-breaking on the most recent inspection score. This is what
// a portfolio operator wants on page load — "who do I call today?".
router.get('/high-risk-restaurants', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         r.id,
         r.name,
         r.type,
         r.city,
         r.state,
         COUNT(ca.id) FILTER (WHERE ca.status = 'Open' AND ca.severity IN ('Critical','High'))::int AS open_high_severity,
         COUNT(ca.id) FILTER (WHERE ca.status = 'Open')::int                                        AS open_total,
         (SELECT score
            FROM inspections
           WHERE restaurant_id = r.id
             AND status = 'Completed'
             AND score IS NOT NULL
           ORDER BY completed_date DESC
           LIMIT 1)                                                                                  AS latest_score
       FROM restaurants r
       LEFT JOIN inspections i        ON i.restaurant_id  = r.id
       LEFT JOIN corrective_actions ca ON ca.inspection_id = i.id
       GROUP BY r.id
       HAVING COUNT(ca.id) FILTER (WHERE ca.status = 'Open') > 0
       ORDER BY open_high_severity DESC, open_total DESC, latest_score ASC NULLS LAST
       LIMIT 5`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch high-risk restaurants' });
  }
});

router.get('/score-trend', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT TO_CHAR(date_trunc('month', completed_date), 'YYYY-MM') AS month,
              ROUND(AVG(score))::int AS avg_score,
              COUNT(*)::int AS inspection_count
       FROM inspections
       WHERE status = 'Completed' AND completed_date IS NOT NULL AND score IS NOT NULL
         AND completed_date >= (CURRENT_DATE - INTERVAL '6 months')
       GROUP BY 1
       ORDER BY 1 ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch score trend' });
  }
});

export default router;
