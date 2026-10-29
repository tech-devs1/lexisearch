import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function — Gemini AI Transcription / File Processing Proxy
 *
 * Proxies multimodal (file + prompt) requests to the Google Gemini API so that
 * the GEMINI_API_KEY is never exposed to the browser.
 *
 * POST /api/transcribe
 * Body: { fileBase64: string, mimeType: string, prompt: string, model?: string }
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODEL = 'gemini-3.5-flash';

/** Maximum payload size for inline data (~20 MB base64 ≈ ~27 MB JSON). */
const MAX_BASE64_LENGTH = 28 * 1024 * 1024;

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
  const { fileBase64, mimeType, prompt, model } = req.body || {};

  if (!fileBase64 || typeof fileBase64 !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "fileBase64" in request body.' });
  }

  if (fileBase64.length > MAX_BASE64_LENGTH) {
    const sizeMb = (fileBase64.length / (1024 * 1024)).toFixed(1);
    return res.status(413).json({
      error: `File payload too large (${sizeMb} MB). Maximum inline media size is ~20 MB.`,
    });
  }

  if (!mimeType || typeof mimeType !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "mimeType" in request body.' });
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or empty "prompt" in request body.' });
  }

  const targetModel = (model && typeof model === 'string') ? model.trim() : DEFAULT_MODEL;

  // --- Rate limiting headers (advisory) ---
  res.setHeader('X-RateLimit-Limit', '30');
  res.setHeader('X-RateLimit-Remaining', '29');

  try {
    const geminiResponse = await callGeminiMultimodal(apiKey, targetModel, {
      fileBase64,
      mimeType: mimeType.trim(),
      prompt: prompt.trim(),
    });

    // If model not found, try fallback
    if (geminiResponse.status === 404 && targetModel !== FALLBACK_MODEL) {
      const fallbackResponse = await callGeminiMultimodal(apiKey, FALLBACK_MODEL, {
        fileBase64,
        mimeType: mimeType.trim(),
        prompt: prompt.trim(),
      });
      return await handleGeminiResponse(fallbackResponse, res);
    }

    return await handleGeminiResponse(geminiResponse, res);
  } catch (err: any) {
    console.error('[api/transcribe] Proxy error:', err.message);
    return res.status(502).json({
      error: `Failed to proxy transcription request to Gemini API: ${err.message || 'Unknown error'}`,
    });
  }
}

interface MultimodalPayload {
  fileBase64: string;
  mimeType: string;
  prompt: string;
}

async function callGeminiMultimodal(
  apiKey: string,
  model: string,
  payload: MultimodalPayload
): Promise<Response> {
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  return await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: payload.mimeType,
                data: payload.fileBase64,
              },
            },
            {
              text: payload.prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
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
