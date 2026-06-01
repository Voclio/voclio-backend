import logger from '../../utils/logger.js';

export function parseJsonArray(content, fallback = []) {
  try {
    if (content.startsWith('[')) {
      return JSON.parse(content);
    }

    const codeBlockMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    logger.warn('No JSON array found in AI response');
    return fallback;
  } catch (error) {
    logger.error('Failed to parse AI JSON array', { error: error.message, content });
    return fallback;
  }
}

export function parseJsonObject(content, fallback = {}) {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error('Failed to parse AI JSON object', { error: error.message });
    }
  }

  return fallback;
}

export async function openRouterChat(apiKey, { messages, temperature = 0.7, maxTokens = 500 }) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://voclio.app',
      'X-Title': 'Voclio'
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
