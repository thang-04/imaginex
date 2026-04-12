export type CloudflareErrorCode = 'CONTENT_FLAGGED' | 'CLOUDFLARE_REQUEST_FAILED' | 'RATE_LIMITED';

type CloudflareImageResponse = {
  success?: boolean;
  result?: {
    image?: string;
  };
  image?: string;
  errors?: Array<{
    message?: string;
  }>;
  messages?: Array<{
    message?: string;
  }>;
};

type GenerateCloudflareImageInput = {
  apiToken: string;
  apiUrl: string;
  guidance?: number;
  height: number;
  inputImages: readonly File[];
  mode: 'text-to-image' | 'image-to-image';
  prompt: string;
  seed?: number;
  width: number;
};

const AI_ERROR_PREFIX_REGEX = /^(?:AiError|Error)\s*:\s*/i;
const REQUEST_ID_REGEX =
  /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export class CloudflareGenerationError extends Error {
  readonly code: CloudflareErrorCode;
  readonly requestId?: string;
  readonly status: number;

  constructor({
    code,
    message,
    requestId,
    status,
  }: {
    code: CloudflareErrorCode;
    message: string;
    requestId?: string;
    status: number;
  }) {
    super(message);
    this.name = 'CloudflareGenerationError';
    this.code = code;
    this.requestId = requestId;
    this.status = status;
  }

  toResponseBody() {
    return {
      code: this.code,
      error: this.message,
      requestId: this.requestId,
    };
  }
}

function getCloudflareErrorMessage(payload: CloudflareImageResponse | null): string | null {
  if (!payload) {
    return null;
  }

  const messages = [
    ...(payload.errors ?? []).map((item) => item.message).filter(Boolean),
    ...(payload.messages ?? []).map((item) => item.message).filter(Boolean),
  ].filter(Boolean) as string[];

  if (messages.length > 0) {
    return messages.join(' ');
  }

  return null;
}

function normalizeProviderErrorMessage(message: string): string {
  let normalized = message.trim();

  while (AI_ERROR_PREFIX_REGEX.test(normalized)) {
    normalized = normalized.replace(AI_ERROR_PREFIX_REGEX, '').trim();
  }

  return normalized || message.trim();
}

function extractRequestId(message: string): string | undefined {
  const match = message.match(REQUEST_ID_REGEX);
  return match?.[1];
}

function isContentFlaggedMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('flagged') ||
    (normalized.includes('safety') && normalized.includes('blocked'))
  );
}

function isRateLimitMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('daily free allocation') ||
    normalized.includes('used up') ||
    normalized.includes('rate limit')
  );
}

function normalizeFailureStatus(status: number): number {
  return status >= 400 && status <= 599 ? status : 502;
}

function buildFailure(
  rawMessage: string,
  status: number,
  mode: 'text-to-image' | 'image-to-image',
): CloudflareGenerationError {
  const providerMessage = normalizeProviderErrorMessage(rawMessage);
  const requestId = extractRequestId(providerMessage);

  if (isContentFlaggedMessage(providerMessage)) {
    const errorMessage =
      mode === 'image-to-image'
        ? 'Cloudflare safety filter blocked this prompt or input image. Try a safer prompt, avoid sensitive terms, or change the input image.'
        : 'Cloudflare safety filter blocked this prompt. Try safer wording, avoid sensitive terms, or switch to a less risky style/action.';

    return new CloudflareGenerationError({
      code: 'CONTENT_FLAGGED',
      message: errorMessage,
      requestId,
      status: 422,
    });
  }

  if (isRateLimitMessage(providerMessage) || status === 429) {
    return new CloudflareGenerationError({
      code: 'RATE_LIMITED',
      message: 'You have exhausted your daily Cloudflare limits.',
      requestId,
      status: 429,
    });
  }

  return new CloudflareGenerationError({
    code: 'CLOUDFLARE_REQUEST_FAILED',
    message: providerMessage,
    requestId,
    status: normalizeFailureStatus(status),
  });
}

export async function generateCloudflareImage({
  apiToken,
  apiUrl,
  guidance,
  height,
  inputImages,
  mode,
  prompt,
  seed,
  width,
}: GenerateCloudflareImageInput): Promise<string> {
  const cloudflareForm = new FormData();
  cloudflareForm.append('prompt', prompt);
  cloudflareForm.append('width', String(width));
  cloudflareForm.append('height', String(height));

  if (typeof guidance === 'number') {
    cloudflareForm.append('guidance', String(guidance));
  }

  if (typeof seed === 'number') {
    cloudflareForm.append('seed', String(seed));
  }

  for (const [index, image] of inputImages.entries()) {
    cloudflareForm.append(`input_image_${index}`, image, image.name || `input-${index}`);
  }

  const cloudflareResponse = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    body: cloudflareForm,
  });

  const rawResponse = await cloudflareResponse.text();
  let payload: CloudflareImageResponse | null = null;

  try {
    payload = rawResponse ? (JSON.parse(rawResponse) as CloudflareImageResponse) : null;
  } catch {
    payload = null;
  }

  if (!cloudflareResponse.ok || payload?.success === false) {
    const rawMessage =
      getCloudflareErrorMessage(payload) ||
      rawResponse ||
      cloudflareResponse.statusText ||
      'Cloudflare request failed.';

    throw buildFailure(rawMessage, cloudflareResponse.status, mode);
  }

  const image = payload?.result?.image ?? payload?.image;
  if (!image) {
    throw new CloudflareGenerationError({
      code: 'CLOUDFLARE_REQUEST_FAILED',
      message: 'Cloudflare response did not include an image.',
      status: 502,
    });
  }

  return image;
}
