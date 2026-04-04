import { Router } from 'express';
import pool from '../db';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM restaurants ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM restaurants WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, address, city, state, zip, phone, health_dept_id, next_inspection_date } = req.body;
    const result = await pool.query(
      `INSERT INTO restaurants (name, type, address, city, state, zip, phone, health_dept_id, next_inspection_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, type, address, city, state, zip, phone, health_dept_id, next_inspection_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
});

export default router;
