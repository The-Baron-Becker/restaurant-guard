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

export default router;
