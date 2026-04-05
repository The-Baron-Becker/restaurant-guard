import { Router } from 'express';
import pool from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { restaurant_id, status } = req.query;
    let query = `SELECT i.*, r.name as restaurant_name
                 FROM inspections i
                 JOIN restaurants r ON i.restaurant_id = r.id`;
    const conditions: string[] = [];
    const params: any[] = [];
    if (restaurant_id) { conditions.push(`i.restaurant_id = $${params.length + 1}`); params.push(restaurant_id); }
    if (status) { conditions.push(`i.status = $${params.length + 1}`); params.push(status); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY i.scheduled_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inspections' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const inspection = await pool.query(
      `SELECT i.*, r.name as restaurant_name
       FROM inspections i JOIN restaurants r ON i.restaurant_id = r.id
       WHERE i.id = $1`, [req.params.id]
    );
    if (inspection.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const responses = await pool.query(
      `SELECT ir.*, ci.description as item_description, ci.is_critical, ci.category
       FROM inspection_responses ir
       JOIN checklist_items ci ON ir.checklist_item_id = ci.id
       WHERE ir.inspection_id = $1
       ORDER BY ci.sort_order`, [req.params.id]
    );
    res.json({ ...inspection.rows[0], responses: responses.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inspection' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { restaurant_id, checklist_id, inspector_name, inspection_type, scheduled_date } = req.body;
    const result = await pool.query(
      `INSERT INTO inspections (restaurant_id, checklist_id, inspector_name, inspection_type, scheduled_date, status)
       VALUES ($1,$2,$3,$4,$5,'Scheduled') RETURNING *`,
      [restaurant_id, checklist_id, inspector_name, inspection_type || 'Routine', scheduled_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create inspection' });
  }
});

// Complete or update an inspection (mark as Completed with score + notes)
router.patch('/:id', async (req, res) => {
  try {
    const { status, score, notes } = req.body;
    const fields: string[] = [];
    const params: any[] = [];

    if (status !== undefined) { fields.push(`status = $${params.length + 1}`); params.push(status); }
    if (score !== undefined)  { fields.push(`score = $${params.length + 1}`); params.push(score); }
    if (notes !== undefined)  { fields.push(`notes = $${params.length + 1}`); params.push(notes); }

    if (status === 'Completed') {
      fields.push(`completed_date = NOW()`);
    }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE inspections SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    // Fetch with restaurant name
    const full = await pool.query(
      `SELECT i.*, r.name as restaurant_name FROM inspections i
       JOIN restaurants r ON i.restaurant_id = r.id WHERE i.id = $1`,
      [req.params.id]
    );
    res.json(full.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update inspection' });
  }
});

router.post('/:id/responses', async (req, res) => {
  try {
    const { responses } = req.body;
    const inserted = [];
    for (const r of responses) {
      const result = await pool.query(
        `INSERT INTO inspection_responses (inspection_id, checklist_item_id, status, notes)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [req.params.id, r.checklist_item_id, r.status, r.notes || null]
      );
      inserted.push(result.rows[0]);
    }
    res.status(201).json(inserted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save responses' });
  }
});

export default router;
