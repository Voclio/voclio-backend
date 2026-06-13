export class GeminiProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  // ============= Gemini Methods (Fallback) =============

  async summarizeWithGemini(text) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Please provide a concise summary of the following text:\n\n${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async extractTasksWithGemini(text) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const currentDate = new Date().toISOString().split('T')[0];
    const prompt = `You are a smart assistant for extracting tasks from Arabic text. Current date: ${currentDate}

Extract all actionable tasks from the following text. Return as JSON array only.

Each task should have:
- title: task title (short and clear)
- description: task description (optional)
- priority: priority (low, medium, high) - determine from words like "important, urgent, must" = high
- due_date: due date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss) - extract from words like:
  * "بكرة" or "tomorrow" = next day
  * "اليوم" or "today" = same day
  * "بعد بكرة" = in 2 days
  * "الأسبوع الجاي" or "next week" = +7 days
  * Any specific date mentioned
- subtasks: array of subtasks (each has title only)
  * Extract any list or sub-steps mentioned
  * Example: "need to buy milk, bread, cheese" = 3 subtasks

Text:
${text}

JSON:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  }

  async extractTasksAndNotesWithGemini(text) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const currentDate = new Date().toISOString().split('T')[0];
    const prompt = `You are a smart assistant for analyzing Arabic text and extracting tasks and notes. Current date: ${currentDate}

Analyze the following text and extract:
1. Actionable tasks
2. Notes or ideas

Return as JSON object:
{
  "tasks": [
    {
      "title": "task title",
      "description": "description",
      "priority": "high/medium/low",
      "due_date": "YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss or null",
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
}

Date extraction rules:
- "بكرة" or "tomorrow" = next day
- "اليوم" or "today" = same day
- "بعد بكرة" = +2 days
- "الأسبوع الجاي" or "next week" = +7 days
- If time mentioned like "5 PM", add it to date

Task extraction rules:
- If list mentioned, make them subtasks
- Words "مهم، ضروري، لازم، عاجل" = priority: high

Note extraction rules:
- If says "نوت" or "note" or "idea" or "فكرة"
- Any general information not specific tasks
- Extract appropriate tags from context

Text:
${text}

JSON:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { tasks: [], notes: [] };
  }

  async generateSuggestionsWithGemini(userData, options = {}) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const { focus_area = 'general', tone = 'professional', count = 5, language = 'ar' } = options;

    const prompt = `You are an expert productivity consultant. Analyze the following user data and provide ${count} personalized productivity suggestions.

User Data:
${JSON.stringify(userData, null, 2)}

Requirements:
- Focus area: ${focus_area}
- Tone: ${tone}
- Language: ${language === 'ar' ? 'Arabic' : 'English'}
- Return as JSON array only

Each suggestion should have:
- suggestion: detailed suggestion text
- category: ${focus_area}
- priority: high/medium/low
- estimated_impact: high/medium/low
- implementation_time: immediate/daily/weekly/monthly
- steps: array of actionable steps

Base suggestions on actual user data patterns. Return JSON only:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Gemini JSON parse error:', e);
      }
    }

    // Fallback to simple format
    const lines = responseText.split('\n').filter(line => line.trim());
    return lines.slice(0, count).map((line, index) => ({
      suggestion: line.replace(/^\d+\.?\s*/, '').trim(),
      category: focus_area,
      priority: 'medium',
      estimated_impact: 'medium',
      implementation_time: 'daily',
      steps: []
    }));
  }

  async localizeVoiceTranscriptToEnglish(text, detectedLanguage) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Rewrite this voice transcript as natural English (native speaker style).
The speaker may have used Arabic or Egyptian dialect. Detected language: ${detectedLanguage || 'unknown'}.
Return ONLY the English text.

Transcript:
${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  }
}