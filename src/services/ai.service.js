const { OpenRouter } = require("@openrouter/sdk");
const fs = require("fs");
const config = require("../config");

const openRouter = new OpenRouter({
  apiKey: config.openrouter.apiKey,
  defaultHeaders: {
    "HTTP-Referer": "https://voclio.app",
    "X-Title": "Voclio",
  },
});

class AIService {
  async transcribeAudio(audioFilePath, language = null) {
    try {
      // Read the audio file and convert to base64
      const audioBuffer = fs.readFileSync(audioFilePath);
      const base64Audio = audioBuffer.toString("base64");

      // Determine the audio format from file extension
      const ext = audioFilePath.split(".").pop().toLowerCase();
      const mimeTypes = {
        mp3: "audio/mpeg",
        mp4: "audio/mp4",
        m4a: "audio/mp4",
        wav: "audio/wav",
        ogg: "audio/ogg",
        webm: "audio/webm",
      };
      const mimeType = mimeTypes[ext] || "audio/mpeg";

      // Use GPT-4o audio preview for transcription
      const completion = await openRouter.chat.send({
        model: "openai/gpt-4o-audio-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transcribe the following audio${
                  language ? ` in ${language} language` : ""
                }. Provide only the transcribed text without any additional commentary.`,
              },
              {
                type: "input_audio",
                inputAudio: {
                  data: base64Audio,
                  format: ext === "mp3" ? "mp3" : "wav",
                },
              },
            ],
          },
        ],
        stream: false,
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw error;
    }
  }

  async summarizeText(text) {
    try {
      const completion = await openRouter.chat.send({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          {
            role: "user",
            content: `Please provide a concise summary of the following text:\n\n${text}`,
          },
        ],
        stream: false,
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Error summarizing text:", error);
      throw error;
    }
  }

  async extractTasks(text) {
    try {
      const completion = await openRouter.chat.send({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          {
            role: "user",
            content: `Extract actionable tasks from the following text. Return them as a JSON array of objects with fields: title, description, priority (low/medium/high). Only return the JSON array, no additional text.\n\nText:\n${text}`,
          },
        ],
        stream: false,
      });

      const responseText = completion.choices[0]?.message?.content || "[]";
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      console.error("Error extracting tasks:", error);
      throw error;
    }
  }

  async generateProductivitySuggestions(userData) {
    try {
      const completion = await openRouter.chat.send({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          {
            role: "user",
            content: `Based on the following user productivity data, provide 3-5 actionable suggestions to improve their productivity. Return as a JSON array of strings.\n\nData:\n${JSON.stringify(
              userData,
              null,
              2
            )}`,
          },
        ],
        stream: false,
      });

      const responseText = completion.choices[0]?.message?.content || "[]";
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      console.error("Error generating suggestions:", error);
      throw error;
    }
  }
}

module.exports = new AIService();
