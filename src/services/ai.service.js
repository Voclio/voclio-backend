import config from "../config/index.js";

class AIService {
  constructor() {
    this.openRouterKey = process.env.OPENROUTER_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.assemblyAIKey = process.env.ASSEMBLYAI_API_KEY;
    // Prefer OpenRouter (User requested)
    this.provider = this.openRouterKey
      ? "openrouter"
      : this.geminiKey
        ? "gemini"
        : "assemblyai";
  }

  /**
   * Summarize text using AI
   */
  async summarizeText(text) {
    try {
      if (this.provider === "openrouter") {
        return await this.summarizeWithOpenRouter(text);
      } else {
        return await this.summarizeWithGemini(text);
      }
    } catch (error) {
      console.error("Error summarizing text:", error);
      throw error;
    }
  }

  /**
   * Extract tasks from text using AI
   */
  async extractTasks(input) {
    try {
      // Handle both text string and object input
      const text =
        typeof input === "string"
          ? input
          : input.transcription_text || input.text || "";

      if (this.provider === "assemblyai") {
        return await this.extractTasksWithAssemblyAI(input);
      } else if (this.provider === "openrouter") {
        return await this.extractTasksWithOpenRouter(text);
      } else {
        return await this.extractTasksWithGemini(text);
      }
    } catch (error) {
      console.error("Error extracting tasks:", error);
      throw error;
    }
  }

  /**
   * Extract tasks AND notes from text using AI (Smart extraction)
   */
  async extractTasksAndNotes(input) {
    try {
      // Handle both text string and object input
      const text =
        typeof input === "string"
          ? input
          : input.transcription_text || input.text || "";

      if (this.provider === "assemblyai") {
        return await this.extractTasksAndNotesWithAssemblyAI(input);
      } else if (this.provider === "openrouter") {
        return await this.extractTasksAndNotesWithOpenRouter(text);
      } else {
        return await this.extractTasksAndNotesWithGemini(text);
      }
    } catch (error) {
      console.error("Error extracting tasks and notes:", error);
      throw error;
    }
  }

  /**
   * Generate productivity suggestions
   */
  async generateProductivitySuggestions(userData) {
    try {
      if (this.provider === "openrouter") {
        return await this.generateSuggestionsWithOpenRouter(userData);
      } else {
        return await this.generateSuggestionsWithGemini(userData);
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      throw error;
    }
  }

  /**
   * Transcribe audio to text using AssemblyAI
   */
  async transcribeAudio(audioFilePath, language = "ar") {
    try {
      if (!this.assemblyAIKey) {
        throw new Error("AssemblyAI API key not configured");
      }

      return await this.transcribeWithAssemblyAI(audioFilePath, language);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw error;
    }
  }

  // ============= OpenRouter Methods =============

  async summarizeWithOpenRouter(text) {
    const prompt = `قم بتلخيص النص التالي بشكل موجز ومفيد باللغة العربية:

${text}

التلخيص:`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://voclio.app",
          "X-Title": "Voclio",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  async extractTasksWithOpenRouter(text) {
    const currentDate = new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date().toLocaleDateString('ar-EG', { weekday: 'long' });
    
    const prompt = `أنت مساعد ذكي متخصص في استخراج المهام من النصوص العربية بجميع لهجاتها (مصرية، سعودية، خليجية، شامية، مغربية).

📅 **معلومات التاريخ الحالي:**
- التاريخ: ${currentDate}
- اليوم: ${dayOfWeek}

🎯 **مهمتك:**
استخرج جميع المهام القابلة للتنفيذ من النص التالي وأرجعها كـ JSON array فقط بدون أي نص إضافي.

📋 **هيكل كل مهمة:**
\`\`\`json
{
  "title": "عنوان المهمة (واضح ومختصر)",
  "description": "وصف تفصيلي (اختياري)",
  "priority": "low | medium | high",
  "due_date": "YYYY-MM-DD أو YYYY-MM-DDTHH:mm:ss أو null",
  "subtasks": [
    {"title": "مهمة فرعية 1"},
    {"title": "مهمة فرعية 2"}
  ]
}
\`\`\`

🔍 **قواعد استخراج المهام:**

1. **التعرف على المهام:**
   - أي جملة تبدأ بـ: "عايز، أريد، محتاج، ناوي، أبغى، لازم، مفروض، يجب، ضروري"
   - أي فعل أمر: "اشتري، اتصل، راجع، جهز، أرسل، احجز"
   - أي قائمة أشياء للقيام بها
   - أي موعد أو اجتماع مذكور

2. **تحديد الأولوية (Priority):**
   - **HIGH**: "مهم جداً، ضروري، عاجل، لازم اليوم، مستعجل، أولوية قصوى"
   - **MEDIUM**: "مهم، محتاج، لازم، يفضل"
   - **LOW**: "ممكن، لو فاضي، مش مستعجل، في وقت فراغ"

3. **استخراج التواريخ (Due Date):**
   - **اليوم**: نفس التاريخ الحالي
   - **بكرة/غداً**: ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
   - **بعد بكرة**: ${new Date(Date.now() + 172800000).toISOString().split('T')[0]}
   - **الأسبوع الجاي/القادم**: +7 أيام
   - **الشهر الجاي/القادم**: +30 يوم
   - **أيام الأسبوع**: احسب أقرب يوم (مثلاً "يوم السبت" = أقرب سبت قادم)
   - **تواريخ محددة**: "5 فبراير"، "15/2"، "2026-02-05"
   - **أوقات محددة**: "الساعة 3 العصر" = "15:00:00"، "الصبح" = "09:00:00"

4. **استخراج المهام الفرعية (Subtasks):**
   - أي قائمة مذكورة: "محتاج أشتري لبن وخبز وجبنة" = 3 subtasks
   - أي خطوات متسلسلة: "أولاً كذا، ثانياً كذا، ثالثاً كذا"
   - أي تفاصيل داخل المهمة الرئيسية

5. **فهم السياق العربي:**
   - **اللهجة المصرية**: "عايز، محتاج، لازم، بكرة، النهاردة"
   - **اللهجة السعودية**: "أبغى، ودي، باجر، اليوم"
   - **اللهجة الخليجية**: "أبي، أريد، باچر، اليوم"
   - **اللهجة الشامية**: "بدي، لازم، بكرا، اليوم"

📝 **أمثلة:**

**مثال 1:**
نص: "عايز أشتري لبن وخبز وجبنة بكرة الصبح، ومهم جداً أتصل بالدكتور الساعة 3 العصر"
\`\`\`json
[
  {
    "title": "شراء مستلزمات",
    "description": "شراء لبن وخبز وجبنة",
    "priority": "medium",
    "due_date": "${new Date(Date.now() + 86400000).toISOString().split('T')[0]}T09:00:00",
    "subtasks": [
      {"title": "شراء لبن"},
      {"title": "شراء خبز"},
      {"title": "شراء جبنة"}
    ]
  },
  {
    "title": "الاتصال بالدكتور",
    "description": "موعد مهم مع الدكتور",
    "priority": "high",
    "due_date": "${currentDate}T15:00:00",
    "subtasks": []
  }
]
\`\`\`

**مثال 2:**
نص: "ناوي أشتغل على المشروع الأسبوع الجاي، محتاج أجهز العرض التقديمي"
\`\`\`json
[
  {
    "title": "العمل على المشروع",
    "description": "البدء في العمل على المشروع",
    "priority": "medium",
    "due_date": "${new Date(Date.now() + 604800000).toISOString().split('T')[0]}",
    "subtasks": []
  },
  {
    "title": "تجهيز العرض التقديمي",
    "description": "إعداد وتجهيز العرض التقديمي",
    "priority": "medium",
    "due_date": null,
    "subtasks": []
  }
]
\`\`\`

⚠️ **ملاحظات مهمة:**
- إذا لم يُذكر تاريخ محدد، اجعل due_date = null
- إذا لم تكن هناك مهام فرعية، اجعل subtasks = []
- كن ذكياً في فهم السياق والنية من الكلام
- لا تستخرج معلومات عامة أو أفكار كمهام، فقط الأشياء القابلة للتنفيذ

📄 **النص المطلوب تحليله:**
${text}

🎯 **أرجع JSON array فقط:**`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://voclio.app",
          "X-Title": "Voclio",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o",
          messages: [
            {
              role: "system",
              content: "أنت مساعد ذكي متخصص في استخراج المهام من النصوص العربية. تفهم جميع اللهجات العربية وتستخرج المهام بدقة عالية. ترجع دائماً JSON صحيح بدون أي نص إضافي."
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 3000,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    console.log('🤖 AI Response for extractTasksWithOpenRouter:', content);

    // Try multiple JSON extraction patterns
    try {
      // Pattern 1: Direct JSON array
      if (content.startsWith('[')) {
        return JSON.parse(content);
      }

      // Pattern 2: JSON in code block
      const codeBlockMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (codeBlockMatch) {
        return JSON.parse(codeBlockMatch[1]);
      }

      // Pattern 3: JSON anywhere in text
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      console.warn('⚠️ No JSON array found in AI response');
      return [];
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error.message);
      console.error('Response content:', content);
      return [];
    }
  }

  async extractTasksAndNotesWithOpenRouter(text) {
    const currentDate = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().toLocaleDateString('ar-EG', { weekday: 'long' });
    
    const prompt = `أنت مساعد ذكي متخصص في تحليل النصوص العربية واستخراج المهام والملاحظات بدقة عالية.

📅 **معلومات التاريخ الحالي:**
- التاريخ: ${currentDate}
- اليوم: ${dayOfWeek}

🎯 **مهمتك:**
حلل النص التالي واستخرج:
1. **المهام (Tasks)**: أي شيء قابل للتنفيذ أو يحتاج إجراء
2. **الملاحظات (Notes)**: أفكار، معلومات، ملاحظات عامة

📋 **هيكل الإخراج المطلوب:**
\`\`\`json
{
  "tasks": [
    {
      "title": "عنوان المهمة",
      "description": "وصف تفصيلي",
      "priority": "low | medium | high",
      "due_date": "YYYY-MM-DD أو YYYY-MM-DDTHH:mm:ss أو null",
      "subtasks": [{"title": "مهمة فرعية"}]
    }
  ],
  "notes": [
    {
      "title": "عنوان الملاحظة",
      "content": "محتوى الملاحظة الكامل",
      "tags": ["تاج1", "تاج2", "تاج3"]
    }
  ]
}
\`\`\`

🔍 **قواعد استخراج المهام (Tasks):**

1. **التعرف على المهام:**
   - جمل تبدأ بـ: "عايز، أريد، محتاج، ناوي، أبغى، لازم، مفروض، يجب"
   - أفعال أمر: "اشتري، اتصل، راجع، جهز، أرسل، احجز، سجل"
   - قوائم أشياء للقيام بها
   - مواعيد واجتماعات
   - أي شيء يحتاج إجراء أو فعل

2. **تحديد الأولوية:**
   - **HIGH**: "مهم جداً، ضروري، عاجل، لازم اليوم، مستعجل، أولوية قصوى، حرج"
   - **MEDIUM**: "مهم، محتاج، لازم، يفضل، مطلوب"
   - **LOW**: "ممكن، لو فاضي، مش مستعجل، في وقت فراغ، لو تيسر"

3. **استخراج التواريخ:**
   - **اليوم/النهاردة**: ${currentDate}
   - **بكرة/غداً/باجر**: ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
   - **بعد بكرة**: ${new Date(Date.now() + 172800000).toISOString().split('T')[0]}
   - **الأسبوع الجاي**: +7 أيام
   - **الشهر الجاي**: +30 يوم
   - **أيام الأسبوع**: احسب أقرب يوم قادم
   - **أوقات**: "الصبح"=09:00، "الظهر"=12:00، "العصر"=15:00، "المغرب"=18:00، "الليل"=21:00

4. **المهام الفرعية (Subtasks):**
   - أي قائمة: "محتاج أشتري X و Y و Z" = 3 subtasks
   - خطوات متسلسلة: "أولاً... ثانياً... ثالثاً..."
   - تفاصيل داخل المهمة الرئيسية

📝 **قواعد استخراج الملاحظات (Notes):**

1. **التعرف على الملاحظات:**
   - جمل تبدأ بـ: "نوت، ملاحظة، فكرة، معلومة، تذكير، مهم أعرف"
   - معلومات عامة غير قابلة للتنفيذ مباشرة
   - أفكار ومقترحات
   - ملاحظات شخصية
   - معلومات للرجوع إليها لاحقاً

2. **استخراج العنوان:**
   - إذا ذُكر عنوان صريح، استخدمه
   - وإلا، استخرج عنوان مناسب من أول جملة
   - اجعله واضح ومختصر (3-7 كلمات)

3. **استخراج التاجات (Tags):**
   - استخرج من السياق: #مشروع، #فكرة، #مهم، #شخصي، #عمل
   - أضف تاجات ذكية حسب المحتوى
   - 2-5 تاجات لكل ملاحظة

🎨 **أمثلة توضيحية:**

**مثال 1: مهام فقط**
نص: "عايز أشتري لبن وخبز بكرة الصبح، ومهم جداً أتصل بالدكتور الساعة 3 العصر"
\`\`\`json
{
  "tasks": [
    {
      "title": "شراء مستلزمات",
      "description": "شراء لبن وخبز من السوبر ماركت",
      "priority": "medium",
      "due_date": "${new Date(Date.now() + 86400000).toISOString().split('T')[0]}T09:00:00",
      "subtasks": [
        {"title": "شراء لبن"},
        {"title": "شراء خبز"}
      ]
    },
    {
      "title": "الاتصال بالدكتور",
      "description": "موعد مهم مع الدكتور",
      "priority": "high",
      "due_date": "${currentDate}T15:00:00",
      "subtasks": []
    }
  ],
  "notes": []
}
\`\`\`

**مثال 2: ملاحظة فقط**
نص: "فكرة للمشروع الجديد: ممكن نعمل تطبيق يربط بين المطاعم والزبائن، الزبون يطلب أونلاين والمطعم يوصل، نسبة العمولة 15%"
\`\`\`json
{
  "tasks": [],
  "notes": [
    {
      "title": "فكرة مشروع - تطبيق توصيل طعام",
      "content": "فكرة للمشروع الجديد: ممكن نعمل تطبيق يربط بين المطاعم والزبائن، الزبون يطلب أونلاين والمطعم يوصل، نسبة العمولة 15%",
      "tags": ["مشروع", "فكرة", "تطبيق", "توصيل", "مطاعم"]
    }
  ]
}
\`\`\`

**مثال 3: مهام وملاحظات معاً**
نص: "محتاج أجهز العرض التقديمي للاجتماع يوم الأحد. نوت: لازم أركز على الأرقام والإحصائيات، المدير بيحب الأرقام"
\`\`\`json
{
  "tasks": [
    {
      "title": "تجهيز العرض التقديمي",
      "description": "إعداد العرض التقديمي لاجتماع يوم الأحد",
      "priority": "high",
      "due_date": "2026-02-02",
      "subtasks": []
    }
  ],
  "notes": [
    {
      "title": "ملاحظة عن العرض التقديمي",
      "content": "لازم أركز على الأرقام والإحصائيات، المدير بيحب الأرقام",
      "tags": ["عرض_تقديمي", "اجتماع", "ملاحظة", "مهم"]
    }
  ]
}
\`\`\`

⚠️ **ملاحظات مهمة:**
- إذا لم تكن هناك مهام، أرجع tasks = []
- إذا لم تكن هناك ملاحظات، أرجع notes = []
- كن ذكياً في التفريق بين المهام والملاحظات
- المهمة = شيء يحتاج فعل، الملاحظة = معلومة للحفظ
- استخدم السياق لفهم النية من الكلام

📄 **النص المطلوب تحليله:**
${text}

🎯 **أرجع JSON object فقط:**`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://voclio.app",
          "X-Title": "Voclio",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o",
          messages: [
            {
              role: "system",
              content: "أنت مساعد ذكي متخصص في تحليل النصوص العربية واستخراج المهام والملاحظات بدقة عالية. تفهم جميع اللهجات العربية وتميز بين المهام القابلة للتنفيذ والملاحظات العامة. ترجع دائماً JSON صحيح بدون أي نص إضافي."
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 3500,
        }),
      },
    );

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

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://voclio.app",
          "X-Title": "Voclio",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 800,
        }),
      },
    );

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

  async transcribeWithOpenRouter(audioBuffer, language = "ar") {
    // Note: OpenRouter doesn't directly support audio transcription
    // You would need to use Whisper API or Google Cloud Speech-to-Text
    // This is a placeholder for future implementation
    throw new Error(
      "Audio transcription via OpenRouter is not yet implemented. Please use AssemblyAI.",
    );
  }

  // ============= AssemblyAI Methods =============

  async transcribeWithAssemblyAI(audioFilePath, language = "ar") {
    try {
      const fs = await import("fs");
      const path = await import("path");

      console.log("🎤 Starting audio transcription with AssemblyAI...");

      // Step 1: Upload audio file to AssemblyAI
      console.log("📤 Uploading audio file...");
      const audioData = fs.readFileSync(audioFilePath);

      const uploadResponse = await fetch(
        "https://api.assemblyai.com/v2/upload",
        {
          method: "POST",
          headers: {
            authorization: this.assemblyAIKey,
            "Content-Type": "application/octet-stream",
          },
          body: audioData,
        },
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        throw new Error(`AssemblyAI upload error: ${error}`);
      }

      const { upload_url } = await uploadResponse.json();
      console.log("✅ Audio file uploaded successfully");

      // Step 2: Request transcription
      console.log("🔄 Requesting transcription...");

      // Map language codes
      const languageCode = language === "ar" ? "ar" : "en";

      const transcriptResponse = await fetch(
        "https://api.assemblyai.com/v2/transcript",
        {
          method: "POST",
          headers: {
            authorization: this.assemblyAIKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audio_url: upload_url,
            language_code: languageCode,
            punctuate: true,
            format_text: true,
          }),
        },
      );

      if (!transcriptResponse.ok) {
        const error = await transcriptResponse.text();
        throw new Error(`AssemblyAI transcription request error: ${error}`);
      }

      const { id: transcriptId } = await transcriptResponse.json();
      console.log(`📝 Transcription job created: ${transcriptId}`);

      // Step 3: Poll for completion
      console.log("⏳ Waiting for transcription to complete...");
      let transcript;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max (5 seconds * 60)

      while (attempts < maxAttempts) {
        const pollingResponse = await fetch(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          {
            headers: {
              authorization: this.assemblyAIKey,
            },
          },
        );

        if (!pollingResponse.ok) {
          const error = await pollingResponse.text();
          throw new Error(`AssemblyAI polling error: ${error}`);
        }

        transcript = await pollingResponse.json();

        if (transcript.status === "completed") {
          console.log("✅ Transcription completed successfully!");
          return { text: transcript.text, id: transcript.id };
        } else if (transcript.status === "error") {
          throw new Error(`Transcription failed: ${transcript.error}`);
        }

        // Wait 5 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;

        if (attempts % 6 === 0) {
          console.log(`⏳ Still processing... (${attempts * 5}s elapsed)`);
        }
      }

      throw new Error("Transcription timeout - took longer than 5 minutes");
    } catch (error) {
      console.error("❌ AssemblyAI transcription error:", error);
      throw error;
    }
  }

  // ============= Gemini Methods (Fallback) =============

  async summarizeWithGemini(text) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(this.geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Please provide a concise summary of the following text:\n\n${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async extractTasksWithGemini(text) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(this.geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const currentDate = new Date().toISOString().split("T")[0];
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
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(this.geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const currentDate = new Date().toISOString().split("T")[0];
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
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(this.geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        return JSON.parse(cleanJson);
      } catch (e) {
        console.error("Failed to parse LeMUR task response:", response);
        return [];
      }
    } catch (error) {
      console.error("AssemblyAI Task Extraction Error:", error);
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
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const parsed = JSON.parse(cleanJson);
        return {
          tasks: parsed.tasks || [],
          notes: parsed.notes || [],
        };
      } catch (e) {
        console.error("Failed to parse LeMUR tasks/notes response:", response);
        return { tasks: [], notes: [] };
      }
    } catch (error) {
      console.error("AssemblyAI Notes Extraction Error:", error);
      throw error;
    }
  }

  async ensureTranscript(input) {
    // If we already have a transcript ID, use it
    if (input.transcriptId) {
      console.log("Using existing transcript ID:", input.transcriptId);
      return { id: input.transcriptId };
    }

    // If we have a file path, we might need to re-transcribe to get an ID (since we don't store it yet)
    // NOTE: This incurs cost. Ideally we should store transcript_id in DB.
    if (input.file_path) {
      console.log("No transcript ID found, re-transcribing for LeMUR...");
      return await this.transcribeWithAssemblyAI(input.file_path);
    }

    throw new Error(
      "AssemblyAI LeMUR requires a transcript ID or file path to process.",
    );
  }

  async runLemurTask(transcriptIds, prompt) {
    try {
      const response = await fetch(
        "https://api.assemblyai.com/lemur/v3/generate/task",
        {
          method: "POST",
          headers: {
            authorization: this.assemblyAIKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcript_ids: transcriptIds,
            prompt: prompt,
            final_model: "default",
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LeMUR capabilities error: ${error}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("LeMUR Request Failed:", error);
      throw error;
    }
  }
}

export default new AIService();
