import aiService from '../services/ai.service.js';
import {
  normalizeTranscriptionText,
  getDetectedLanguage
} from '../services/voiceProcessing.service.js';
import { shouldLocalizeToEnglish } from '../utils/voiceTranscriptLanguage.js';
import VoiceRecordingModel from '../models/voice.model.js';
import storageService from '../services/storage.service.js';
import queueManager, { QUEUE_NAMES, JOB_PRIORITY } from '../config/queue.js';
import logger from '../utils/logger.js';

/**
 * Transcription Job Processor
 * Handles audio transcription using AssemblyAI
 */
export async function processTranscription(job) {
  const { recordingId, userId, language = 'auto', outputLanguage = 'en', storageKey, extractionOptions } =
    job.data;

  try {
    logger.info(`[Transcription Job ${job.id}] Starting for recording ${recordingId}`);

    // Update progress
    await job.updateProgress(10);

    // Get recording from database
    const recording = await VoiceRecordingModel.findById(recordingId, userId);
    if (!recording) {
      throw new Error('Recording not found');
    }

    await job.updateProgress(20);

    // Download file from cloud storage
    logger.info(`[Transcription Job ${job.id}] Downloading file from storage`);
    const audioBuffer = await storageService.downloadFile(storageKey);

    await job.updateProgress(30);

    // Save temporarily for AssemblyAI (it needs file path)
    const fs = await import('fs');
    const path = await import('path');
    const tempDir = path.join(process.cwd(), 'temp');

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `${recordingId}-${Date.now()}.audio`);
    fs.writeFileSync(tempFilePath, audioBuffer);

    await job.updateProgress(40);

    // Transcribe using AI service
    logger.info(`[Transcription Job ${job.id}] Transcribing audio`);
    const transResult = await aiService.transcribeAudio(tempFilePath, language);
    const detectedLanguage = getDetectedLanguage(transResult);
    let transcriptionText = normalizeTranscriptionText(transResult);
    const transcriptId = transResult?.id ?? null;

    if (shouldLocalizeToEnglish(transcriptionText, outputLanguage, detectedLanguage)) {
      transcriptionText = await aiService.localizeVoiceTranscript(transcriptionText, {
        detectedLanguage
      });
    }

    await job.updateProgress(80);

    // Update recording with transcription
    await VoiceRecordingModel.updateTranscription(recordingId, transcriptionText);

    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    await job.updateProgress(100);

    logger.info(`[Transcription Job ${job.id}] Completed successfully`);

    let extractionJobId = null;

    if (extractionOptions) {
      const extractionJob = await queueManager.addJob(
        QUEUE_NAMES.EXTRACTION,
        'extract-tasks-notes',
        {
          recordingId,
          userId,
          transcriptId,
          autoCreateTasks: extractionOptions.autoCreateTasks ?? true,
          autoCreateNotes: extractionOptions.autoCreateNotes ?? true,
          categoryId: extractionOptions.categoryId ?? null
        },
        { priority: JOB_PRIORITY.MEDIUM }
      );

      extractionJobId = extractionJob?.id ?? null;
      logger.info(`[Transcription Job ${job.id}] Chained extraction job: ${extractionJobId}`);
    }

    return {
      recordingId,
      transcription: transcriptionText,
      transcriptId,
      language,
      extractionJobId,
      success: true
    };
  } catch (error) {
    logger.error(`[Transcription Job ${job.id}] Failed:`, error);
    throw error;
  }
}

export const transcriptionJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000
  },
  timeout: 300000 // 5 minutes
};
