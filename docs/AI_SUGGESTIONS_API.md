# AI Suggestions API Documentation

> **Enhanced Productivity Suggestions API**  
> **Version:** 2.0  
> **Last Updated:** February 2026

## Overview

The AI Suggestions API provides personalized productivity recommendations based on user data analysis. It uses advanced AI models (GPT-4o via OpenRouter, Gemini 2.0-flash) to generate actionable suggestions tailored to individual productivity patterns.

---

## Endpoint

```
GET /api/productivity/suggestions
```

**Authentication:** Required (Bearer Token)  
**Rate Limit:** 10 requests per 15 minutes per user

---

## Query Parameters

| Parameter    | Type   | Default      | Options                                                      | Description                           |
|-------------|--------|--------------|--------------------------------------------------------------|---------------------------------------|
| `days`      | int    | `7`          | 1-30                                                         | Analysis period in days               |
| `focus_area`| string | `general`    | `time_management`, `task_organization`, `focus_improvement`, `stress_reduction`, `general` | Area of focus for suggestions |
| `tone`      | string | `professional` | `professional`, `motivational`, `casual`, `direct`        | Tone style for suggestions            |
| `count`     | int    | `5`          | 1-10                                                         | Number of suggestions to generate     |
| `language`  | string | `ar`         | `ar`, `en`                                                   | Response language                     |

---

## Request Examples

### Basic Request
```bash
GET /api/productivity/suggestions
Authorization: Bearer your-jwt-token
```

### Advanced Request
```bash
GET /api/productivity/suggestions?focus_area=time_management&tone=motivational&count=3&days=14&language=ar
Authorization: Bearer your-jwt-token
```

### cURL Example
```bash
curl -X GET "https://api.voclio.com/api/productivity/suggestions?focus_area=task_organization&tone=professional&count=5" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

---

## Response Structure

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": 1,
        "text": "قم بتنظيم مهامك حسب الأولوية باستخدام مصفوفة أيزنهاور",
        "category": "task_organization",
        "priority": "high",
        "estimated_impact": "high",
        "implementation_time": "daily",
        "steps": [
          "اكتب جميع مهامك في قائمة واحدة",
          "صنف كل مهمة حسب الأهمية والعجلة",
          "ابدأ بالمهام المهمة والعاجلة أولاً"
        ]
      }
    ],
    "metadata": {
      "generated_at": "2026-02-03T10:30:00Z",
      "data_period": {
        "start_date": "2026-01-27",
        "end_date": "2026-02-03",
        "days": 7
      },
      "ai_provider": "openrouter",
      "parameters": {
        "focus_area": "task_organization",
        "tone": "professional",
        "count": 5,
        "language": "ar"
      },
      "response_time_ms": 1250
    },
    "based_on": {
      "period": {
        "start_date": "2026-01-27",
        "end_date": "2026-02-03",
        "days": 7
      },
      "tasks_analysis": {
        "total_tasks": 25,
        "completed_tasks": 18,
        "pending_tasks": 7,
        "overdue_tasks": 3,
        "completion_rate": 72,
        "average_tasks_per_day": 4
      },
      "productivity_patterns": {
        "most_productive_day": "Monday",
        "total_focus_time": 180,
        "focus_sessions_count": 8,
        "average_focus_duration": 22
      },
      "stress_indicators": {
        "overdue_percentage": 12,
        "high_priority_pending": 2,
        "tasks_without_due_date": 5
      }
    }
  }
}
```

### Error Responses

#### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "focus_area",
        "message": "Invalid focus area"
      }
    ]
  }
}
```

#### Rate Limit Exceeded (429)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many AI suggestion requests. Please try again in 15 minutes.",
    "details": "AI suggestions are limited to 10 requests per 15 minutes to ensure optimal performance."
  }
}
```

#### Authentication Error (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_ERROR",
    "message": "Authentication required",
    "details": null
  }
}
```

#### AI Service Error (500)
```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "Failed to generate suggestions",
    "details": "OpenRouter API temporarily unavailable"
  }
}
```

---

## Focus Areas

### `time_management`
- **Arabic:** إدارة الوقت وتنظيم الجدول اليومي
- **Focus:** Time blocking, scheduling, deadline management
- **Best for:** Users with overdue tasks or poor time estimation

### `task_organization`
- **Arabic:** تنظيم المهام وترتيب الأولويات  
- **Focus:** Task prioritization, categorization, workflow optimization
- **Best for:** Users with many pending tasks or low completion rates

### `focus_improvement`
- **Arabic:** تحسين التركيز وزيادة الإنتاجية
- **Focus:** Concentration techniques, distraction management, deep work
- **Best for:** Users with short focus sessions or frequent interruptions

### `stress_reduction`
- **Arabic:** تقليل التوتر وتحسين التوازن
- **Focus:** Workload management, stress relief, work-life balance
- **Best for:** Users with high overdue percentages or overwhelming task loads

### `general`
- **Arabic:** تحسين الإنتاجية العامة
- **Focus:** Overall productivity improvement across all areas
- **Best for:** New users or those wanting comprehensive suggestions

---

## Tone Styles

### `professional`
- **Arabic:** مهني ومباشر
- **Style:** Formal, business-oriented, structured
- **Example:** "يُنصح بتطبيق منهجية Getting Things Done لتحسين إدارة المهام"

### `motivational`
- **Arabic:** محفز وإيجابي
- **Style:** Encouraging, energetic, inspiring
- **Example:** "أنت قادر على تحقيق المزيد! ابدأ بتنظيم مهامك وستلاحظ الفرق"

### `casual`
- **Arabic:** ودود وبسيط
- **Style:** Friendly, conversational, approachable
- **Example:** "جرب تقسم مهامك الكبيرة لمهام صغيرة، هتلاقي الموضوع أسهل"

### `direct`
- **Arabic:** مختصر وواضح
- **Style:** Concise, straightforward, action-oriented
- **Example:** "استخدم تقنية Pomodoro: 25 دقيقة عمل، 5 دقائق راحة"

---

## AI Analysis Logic

The AI analyzes user data and applies intelligent rules:

### Completion Rate Analysis
- **< 50%:** Focus on task organization and time management
- **50-70%:** Balanced suggestions across all areas
- **> 70%:** Advanced productivity techniques and optimization

### Overdue Tasks Analysis
- **> 30%:** Stress reduction and workload management priority
- **20-30%:** Time management and deadline strategies
- **< 20%:** Focus improvement and efficiency techniques

### Focus Sessions Analysis
- **< 3 per week:** Focus improvement suggestions
- **3-7 per week:** Optimization of existing focus habits
- **> 7 per week:** Advanced deep work techniques

---

## Implementation Examples

### JavaScript/Node.js
```javascript
const response = await fetch('/api/productivity/suggestions?focus_area=time_management&count=3', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
if (data.success) {
  data.data.suggestions.forEach(suggestion => {
    console.log(`💡 ${suggestion.text}`);
    console.log(`📊 Impact: ${suggestion.estimated_impact}`);
    console.log(`⏰ Implementation: ${suggestion.implementation_time}`);
  });
}
```

### Python
```python
import requests

response = requests.get(
    'https://api.voclio.com/api/productivity/suggestions',
    headers={'Authorization': f'Bearer {token}'},
    params={
        'focus_area': 'task_organization',
        'tone': 'motivational',
        'count': 5,
        'language': 'ar'
    }
)

if response.status_code == 200:
    data = response.json()
    for suggestion in data['data']['suggestions']:
        print(f"💡 {suggestion['text']}")
        print(f"🏷️ Category: {suggestion['category']}")
        print(f"⚡ Priority: {suggestion['priority']}")
```

### React/Frontend
```jsx
const [suggestions, setSuggestions] = useState([]);
const [loading, setLoading] = useState(false);

const fetchSuggestions = async (focusArea = 'general') => {
  setLoading(true);
  try {
    const response = await fetch(`/api/productivity/suggestions?focus_area=${focusArea}&count=5`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    if (data.success) {
      setSuggestions(data.data.suggestions);
    }
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
  } finally {
    setLoading(false);
  }
};

return (
  <div>
    {suggestions.map(suggestion => (
      <div key={suggestion.id} className="suggestion-card">
        <h3>{suggestion.text}</h3>
        <div className="suggestion-meta">
          <span className={`priority-${suggestion.priority}`}>
            {suggestion.priority}
          </span>
          <span className="category">{suggestion.category}</span>
        </div>
        {suggestion.steps.length > 0 && (
          <ol>
            {suggestion.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        )}
      </div>
    ))}
  </div>
);
```

---

## Testing

Run the comprehensive test suite:

```bash
# Basic test
node test-ai-suggestions.js

# With custom environment
API_BASE_URL=https://api.voclio.com TEST_TOKEN=your-token node test-ai-suggestions.js
```

The test suite covers:
- ✅ All parameter combinations
- ✅ Rate limiting behavior
- ✅ Input validation
- ✅ Response structure validation
- ✅ Error handling
- ✅ Performance metrics

---

## Best Practices

### For Frontend Integration
1. **Cache suggestions** for 1-2 hours to reduce API calls
2. **Show loading states** during AI processing (1-3 seconds typical)
3. **Handle rate limits** gracefully with user-friendly messages
4. **Validate parameters** client-side before API calls

### For Mobile Apps
1. **Implement offline caching** for previously fetched suggestions
2. **Use appropriate focus areas** based on user context
3. **Respect rate limits** with smart request timing
4. **Provide fallback content** when AI is unavailable

### For Analytics
1. **Track suggestion effectiveness** with user feedback
2. **Monitor API response times** and success rates
3. **Analyze popular focus areas** and tone preferences
4. **Measure user engagement** with suggested actions

---

## Changelog

### Version 2.0 (February 2026)
- ✅ Added focus area targeting
- ✅ Multiple tone styles support
- ✅ Enhanced Arabic language support
- ✅ Structured response with metadata
- ✅ Rate limiting protection
- ✅ Comprehensive input validation
- ✅ Actionable steps in suggestions
- ✅ Performance metrics tracking

### Version 1.0 (January 2026)
- ✅ Basic AI suggestions
- ✅ OpenRouter and Gemini support
- ✅ Simple productivity analysis

---

## Support

For questions or issues with the AI Suggestions API:

- 📧 **Email:** api-support@voclio.com
- 📚 **Documentation:** https://docs.voclio.com
- 🐛 **Bug Reports:** https://github.com/voclio/api/issues
- 💬 **Discord:** https://discord.gg/voclio

---

*This API is part of the Voclio Productivity Platform. All suggestions are generated using advanced AI models and should be considered as recommendations, not absolute directives.*