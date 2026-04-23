import { processTranscription, transcriptionJobOptions } from './transcription.job.js';
import { processExtraction, extractionJobOptions } from './extraction.job.js';

export const jobProcessors = {
  transcription: {
    processor: processTranscription,
    options: transcriptionJobOptions
  },
  extraction: {
    processor: processExtraction,
    options: extractionJobOptions
  }
};

export { processTranscription, processExtraction };
