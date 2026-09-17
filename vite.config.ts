import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { z } from 'zod'
import { generateDeterministicMockElements } from './src/engine/mockOptimizer.ts'

const elementSchema = z.object({
  id: z.string(),
  type: z.enum(['headline', 'subtext', 'cta']),
  content: z.string(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

const generateAdOutputSchema = z.object({
  elements: z.array(elementSchema).min(1),
})

function backendApiPlugin(): Plugin {
  return {
    name: 'anysize-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        if (req.url === '/api/health' && req.method === 'GET') {
          return res.end(
            JSON.stringify({
              status: 'healthy',
              service: 'Anysize Multi-Surface Layout Engine Backend API',
              version: '1.4.0',
              architecture: 'Pure Functional Micro-Engine',
              uptimeSec: Math.floor(process.uptime()),
              timestamp: new Date().toISOString(),
            })
          );
        }

        if (req.url === '/api/surfaces' && req.method === 'GET') {
          try {
            const { SURFACES } = await server.ssrLoadModule('/src/data/surfaces.ts');
            return res.end(JSON.stringify(SURFACES));
          } catch (err: any) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: err?.message }));
          }
        }

        if (req.url === '/api/generate-ad' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            let prompt = '';
            try {
              const payload = JSON.parse(body || '{}');
              prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
            } catch {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'invalid_request', message: 'Invalid JSON request body.' }));
            }

            if (!prompt) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'invalid_request', message: 'Prompt is required.' }));
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
                  res.statusCode = 503;
                  return res.end(JSON.stringify({ error: 'llm_unavailable', message: `Gemini API returned status ${response.status}.` }));
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
                  res.statusCode = 503;
                  return res.end(JSON.stringify({ error: 'llm_unavailable', message: `OpenAI API returned status ${response.status}.` }));
                }
                const data = (await response.json()) as any;
                rawLlmText = data.choices?.[0]?.message?.content || '';
              } else if (process.env.MOCK_LLM === 'true' || prompt.startsWith('mock:') || (!geminiKey && !openaiKey)) {
                const elements = generateDeterministicMockElements(prompt);
                rawLlmText = JSON.stringify({ elements });
              } else {
                res.statusCode = 503;
                return res.end(
                  JSON.stringify({
                    error: 'llm_unavailable',
                    message: 'LLM service unavailable. API key not configured in environment (GEMINI_API_KEY or OPENAI_API_KEY).',
                  })
                );
              }
            } catch {
              res.statusCode = 503;
              return res.end(
                JSON.stringify({
                  error: 'llm_unavailable',
                  message: 'LLM request timed out or network connection failed.',
                })
              );
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
              res.statusCode = 502;
              return res.end(
                JSON.stringify({
                  error: 'malformed_response',
                  message: 'Model output could not be parsed as valid JSON.',
                })
              );
            }

            // Validate with Zod
            const validation = generateAdOutputSchema.safeParse(parsed);
            if (!validation.success) {
              res.statusCode = 502;
              return res.end(
                JSON.stringify({
                  error: 'invalid_schema',
                  message: 'Model output failed schema validation.',
                  details: validation.error.issues,
                })
              );
            }

            // Return validated elements
            res.statusCode = 200;
            return res.end(
              JSON.stringify({
                elements: validation.data.elements,
              })
            );
          });
          return;
        }

        if (req.url === '/api/adapt' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const start = performance.now();
              const payload = JSON.parse(body || '{}');
              const elements = payload.elements || [];
              const { SURFACES } = await server.ssrLoadModule('/src/data/surfaces.ts');
              const { layoutEngine } = await server.ssrLoadModule('/src/engine/layoutEngine.ts');

              const surfacesToCompute =
                Array.isArray(payload.surfaces) && payload.surfaces.length > 0
                  ? payload.surfaces
                  : SURFACES;

              const results = surfacesToCompute.map((surface: any) =>
                layoutEngine(elements, surface)
              );
              const durationMs = Number((performance.now() - start).toFixed(3));

              return res.end(
                JSON.stringify({
                  success: true,
                  version: '1.4.0',
                  computeLatencyMs: durationMs,
                  surfaceCount: results.length,
                  results,
                })
              );
            } catch (err: any) {
              res.statusCode = 400;
              return res.end(
                JSON.stringify({
                  success: false,
                  error: err?.message || 'Invalid JSON request payload',
                })
              );
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), tailwindcss(), backendApiPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
      dedupe: ['react', 'react-dom'],
    },
  };
})

