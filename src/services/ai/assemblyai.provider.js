export class AssemblyAIProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  // ============= AssemblyAI Methods =============

  async transcribeWithAssemblyAI(audioFilePath, language = 'ar') {
    try {
      const fs = await import('fs');
      const path = await import('path');

      console.log('🎤 Starting audio transcription with AssemblyAI...');

      // Step 1: Upload audio file to AssemblyAI
      console.log('📤 Uploading audio file...');
      const audioData = fs.readFileSync(audioFilePath);

      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          authorization: this.apiKey,
          'Content-Type': 'application/octet-stream'
        },
        body: audioData
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        throw new Error(`AssemblyAI upload error: ${error}`);
      }

      const { upload_url } = await uploadResponse.json();
      console.log('✅ Audio file uploaded successfully');

      // Step 2: Request transcription
      console.log('🔄 Requesting transcription...');

      // Map language codes
      const languageCode = language === 'ar' ? 'ar' : 'en';

      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          authorization: this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: upload_url,
          language_code: languageCode,
          punctuate: true,
          format_text: true
        })
      });

      if (!transcriptResponse.ok) {
        const error = await transcriptResponse.text();
        throw new Error(`AssemblyAI transcription request error: ${error}`);
      }

      const { id: transcriptId } = await transcriptResponse.json();
      console.log(`📝 Transcription job created: ${transcriptId}`);

      // Step 3: Poll for completion
      console.log('⏳ Waiting for transcription to complete...');
      let transcript;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max (5 seconds * 60)

      while (attempts < maxAttempts) {
        const pollingResponse = await fetch(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          {
            headers: {
              authorization: this.apiKey
            }
          }
        );

        if (!pollingResponse.ok) {
          const error = await pollingResponse.text();
          throw new Error(`AssemblyAI polling error: ${error}`);
        }

        transcript = await pollingResponse.json();

        if (transcript.status === 'completed') {
          console.log('✅ Transcription completed successfully!');
          return { text: transcript.text, id: transcript.id };
        } else if (transcript.status === 'error') {
          throw new Error(`Transcription failed: ${transcript.error}`);
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;

        if (attempts % 6 === 0) {
          console.log(`⏳ Still processing... (${attempts * 5}s elapsed)`);
        }
      }

      throw new Error('Transcription timeout - took longer than 5 minutes');
    } catch (error) {
      console.error('❌ AssemblyAI transcription error:', error);
      throw error;
    }
  }
  // ============= AssemblyAI LeMUR Methods =============

  async extractTasksWithAssemblyAI(input) {
    try {
      const { id } = await this.ensureTranscript(input);

      const prompt = `Extract all actionable tasks from the text. Return as valid JSON array.
Each task should have:
- title: task title (short and clear)
- description: task description (optional)
- priority: priority (low, medium, high) - infer from context
- due_date: due date in ISO format (YYYY-MM-DD) or null if not mentioned
- subtasks: array of subtasks (objects with title property)

Text context provided by transcript.`;

      const response = await this.runLemurTask([id], prompt);

      try {
        // LeMUR returns text, we need to parse JSON
        // Sometimes it wraps in markdown code blocks
        let cleanJson = response
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        return JSON.parse(cleanJson);
      } catch (e) {
        console.error('Failed to parse LeMUR task response:', response);
        return [];
      }
    } catch (error) {
      console.error('AssemblyAI Task Extraction Error:', error);
      throw error;
    }
  }

  async extractTasksAndNotesWithAssemblyAI(input) {
    try {
      const { id } = await this.ensureTranscript(input);

      const prompt = `Analyze the text and extract:
1. Actionable tasks
2. Notes or ideas

Return as a valid JSON object ONLY:
{
  "tasks": [
    {
      "title": "task title",
      "description": "description",
      "priority": "high/medium/low",
      "due_date": "YYYY-MM-DD or null",
      "subtasks": [{"title": "subtask"}]
    }
  ],
  "notes": [
    {
      "title": "note title",
      "content": "note content",
      "tags": ["tag1", "tag2"]
    }
  ]
}`;

      const response = await this.runLemurTask([id], prompt);

      try {
        let cleanJson = response
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        const parsed = JSON.parse(cleanJson);
        return {
          tasks: parsed.tasks || [],
          notes: parsed.notes || []
        };
      } catch (e) {
        console.error('Failed to parse LeMUR tasks/notes response:', response);
        return { tasks: [], notes: [] };
      }
    } catch (error) {
      console.error('AssemblyAI Notes Extraction Error:', error);
      throw error;
    }
  }

  async ensureTranscript(input) {
    // If we already have a transcript ID, use it
    if (input.transcriptId) {
      console.log('Using existing transcript ID:', input.transcriptId);
      return { id: input.transcriptId };
    }

    // If we have a file path, we might need to re-transcribe to get an ID (since we don't store it yet)
    // NOTE: This incurs cost. Ideally we should store transcript_id in DB.
    if (input.file_path) {
      console.log('No transcript ID found, re-transcribing for LeMUR...');
      return await this.transcribeWithAssemblyAI(input.file_path);
    }

    throw new Error('AssemblyAI LeMUR requires a transcript ID or file path to process.');
  }

  async runLemurTask(transcriptIds, prompt) {
    try {
      const response = await fetch('https://api.assemblyai.com/lemur/v3/generate/task', {
        method: 'POST',
        headers: {
          authorization: this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcript_ids: transcriptIds,
          prompt: prompt,
          final_model: 'default'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LeMUR capabilities error: ${error}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('LeMUR Request Failed:', error);
      throw error;
    }
  }
}