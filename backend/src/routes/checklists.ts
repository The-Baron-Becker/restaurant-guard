import { Router } from 'express';
import pool from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    let query = 'SELECT * FROM checklists';
    const params: any[] = [];
    if (restaurant_id) {
      query += ' WHERE restaurant_id = $1 OR is_template = TRUE';
      params.push(restaurant_id);
    }
    query += ' ORDER BY is_template DESC, name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch checklists' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const checklist = await pool.query('SELECT * FROM checklists WHERE id = $1', [req.params.id]);
    if (checklist.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const items = await pool.query(
      'SELECT * FROM checklist_items WHERE checklist_id = $1 ORDER BY sort_order',
      [req.params.id]
    );
    res.json({ ...checklist.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { restaurant_id, name, category, description, is_template, items } = req.body;
    const result = await pool.query(
      `INSERT INTO checklists (restaurant_id, name, category, description, is_template)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [restaurant_id, name, category || 'General', description, is_template || false]
    );
    const checklist = result.rows[0];
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        await pool.query(
          `INSERT INTO checklist_items (checklist_id, description, category, is_critical, sort_order)
           VALUES ($1,$2,$3,$4,$5)`,
          [checklist.id, items[i].description, items[i].category || 'General', items[i].is_critical || false, i + 1]
        );
      }
    }
    res.status(201).json(checklist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create checklist' });
  }
});

export default router;
