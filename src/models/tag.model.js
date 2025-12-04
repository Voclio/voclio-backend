const pool = require('../config/database');

class TagModel {
  static async create(userId, tagData) {
    const { name, color, description } = tagData;
    const result = await pool.query(
      `INSERT INTO tags (user_id, name, color, description) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [userId, name, color || null, description || null]
    );
    return result.rows[0];
  }

  static async findAll(userId) {
    const result = await pool.query(
      'SELECT * FROM tags WHERE user_id = $1 ORDER BY name ASC',
      [userId]
    );
    return result.rows;
  }

  static async findById(tagId, userId) {
    const result = await pool.query(
      'SELECT * FROM tags WHERE tag_id = $1 AND user_id = $2',
      [tagId, userId]
    );
    return result.rows[0];
  }

  static async update(tagId, userId, updates) {
    const { name, color, description } = updates;
    const result = await pool.query(
      `UPDATE tags 
       SET name = COALESCE($1, name), 
           color = COALESCE($2, color),
           description = COALESCE($3, description)
       WHERE tag_id = $4 AND user_id = $5
       RETURNING *`,
      [name, color, description, tagId, userId]
    );
    return result.rows[0];
  }

  static async delete(tagId, userId) {
    const result = await pool.query(
      'DELETE FROM tags WHERE tag_id = $1 AND user_id = $2 RETURNING *',
      [tagId, userId]
    );
    return result.rows[0];
  }
}

module.exports = TagModel;
