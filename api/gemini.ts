import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function — Gemini AI Text Proxy
 * 
 * Proxies text-based requests to the Google Gemini API so that the
 * GEMINI_API_KEY is never exposed to the browser.
 * 
 * POST /api/gemini
 * Body: { prompt: string, model?: string, maxTokens?: number, temperature?: number }
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODEL = 'gemini-3.5-flash';

/** Origins allowed to call this endpoint. */
const ALLOWED_ORIGINS_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$|^https:\/\/.*\.vercel\.app$/;

function getAllowedOrigin(req: VercelRequest): string | null {
  const origin = req.headers['origin'] || req.headers['referer'];
  if (!origin) return null;
  const originStr = Array.isArray(origin) ? origin[0] : origin;
  try {
    const url = new URL(originStr);
    const base = `${url.protocol}//${url.host}`;
    if (ALLOWED_ORIGINS_PATTERN.test(base)) return base;
    // Also allow the exact Vercel deployment URL
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl && base.includes(vercelUrl)) return base;
  } catch {
    // invalid URL
  }
  return null;
}

function setCorsHeaders(res: VercelResponse, origin: string): void {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // --- CORS preflight ---
  const origin = getAllowedOrigin(req);
  if (origin) {
    setCorsHeaders(res, origin);
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // --- Origin validation ---
  if (!origin) {
    return res.status(403).json({ error: 'Forbidden: invalid or missing origin.' });
  }

  // --- API key from server environment ---
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is not set.' });
  }

  // --- Parse & validate body ---
  const { prompt, model, maxTokens, temperature } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or empty "prompt" in request body.' });
  }

  const targetModel = (model && typeof model === 'string') ? model.trim() : DEFAULT_MODEL;

  // --- Rate limiting headers (advisory) ---
  res.setHeader('X-RateLimit-Limit', '60');
  res.setHeader('X-RateLimit-Remaining', '59');

  try {
    const geminiResponse = await callGemini(apiKey, targetModel, prompt.trim(), {
      maxTokens: typeof maxTokens === 'number' ? maxTokens : undefined,
      temperature: typeof temperature === 'number' ? temperature : 0.15,
    });

    // If model not found, try fallback
    if (geminiResponse.status === 404 && targetModel !== FALLBACK_MODEL) {
      const fallbackResponse = await callGemini(apiKey, FALLBACK_MODEL, prompt.trim(), {
        maxTokens: typeof maxTokens === 'number' ? maxTokens : undefined,
        temperature: typeof temperature === 'number' ? temperature : 0.15,
      });
      return await handleGeminiResponse(fallbackResponse, res);
    }

    return await handleGeminiResponse(geminiResponse, res);
  } catch (err: any) {
    console.error('[api/gemini] Proxy error:', err.message);
    return res.status(502).json({
      error: `Failed to proxy request to Gemini API: ${err.message || 'Unknown error'}`,
    });
  }
}

interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
}

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
  options: GenerationOptions
): Promise<Response> {
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  const generationConfig: Record<string, any> = {};
  if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
  if (options.maxTokens !== undefined) generationConfig.maxOutputTokens = options.maxTokens;

  return await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: Object.keys(generationConfig).length > 0 ? generationConfig : undefined,
    }),
  });
}

async function handleGeminiResponse(response: Response, res: VercelResponse): Promise<void> {
  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.error?.message || `Gemini API error (${response.status})`;
    res.status(response.status).json({ error: errorMessage });
    return;
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  res.status(200).json({
    success: true,
    text: text || '',
    candidates: data.candidates,
    usageMetadata: data.usageMetadata,
  });
}
