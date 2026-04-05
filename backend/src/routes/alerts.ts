import { Router } from 'express';
import pool from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { restaurant_id, unread_only } = req.query;
    let query = `SELECT a.*, r.name as restaurant_name
                 FROM alerts a
                 JOIN restaurants r ON a.restaurant_id = r.id`;
    const conditions: string[] = [];
    const params: any[] = [];
    if (restaurant_id) { conditions.push(`a.restaurant_id = $${params.length + 1}`); params.push(restaurant_id); }
    if (unread_only === 'true') { conditions.push('a.is_read = FALSE'); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY a.due_date ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.patch('/read-all', async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    let query = 'UPDATE alerts SET is_read = TRUE WHERE is_read = FALSE';
    const params: any[] = [];
    if (restaurant_id) {
      query += ` AND restaurant_id = $1`;
      params.push(restaurant_id);
    }
    query += ' RETURNING id';
    const result = await pool.query(query, params);
    res.json({ updated: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all alerts read' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE alerts SET is_read = TRUE WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

export default router;
