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

router.patch('/:id', async (req, res) => {
  try {
    const { name, category, description, is_template, items } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (is_template !== undefined) {
      updates.push(`is_template = $${paramCount++}`);
      values.push(is_template);
    }

    if (updates.length > 0) {
      values.push(req.params.id);
      const result = await pool.query(
        `UPDATE checklists SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Checklist not found' });
      }

      if (items && Array.isArray(items)) {
        await pool.query('DELETE FROM checklist_items WHERE checklist_id = $1', [req.params.id]);
        for (let i = 0; i < items.length; i++) {
          await pool.query(
            `INSERT INTO checklist_items (checklist_id, description, category, is_critical, sort_order)
             VALUES ($1,$2,$3,$4,$5)`,
            [req.params.id, items[i].description, items[i].category || 'General', items[i].is_critical || false, i + 1]
          );
        }
      }

      const updated = await pool.query('SELECT * FROM checklists WHERE id = $1', [req.params.id]);
      res.json(updated.rows[0]);
    } else {
      res.status(400).json({ error: 'No fields to update' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update checklist' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM checklists WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete checklist' });
  }
});

export default router;
