import { NextResponse } from 'next/server';
import { type GenerationAction, type GenerationStyle } from '@/lib/image-generation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RewritePromptRequest = {
  prompt?: string;
  mode?: 'text-to-image' | 'image-to-image';
  action?: GenerationAction;
  style?: GenerationStyle;
};

type CloudflareTextResponse = {
  success?: boolean;
  result?: unknown;
  response?: string;
  errors?: Array<{
    message?: string;
  }>;
  messages?: Array<{
    message?: string;
  }>;
};

function getEnvValue(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function getCloudflareToken(): string {
  const token = getEnvValue('CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_AUTH_TOKEN');
  if (!token) {
    throw new Error(
      'Missing Cloudflare token. Set CLOUDFLARE_API_TOKEN (or CLOUDFLARE_AUTH_TOKEN).',
    );
  }

  return token.replace(/^Bearer\s+/i, '').trim();
}

function getAccountIdFromApiUrl(): string | undefined {
  const apiUrl = getEnvValue('CLOUDFLARE_API_URL');
  if (!apiUrl) {
    return undefined;
  }

  const match = apiUrl.match(/\/accounts\/([^/]+)\/ai\/run\//i);
  return match?.[1];
}

function getCloudflareTextApiUrl(): string {
  const explicitUrl = getEnvValue('CLOUDFLARE_TEXT_API_URL');
  if (explicitUrl) {
    return explicitUrl;
  }

  const accountId = getEnvValue('CLOUDFLARE_ACCOUNT_ID') || getAccountIdFromApiUrl();
  if (!accountId) {
    throw new Error(
      'Missing Cloudflare text endpoint configuration. Set CLOUDFLARE_TEXT_API_URL or CLOUDFLARE_ACCOUNT_ID.',
    );
  }

  const modelId = getEnvValue('CLOUDFLARE_TEXT_MODEL_ID') || '@cf/zai-org/glm-4.7-flash';
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelId}`;
}

function getCloudflareErrorMessage(payload: CloudflareTextResponse | null): string | null {
  if (!payload) {
    return null;
  }

  const messages = [
    ...(payload.errors ?? []).map((item) => item.message).filter(Boolean),
    ...(payload.messages ?? []).map((item) => item.message).filter(Boolean),
  ].filter(Boolean) as string[];

  return messages.length > 0 ? messages.join(' ') : null;
}

function normalizeTextContent(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const segments = value
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item && typeof item === 'object') {
          const text = (item as { text?: unknown }).text;
          return typeof text === 'string' ? text : '';
        }

        return '';
      })
      .filter(Boolean);

    return segments.join(' ').trim();
  }

  return '';
}

function extractSuggestedPrompt(payload: CloudflareTextResponse | null): string | null {
  if (!payload) {
    return null;
  }

  const result = payload.result as
    | {
        response?: unknown;
        output_text?: unknown;
        text?: unknown;
        answer?: unknown;
        content?: unknown;
        choices?: Array<{
          message?: {
            content?: unknown;
          };
          text?: unknown;
        }>;
      }
    | undefined;

  const candidates: unknown[] = [
    result?.response,
    result?.output_text,
    result?.text,
    result?.answer,
    result?.content,
    payload.response,
  ];

  for (const candidate of candidates) {
    const text = normalizeTextContent(candidate);
    if (text) {
      return text;
    }
  }

  if (Array.isArray(result?.choices)) {
    for (const choice of result.choices) {
      const messageText = normalizeTextContent(choice.message?.content);
      if (messageText) {
        return messageText;
      }

      const text = normalizeTextContent(choice.text);
      if (text) {
        return text;
      }
    }
  }

  return null;
}

function sanitizePrompt(prompt: string): string {
  let normalized = prompt.trim();

  normalized = normalized.replace(/^```[\w-]*\s*/i, '').replace(/```$/i, '').trim();
  normalized = normalized.replace(/^["'`]+|["'`]+$/g, '').trim();

  return normalized;
}

function buildSystemInstruction(): string {
  return [
    'You are an expert prompt engineer for text-to-image generation.',
    'Rewrite the user request into one strong, production-ready prompt that improves image quality.',
    'Preserve the original intent and subject.',
    'Add concrete visual details: composition, framing, lighting, color palette, textures, mood, and style cues when relevant.',
    'Keep it concise (1-3 sentences).',
    'Return only the rewritten prompt. No markdown, no explanations, no labels.',
  ].join(' ');
}

function buildUserInstruction({
  prompt,
  mode,
  action,
  style,
}: {
  prompt: string;
  mode: 'text-to-image' | 'image-to-image';
  action: string;
  style: string;
}): string {
  return [
    `Mode: ${mode}`,
    `Action preset: ${action}`,
    `Style preset: ${style}`,
    `User prompt: ${prompt}`,
  ].join('\n');
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RewritePromptRequest;
    const prompt = body.prompt?.trim() || '';
    const mode = body.mode === 'image-to-image' ? 'image-to-image' : 'text-to-image';
    const action = body.action?.trim() || 'create';
    const style = body.style?.trim() || 'cinematic';

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required to generate an optimized prompt.' },
        { status: 400 },
      );
    }

    const apiUrl = getCloudflareTextApiUrl();
    const authToken = getCloudflareToken();
    const cloudflareRequestBody = {
      messages: [
        {
          role: 'system',
          content: buildSystemInstruction(),
        },
        {
          role: 'user',
          content: buildUserInstruction({
            prompt,
            mode,
            action,
            style,
          }),
        },
      ],
    };

    const cloudflareResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cloudflareRequestBody),
    });

    const rawResponse = await cloudflareResponse.text();
    let payload: CloudflareTextResponse | null = null;

    try {
      payload = rawResponse ? (JSON.parse(rawResponse) as CloudflareTextResponse) : null;
    } catch {
      payload = null;
    }

    if (!cloudflareResponse.ok || payload?.success === false) {
      const errorMessage =
        getCloudflareErrorMessage(payload) ||
        rawResponse ||
        cloudflareResponse.statusText ||
        'Prompt rewrite request failed.';

      return NextResponse.json(
        { error: errorMessage },
        { status: cloudflareResponse.status || 502 },
      );
    }

    const suggestedPrompt = extractSuggestedPrompt(payload);
    if (!suggestedPrompt) {
      return NextResponse.json(
        { error: 'Prompt rewrite response did not include content.' },
        { status: 502 },
      );
    }

    const sanitized = sanitizePrompt(suggestedPrompt);
    if (!sanitized) {
      return NextResponse.json(
        { error: 'Prompt rewrite returned empty output after sanitization.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ prompt: sanitized });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
