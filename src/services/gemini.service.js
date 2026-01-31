import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async transcribeAudio(audioBuffer) {
    try {
      // Note: Gemini Pro doesn't directly support audio transcription
      // You would need to use Google Cloud Speech-to-Text API or Whisper API
      throw new Error('Audio transcription requires Google Cloud Speech-to-Text API integration');
    } catch (error) {
      throw error;
    }
  }

  async summarizeText(text) {
    try {
      const prompt = `Please provide a concise summary of the following text:\n\n${text}`;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error summarizing text:', error);
      throw error;
    }
  }

  async extractTasks(text) {
    try {
      const prompt = `Extract actionable tasks from the following text. Return them as a JSON array of objects with fields: title, description, priority (low/medium/high). Only return the JSON array, no additional text.\n\nText:\n${text}`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting tasks:', error);
      throw error;
    }
  }

  async generateProductivitySuggestions(userData) {
    try {
      const prompt = `Based on the following user productivity data, provide 3-5 actionable suggestions to improve their productivity. Return as a JSON array of strings.\n\nData:\n${JSON.stringify(userData, null, 2)}`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return [];
    } catch (error) {
      console.error('Error generating suggestions:', error);
      throw error;
    }
  }
}

export default new GeminiService();
