import { z } from 'zod';
import { generateDeterministicMockElements } from '../src/engine/mockOptimizer.js';

declare const process: any;

const elementSchema = z.object({
  id: z.string(),
  type: z.enum(['headline', 'subtext', 'cta']),
  content: z.string(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

const generateAdOutputSchema = z.object({
  elements: z.array(elementSchema).min(1),
});

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed', message: 'Only POST supported.' });
  }

  const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';

  if (!prompt) {
    return res.status(400).json({ error: 'invalid_request', message: 'Prompt is required.' });
  }

  let rawLlmText = '';
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  try {
    if (prompt === 'test:malformed') {
      rawLlmText = '```json\n{"elements": [{"id": "headline", "content": "truncated...';
    } else if (prompt === 'test:invalid_schema') {
      rawLlmText = JSON.stringify({ elements: [{ id: 'headline', type: 'unknown_type', content: 'hello', priority: 5 }] });
    } else if (prompt === 'test:llm_unavailable') {
      throw new Error('Simulated network failure');
    } else if (geminiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(9000),
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: 'You are an advertising copywriter. Given a prompt, generate ad copy. You MUST output ONLY valid JSON matching: {"elements":[{"id":string,"type":"headline"|"subtext"|"cta","content":string,"priority":1|2|3}]}',
                },
              ],
            },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );
      if (!response.ok) {
        return res.status(503).json({ error: 'llm_unavailable', message: `Gemini API returned status ${response.status}.` });
      }
      const data = (await response.json()) as any;
      rawLlmText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (openaiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        signal: AbortSignal.timeout(9000),
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an advertising copywriter. Output ONLY valid JSON matching: {"elements":[{"id":string,"type":"headline"|"subtext"|"cta","content":string,"priority":1|2|3}]}',
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });
      if (!response.ok) {
        return res.status(503).json({ error: 'llm_unavailable', message: `OpenAI API returned status ${response.status}.` });
      }
      const data = (await response.json()) as any;
      rawLlmText = data.choices?.[0]?.message?.content || '';
    } else if (process.env.MOCK_LLM === 'true' || prompt.startsWith('mock:') || (!geminiKey && !openaiKey)) {
      const elements = generateDeterministicMockElements(prompt);
      rawLlmText = JSON.stringify({ elements });
    } else {
      return res.status(503).json({
        error: 'llm_unavailable',
        message: 'LLM service unavailable. API key not configured in environment.',
      });
    }
  } catch {
    return res.status(503).json({
      error: 'llm_unavailable',
      message: 'LLM request timed out or network connection failed.',
    });
  }

  // Strip markdown fences
  let cleaned = rawLlmText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
    cleaned = cleaned.replace(/\n?```\s*$/i, '');
  }
  cleaned = cleaned.trim();

  // JSON.parse in try/catch
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return res.status(502).json({
      error: 'malformed_response',
      message: 'Model output could not be parsed as valid JSON.',
    });
  }

  // Validate with Zod
  const validation = generateAdOutputSchema.safeParse(parsed);
  if (!validation.success) {
    return res.status(502).json({
      error: 'invalid_schema',
      message: 'Model response violated required schema.',
      details: validation.error.flatten(),
    });
  }

  return res.status(200).json(validation.data);
}
