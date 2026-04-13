import { Router } from 'express';
import pool from '../db';
import { validate } from '../validate';

const router = Router();

const restaurantValidation = validate({
  name: { required: true, type: 'string', maxLength: 200 },
  type: { type: 'string', maxLength: 100 },
  address: { type: 'string', maxLength: 300 },
  city: { type: 'string', maxLength: 100 },
  state: { type: 'string', maxLength: 2 },
  zip: { type: 'string', maxLength: 10 },
  phone: { type: 'string', maxLength: 20 },
  health_dept_id: { type: 'string', maxLength: 50 },
  next_inspection_date: { type: 'date' },
});

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*,
        (SELECT i.score FROM inspections i
         WHERE i.restaurant_id = r.id AND i.status = 'Completed' AND i.score IS NOT NULL
         ORDER BY i.completed_date DESC LIMIT 1) AS latest_score,
        (SELECT i.completed_date FROM inspections i
         WHERE i.restaurant_id = r.id AND i.status = 'Completed' AND i.score IS NOT NULL
         ORDER BY i.completed_date DESC LIMIT 1) AS latest_inspection_date
      FROM restaurants r
      ORDER BY r.name
    `);
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

router.post('/', restaurantValidation, async (req, res) => {
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

router.patch('/:id', restaurantValidation, async (req, res) => {
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
