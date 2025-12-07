const pool = require('../config/database');

class VoiceRecordingModel {
  static async create(userId, recordingData) {
    const { file_path, file_size, duration, format } = recordingData;
    const result = await pool.query(
      `INSERT INTO voice_recordings (user_id, file_path, file_size, duration, format) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, file_path, file_size, duration || null, format]
    );
    return result.rows[0];
  }

  static async findAll(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT * FROM voice_recordings 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async findById(recordingId, userId) {
    const result = await pool.query(
      'SELECT * FROM voice_recordings WHERE recording_id = $1 AND user_id = $2',
      [recordingId, userId]
    );
    return result.rows[0];
  }

  static async updateTranscription(recordingId, transcription) {
    const result = await pool.query(
      `UPDATE voice_recordings 
       SET transcription = $1, transcribed_at = CURRENT_TIMESTAMP 
       WHERE recording_id = $2
       RETURNING *`,
      [transcription, recordingId]
    );
    return result.rows[0];
  }

  static async delete(recordingId, userId) {
    const result = await pool.query(
      'DELETE FROM voice_recordings WHERE recording_id = $1 AND user_id = $2 RETURNING *',
      [recordingId, userId]
    );
    return result.rows[0];
  }
}

module.exports = VoiceRecordingModel;
