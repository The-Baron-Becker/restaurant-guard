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

router.patch('/:id', async (req, res) => {
  try {
    const { name, type, address, city, state, zip, phone, health_dept_id, next_inspection_date } = req.body;
    const result = await pool.query(
      `UPDATE restaurants
       SET name=$1, type=$2, address=$3, city=$4, state=$5, zip=$6,
           phone=$7, health_dept_id=$8, next_inspection_date=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [name, type, address, city, state, zip, phone, health_dept_id,
       next_inspection_date || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM restaurants WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
});

export default router;
