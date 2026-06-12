import fs from 'fs';
import path from 'path';
import aiService from './ai.service.js';
import VoiceRecordingModel from '../models/voice.model.js';
import logger from '../utils/logger.js';

export function normalizeTranscriptionText(transResult) {
  if (typeof transResult === 'string') {
    return transResult;
  }
  if (transResult && typeof transResult.text === 'string') {
    return transResult.text;
  }
  return '';
}

/**
 * Transcribe audio synchronously when the job queue is unavailable.
 */
export async function transcribeAudioBuffer({
  recordingId,
  userId,
  language = 'ar',
  audioBuffer,
  originalName = 'recording.m4a'
}) {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const ext = path.extname(originalName) || '.m4a';
  const tempFilePath = path.join(tempDir, `${recordingId}-${Date.now()}${ext}`);

  try {
    fs.writeFileSync(tempFilePath, audioBuffer);

    logger.info(`[Sync transcription] Starting for recording ${recordingId}`);
    const transResult = await aiService.transcribeAudio(tempFilePath, language);
    const transcriptionText = normalizeTranscriptionText(transResult);

    await VoiceRecordingModel.updateTranscription(recordingId, transcriptionText);

    return {
      transcription: transcriptionText,
      transcriptId: transResult.id ?? null
    };
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}
