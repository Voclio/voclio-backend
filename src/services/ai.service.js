import config from '../config/index.js';

class AIService {
  constructor() {
    this.openRouterKey = process.env.OPENROUTER_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.assemblyAIKey = process.env.ASSEMBLYAI_API_KEY;
    this.provider = this.openRouterKey ? 'openrouter' : 'gemini';
  }

  /**
   * Summarize text using AI
   */
  async summarizeText(text) {
    try {
      if (this.provider === 'openrouter') {
        return await this.summarizeWithOpenRouter(text);
      } else {
        return await this.summarizeWithGemini(text);
      }
    } catch (error) {
      console.error('Error summarizing text:', error);
      throw error;
    }
  }

  /**
   * Extract tasks from text using AI
   */
  async extractTasks(text) {
    try {
      if (this.provider === 'openrouter') {
        return await this.extractTasksWithOpenRouter(text);
      } else {
        return await this.extractTasksWithGemini(text);
      }
    } catch (error) {
      console.error('Error extracting tasks:', error);
      throw error;
    }
  }

  /**
   * Extract tasks AND notes from text using AI (Smart extraction)
   */
  async extractTasksAndNotes(text) {
    try {
      if (this.provider === 'openrouter') {
        return await this.extractTasksAndNotesWithOpenRouter(text);
      } else {
        return await this.extractTasksAndNotesWithGemini(text);
      }
    } catch (error) {
      console.error('Error extracting tasks and notes:', error);
      throw error;
    }
  }

  /**
   * Generate productivity suggestions
   */
  async generateProductivitySuggestions(userData) {
    try {
      if (this.provider === 'openrouter') {
        return await this.generateSuggestionsWithOpenRouter(userData);
      } else {
        return await this.generateSuggestionsWithGemini(userData);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio to text using AssemblyAI
   */
  async transcribeAudio(audioFilePath, language = 'ar') {
    try {
      if (!this.assemblyAIKey) {
        throw new Error('AssemblyAI API key not configured');
      }
      
      return await this.transcribeWithAssemblyAI(audioFilePath, language);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  // ============= OpenRouter Methods =============

  async summarizeWithOpenRouter(text) {
    const prompt = `قم بتلخيص النص التالي بشكل موجز ومفيد باللغة العربية:

${text}

التلخيص:`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://voclio.app',
        'X-Title': 'Voclio'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  async extractTasksWithOpenRouter(text) {
    const currentDate = new Date().toISOString().split('T')[0];
    const prompt = `أنت مساعد ذكي لاستخراج المهام من النصوص العربية. التاريخ الحالي: ${currentDate}

استخرج جميع المهام القابلة للتنفيذ من النص التالي. أرجع النتيجة كـ JSON array فقط بدون أي نص إضافي.

كل مهمة يجب أن تحتوي على:
- title: عنوان المهمة (نص قصير وواضح)
- description: وصف المهمة (اختياري)
- priority: الأولوية (low, medium, high) - حدد حسب الكلمات مثل "مهم، ضروري، عاجل" = high
- due_date: تاريخ الاستحقاق بصيغة ISO (YYYY-MM-DD أو YYYY-MM-DDTHH:mm:ss) - استخرج من كلمات مثل:
  * "بكرة" أو "غداً" = اليوم التالي
  * "اليوم" = نفس اليوم
  * "بعد بكرة" = بعد يومين
  * "الأسبوع الجاي" = بعد 7 أيام
  * "الشهر الجاي" = بعد 30 يوم
  * أي تاريخ محدد مثل "يوم الأحد" أو "5 فبراير"
- subtasks: array من المهام الفرعية (كل subtask له title فقط)
  * استخرج أي قائمة أو خطوات فرعية مذكورة
  * مثلاً: "محتاج أشتري لبن وخبز وجبنة" = 3 subtasks

قواعد مهمة:
1. إذا ذكر اليوزر قائمة أشياء، اجعلها subtasks
2. إذا كانت المهمة فيها كلمات مثل "مهم، ضروري، لازم، عاجل" = priority: high
3. إذا لم يذكر تاريخ محدد، اترك due_date = null
4. كن ذكياً في فهم السياق العربي

النص:
${text}

JSON:`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://voclio.app',
        'X-Title': 'Voclio'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  }

  async extractTasksAndNotesWithOpenRouter(text) {
    const currentDate = new Date().toISOString().split('T')[0];
    const prompt = `أنت مساعد ذكي لتحليل النصوص العربية واستخراج المهام والملاحظات. التاريخ الحالي: ${currentDate}

حلل النص التالي واستخرج:
1. المهام القابلة للتنفيذ (tasks)
2. الملاحظات أو الأفكار (notes)

أرجع النتيجة كـ JSON object بهذا الشكل فقط:
{
  "tasks": [
    {
      "title": "عنوان المهمة",
      "description": "وصف",
      "priority": "high/medium/low",
      "due_date": "YYYY-MM-DD أو YYYY-MM-DDTHH:mm:ss أو null",
      "subtasks": [{"title": "مهمة فرعية"}]
    }
  ],
  "notes": [
    {
      "title": "عنوان الملاحظة",
      "content": "محتوى الملاحظة",
      "tags": ["tag1", "tag2"]
    }
  ]
}

قواعد استخراج التواريخ:
- "بكرة" أو "غداً" = اليوم التالي
- "اليوم" = نفس اليوم
- "بعد بكرة" = بعد يومين
- "الأسبوع الجاي" = +7 أيام
- "الشهر الجاي" = +30 يوم
- "يوم السبت" أو "يوم الأحد" = أقرب يوم من هذا النوع
- إذا ذكر ساعة مثل "الساعة 5" أضفها للتاريخ

قواعد استخراج المهام:
- إذا ذكر قائمة أشياء، اجعلها subtasks
- الكلمات "مهم، ضروري، لازم، عاجل" = priority: high
- الكلمات "ممكن، لو فاضي" = priority: low

قواعد استخراج الملاحظات:
- إذا قال "نوت" أو "ملاحظة" أو "فكرة" أو "محتاج أكتب"
- أي معلومات عامة مش مهام محددة
- استخرج tags مناسبة من السياق

النص:
${text}

JSON:`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://voclio.app',
        'X-Title': 'Voclio'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { tasks: [], notes: [] };
  }

  async generateSuggestionsWithOpenRouter(userData) {
    const prompt = `بناءً على بيانات الإنتاجية التالية، قدم 3-5 اقتراحات عملية لتحسين الإنتاجية. أرجع النتيجة كـ JSON array من strings فقط.

البيانات:
${JSON.stringify(userData, null, 2)}

الاقتراحات (JSON array):`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://voclio.app',
        'X-Title': 'Voclio'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  }

  async transcribeWithOpenRouter(audioBuffer, language = 'ar') {
    // Note: OpenRouter doesn't directly support audio transcription
    // You would need to use Whisper API or Google Cloud Speech-to-Text
    // This is a placeholder for future implementation
    throw new Error('Audio transcription via OpenRouter is not yet implemented. Please use AssemblyAI.');
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
          'authorization': this.assemblyAIKey,
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
          'authorization': this.assemblyAIKey,
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
              'authorization': this.assemblyAIKey
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
          return transcript.text;
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

  // ============= Gemini Methods (Fallback) =============

  async summarizeWithGemini(text) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Please provide a concise summary of the following text:\n\n${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async extractTasksWithGemini(text) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
    const genAI = new GoogleGenerativeAI(this.geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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

  async generateSuggestionsWithGemini(userData) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Based on the following user productivity data, provide 3-5 actionable suggestions to improve their productivity. Return as a JSON array of strings.\n\nData:\n${JSON.stringify(userData, null, 2)}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  }
}

export default new AIService();
