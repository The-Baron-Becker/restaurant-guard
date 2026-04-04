import { Router } from 'express';
import pool from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { restaurant_id, status } = req.query;
    let query = `SELECT ca.*, r.name as restaurant_name
                 FROM corrective_actions ca
                 JOIN restaurants r ON ca.restaurant_id = r.id`;
    const conditions: string[] = [];
    const params: any[] = [];
    if (restaurant_id) { conditions.push(`ca.restaurant_id = $${params.length + 1}`); params.push(restaurant_id); }
    if (status) { conditions.push(`ca.status = $${params.length + 1}`); params.push(status); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY ca.due_date ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch corrective actions' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { status, completed_at } = req.body;
    const result = await pool.query(
      `UPDATE corrective_actions SET status = $1, completed_at = $2 WHERE id = $3 RETURNING *`,
      [status, status === 'Resolved' ? (completed_at || new Date().toISOString()) : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update corrective action' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { inspection_id, restaurant_id, description, severity, assigned_to, due_date } = req.body;
    const result = await pool.query(
      `INSERT INTO corrective_actions (inspection_id, restaurant_id, description, severity, assigned_to, due_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [inspection_id, restaurant_id, description, severity || 'Medium', assigned_to, due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create corrective action' });
  }
});

export default router;
