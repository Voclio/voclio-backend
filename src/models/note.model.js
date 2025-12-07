const pool = require('../config/database');

class NoteModel {
  static async create(userId, noteData) {
    const { title, content, voice_recording_id } = noteData;
    const result = await pool.query(
      `INSERT INTO notes (user_id, title, content, voice_recording_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING note_id, user_id, title, content, voice_recording_id, created_at, updated_at`,
      [userId, title, content, voice_recording_id || null]
    );
    return result.rows[0];
  }

  static async findAll(userId, options = {}) {
    const { page = 1, limit = 20, search } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT n.*, 
             COALESCE(json_agg(
               json_build_object('tag_id', t.tag_id, 'name', t.name, 'color', t.color)
             ) FILTER (WHERE t.tag_id IS NOT NULL), '[]') as tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.note_id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.tag_id
      WHERE n.user_id = $1
    `;

    const params = [userId];

    if (search) {
      query += ` AND (n.title ILIKE $${params.length + 1} OR n.content ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += `
      GROUP BY n.note_id
      ORDER BY n.updated_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(noteId, userId) {
    const result = await pool.query(
      `SELECT n.*, 
              COALESCE(json_agg(
                json_build_object('tag_id', t.tag_id, 'name', t.name, 'color', t.color)
              ) FILTER (WHERE t.tag_id IS NOT NULL), '[]') as tags
       FROM notes n
       LEFT JOIN note_tags nt ON n.note_id = nt.note_id
       LEFT JOIN tags t ON nt.tag_id = t.tag_id
       WHERE n.note_id = $1 AND n.user_id = $2
       GROUP BY n.note_id`,
      [noteId, userId]
    );
    return result.rows[0];
  }

  static async update(noteId, userId, updates) {
    const { title, content } = updates;
    const result = await pool.query(
      `UPDATE notes 
       SET title = COALESCE($1, title), 
           content = COALESCE($2, content),
           updated_at = CURRENT_TIMESTAMP
       WHERE note_id = $3 AND user_id = $4
       RETURNING *`,
      [title, content, noteId, userId]
    );
    return result.rows[0];
  }

  static async delete(noteId, userId) {
    const result = await pool.query(
      'DELETE FROM notes WHERE note_id = $1 AND user_id = $2 RETURNING *',
      [noteId, userId]
    );
    return result.rows[0];
  }

  static async addTags(noteId, tagIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Remove existing tags
      await client.query('DELETE FROM note_tags WHERE note_id = $1', [noteId]);
      
      // Add new tags
      if (tagIds && tagIds.length > 0) {
        const values = tagIds.map((tagId, index) => 
          `($1, $${index + 2})`
        ).join(', ');
        
        await client.query(
          `INSERT INTO note_tags (note_id, tag_id) VALUES ${values}`,
          [noteId, ...tagIds]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async removeTag(noteId, tagId) {
    const result = await pool.query(
      'DELETE FROM note_tags WHERE note_id = $1 AND tag_id = $2 RETURNING *',
      [noteId, tagId]
    );
    return result.rows[0];
  }

  static async count(userId, search) {
    let query = 'SELECT COUNT(*) FROM notes WHERE user_id = $1';
    const params = [userId];

    if (search) {
      query += ` AND (title ILIKE $2 OR content ILIKE $2)`;
      params.push(`%${search}%`);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }
}

module.exports = NoteModel;
