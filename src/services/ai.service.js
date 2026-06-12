import logger from '../utils/logger.js';
import { ServiceUnavailableError } from '../utils/errors.js';
import { OpenRouterProvider } from './ai/openrouter.provider.js';
import { GeminiProvider } from './ai/gemini.provider.js';
import { AssemblyAIProvider } from './ai/assemblyai.provider.js';

class AIService {
  constructor() {
    this.openRouterKey = process.env.OPENROUTER_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.assemblyAIKey = process.env.ASSEMBLYAI_API_KEY;
    this.provider = this.openRouterKey ? 'openrouter' : this.geminiKey ? 'gemini' : 'assemblyai';

    this.openRouter = new OpenRouterProvider(this.openRouterKey);
    this.gemini = new GeminiProvider(this.geminiKey);
    this.assemblyAI = new AssemblyAIProvider(this.assemblyAIKey);
  }

  async summarizeText(text) {
    try {
      if (this.provider === 'openrouter') {
        return await this.openRouter.summarizeWithOpenRouter(text);
      }
      return await this.gemini.summarizeWithGemini(text);
    } catch (error) {
      logger.error('Error summarizing text', { error: error.message });
      throw error;
    }
  }

  async extractTasks(input) {
    try {
      const text = typeof input === 'string' ? input : input.transcription_text || input.text || '';

      if (this.provider === 'assemblyai') {
        return await this.assemblyAI.extractTasksWithAssemblyAI(input);
      }
      if (this.provider === 'openrouter') {
        return await this.openRouter.extractTasksWithOpenRouter(text);
      }
      return await this.gemini.extractTasksWithGemini(text);
    } catch (error) {
      logger.error('Error extracting tasks', { error: error.message });
      throw error;
    }
  }

  async extractTasksAndNotes(input) {
    try {
      const text = typeof input === 'string' ? input : input.transcription_text || input.text || '';

      if (this.provider === 'assemblyai') {
        return await this.assemblyAI.extractTasksAndNotesWithAssemblyAI(input);
      }
      if (this.provider === 'openrouter') {
        return await this.openRouter.extractTasksAndNotesWithOpenRouter(text);
      }
      return await this.gemini.extractTasksAndNotesWithGemini(text);
    } catch (error) {
      logger.error('Error extracting tasks and notes', { error: error.message });
      throw error;
    }
  }

  async generateProductivitySuggestions(userData, options = {}) {
    try {
      if (this.provider === 'openrouter') {
        return await this.openRouter.generateSuggestionsWithOpenRouter(userData, options);
      }
      return await this.gemini.generateSuggestionsWithGemini(userData, options);
    } catch (error) {
      logger.error('Error generating suggestions', { error: error.message });
      throw error;
    }
  }

  async transcribeAudio(audioFilePath, language = 'ar') {
    try {
      if (!this.assemblyAIKey) {
        throw new ServiceUnavailableError('AssemblyAI API key not configured');
      }
      return await this.assemblyAI.transcribeWithAssemblyAI(audioFilePath, language);
    } catch (error) {
      logger.error('Error transcribing audio', { error: error.message });
      throw error;
    }
  }
}

export default new AIService();
