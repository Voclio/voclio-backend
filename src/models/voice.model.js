import { VoiceRecording } from './orm/index.js';

class VoiceRecordingModel {
  static async create(userId, recordingData) {
    const recording = await VoiceRecording.create({
      user_id: userId,
      ...recordingData
    });
    return recording.toJSON();
  }

  static async findAll(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const recordings = await VoiceRecording.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    return recordings.map(rec => rec.toJSON());
  }

  static async findById(recordingId, userId) {
    const recording = await VoiceRecording.findOne({
      where: { recording_id: recordingId, user_id: userId }
    });
    return recording ? recording.toJSON() : null;
  }

  static async updateTranscription(recordingId, transcription) {
    const recording = await VoiceRecording.findByPk(recordingId);
    if (!recording) return null;
    
    await recording.update({
      transcription_text: transcription,
      status: 'transcribed'
    });
    return recording.toJSON();
  }

  static async delete(recordingId, userId) {
    const recording = await VoiceRecording.findOne({
      where: { recording_id: recordingId, user_id: userId }
    });
    
    if (!recording) return null;
    
    const recordingData = recording.toJSON();
    await recording.destroy();
    return recordingData;
  }
}

export default VoiceRecordingModel;
