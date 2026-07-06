// DeepSeek API client (Anthropic-compatible endpoint)
// POST https://api.deepseek.com/anthropic/v1/messages

async function callDeepSeek({ system, messages, config, maxTokens = 16384 }) {
  const url = `${config.baseUrl}/v1/messages`;

  // DeepSeek v4 Pro is a reasoning model. thinking tokens count toward max_tokens.
  // We request a large max_tokens to ensure enough room for both thinking + text output.
  const body = {
    model: config.model,
    max_tokens: maxTokens,
    system,
    messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${text.slice(0, 500)}`);
  }

  const result = await response.json();

  // DeepSeek v4 Pro returns both "thinking" and "text" content blocks.
  // We ONLY extract "text" blocks — thinking is the model's internal reasoning.
  if (result.content && Array.isArray(result.content)) {
    const textBlocks = result.content.filter(c => c.type === 'text');
    if (textBlocks.length > 0) {
      return textBlocks.map(c => c.text).join('\n');
    }
    // If only thinking blocks (truncated by token limit), throw with usage info
    const thinkingBlocks = result.content.filter(c => c.type === 'thinking');
    if (thinkingBlocks.length > 0 && textBlocks.length === 0) {
      const usage = result.usage || {};
      throw new Error(
        `No text output: thinking consumed all ${maxTokens} tokens. ` +
        `Usage: input=${usage.input_tokens || '?'} output=${usage.output_tokens || '?'}. ` +
        `Increase max_tokens.`
      );
    }
  }

  // Fallback: try choices format (OpenAI-compatible)
  if (result.choices && result.choices[0]) {
    return result.choices[0].message?.content || '';
  }

  throw new Error('Unexpected API response format: ' + JSON.stringify(result).slice(0, 200));
}

async function callDeepSeekJSON({ system, messages, config, maxTokens = 8192 }) {
  const text = await callDeepSeek({ system, messages, config, maxTokens });

  // Try to parse JSON from the response
  let jsonStr = text.trim();

  // Remove markdown code fences if present
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Try to find a JSON object in the text
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch (e2) {
        // If parsing still fails, the JSON might be truncated (token limit)
        throw new Error(
          `Failed to parse JSON (likely truncated by token limit). ` +
          `Raw (first 200 chars): ${text.slice(0, 200)}`
        );
      }
    }
    throw new Error(`No JSON found in response. Raw (first 200 chars): ${text.slice(0, 200)}`);
  }
}

module.exports = { callDeepSeek, callDeepSeekJSON };
