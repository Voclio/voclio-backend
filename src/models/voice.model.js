const pool = require("../config/database");

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

  static async findById(recordingId, userId) {
    const result = await pool.query(
      "SELECT * FROM voice_recordings WHERE recording_id = $1 AND user_id = $2",
      [recordingId, userId]
    );
    return result.rows[0];
  }

  static async updateTranscription(recordingId, transcription) {
    const result = await pool.query(
      `UPDATE voice_recordings 
       SET transcription_text = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE recording_id = $2
       RETURNING *`,
      [transcription, recordingId]
    );
    return result.rows[0];
  }

  static async delete(recordingId, userId) {
    const result = await pool.query(
      "DELETE FROM voice_recordings WHERE recording_id = $1 AND user_id = $2 RETURNING *",
      [recordingId, userId]
    );
    return result.rows[0];
  }
}

module.exports = VoiceRecordingModel;
