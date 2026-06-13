import fs from 'fs';
import path from 'path';
import aiService from './ai.service.js';
import VoiceRecordingModel from '../models/voice.model.js';
import logger from '../utils/logger.js';
import { shouldLocalizeToEnglish } from '../utils/voiceTranscriptLanguage.js';

export function normalizeTranscriptionText(transResult) {
  if (typeof transResult === 'string') {
    return transResult;
  }
  if (transResult && typeof transResult.text === 'string') {
    return transResult.text;
  }
  return '';
}

export function getDetectedLanguage(transResult) {
  if (transResult && typeof transResult === 'object') {
    return transResult.detectedLanguage || transResult.language_code || null;
  }
  return null;
}

/**
 * Transcribe audio and optionally rewrite Arabic/Egyptian speech as natural English.
 */
export async function transcribeAudioBuffer({
  recordingId,
  userId,
  language = 'auto',
  outputLanguage = 'en',
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

    logger.info(
      `[Sync transcription] Starting for recording ${recordingId} (speech=${language}, output=${outputLanguage})`
    );
    const transResult = await aiService.transcribeAudio(tempFilePath, language);
    const detectedLanguage = getDetectedLanguage(transResult);
    let transcriptionText = normalizeTranscriptionText(transResult);

    if (
      shouldLocalizeToEnglish(transcriptionText, outputLanguage, detectedLanguage)
    ) {
      logger.info(`[Sync transcription] Localizing transcript to English for ${recordingId}`);
      transcriptionText = await aiService.localizeVoiceTranscript(transcriptionText, {
        detectedLanguage
      });
    }

    await VoiceRecordingModel.updateTranscription(recordingId, transcriptionText);

    return {
      transcription: transcriptionText,
      transcriptId: transResult?.id ?? null,
      detectedLanguage
    };
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}
