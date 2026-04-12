import { NextResponse } from 'next/server';
import {
  DEFAULT_LOCALE,
  getMessages,
  isLocale,
  type Locale,
  type Messages,
} from '@/lib/i18n';
import {
  buildPrompt,
  LOCKED_STEPS,
  normalizeSeed,
  parseImageSize,
  toImageDataUrl,
  type GenerationAction,
  type GenerationStyle,
} from '@/lib/image-generation';
import {
  CloudflareGenerationError,
  generateCloudflareImage,
} from '@/lib/server/cloudflare-client';
import { getCloudflareEnv } from '@/lib/server/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_INPUT_IMAGES = 4;
type GenerationMode = 'text-to-image' | 'image-to-image';

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function readNumber(formData: FormData, key: string): number | undefined {
  const value = readString(formData, key);
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readMode(formData: FormData): GenerationMode {
  return readString(formData, 'mode') === 'image-to-image' ? 'image-to-image' : 'text-to-image';
}

function readLocale(formData: FormData): Locale {
  const value = readString(formData, 'locale');
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

function readInputImages(formData: FormData): File[] {
  const files: File[] = [];

  for (let index = 0; index < MAX_INPUT_IMAGES; index += 1) {
    const entry = formData.get(`input_image_${index}`);
    if (entry instanceof File && entry.size > 0) {
      files.push(entry);
    }
  }

  return files;
}

function localizeServerMessage(rawMessage: string, messages: Messages): string {
  switch (rawMessage) {
    case 'Missing Cloudflare token. Set CLOUDFLARE_API_TOKEN (preferred) or CLOUDFLARE_AUTH_TOKEN.':
      return messages.errors.missingCloudflareToken;
    case 'Missing Cloudflare endpoint configuration. Set CLOUDFLARE_API_URL or CLOUDFLARE_ACCOUNT_ID.':
      return messages.errors.missingCloudflareImageEndpoint;
    case 'Cloudflare request failed.':
      return messages.errors.cloudflareRequestFailed;
    case 'Cloudflare response did not include an image.':
      return messages.errors.cloudflareNoImage;
    default:
      return rawMessage;
  }
}

export async function POST(request: Request) {
  let locale: Locale = DEFAULT_LOCALE;
  let mode: GenerationMode = 'text-to-image';

  try {
    const formData = await request.formData();
    locale = readLocale(formData);
    const messages = getMessages(locale);
    const prompt = readString(formData, 'prompt');
    mode = readMode(formData);
    const action = (readString(formData, 'action') || 'create') as GenerationAction;
    const style = (readString(formData, 'style') || 'cinematic') as GenerationStyle;
    const imageSize = readString(formData, 'imageSize') || readString(formData, 'size') || '1024x1024';
    const guidance = readNumber(formData, 'guidance');
    const seed = readNumber(formData, 'seed');
    const { width, height } = parseImageSize(imageSize);

    if (!prompt.trim() && mode === 'text-to-image') {
      return NextResponse.json(
        { error: messages.errors.promptRequiredTextToImage },
        { status: 400 },
      );
    }

    const { apiToken, apiUrl } = getCloudflareEnv();
    const normalizedSeed = normalizeSeed(seed ?? -1);
    const image = await generateCloudflareImage({
      apiToken,
      apiUrl,
      guidance,
      height,
      inputImages: readInputImages(formData),
      mode,
      prompt: buildPrompt({
        prompt,
        mode,
        action,
        style,
      }),
      seed: normalizedSeed,
      width,
    });

    return NextResponse.json({
      image,
      dataUrl: toImageDataUrl(image),
      meta: {
        mode,
        action,
        style,
        width,
        height,
        guidance: guidance ?? null,
        seed: normalizedSeed ?? null,
        steps: LOCKED_STEPS,
      },
    });
  } catch (error) {
    const messages = getMessages(locale);

    if (error instanceof CloudflareGenerationError) {
      const localizedError =
        error.code === 'CONTENT_FLAGGED'
          ? mode === 'image-to-image'
            ? messages.errors.contentFlaggedImageToImage
            : messages.errors.contentFlaggedTextToImage
          : localizeServerMessage(error.message, messages);

      return NextResponse.json(
        {
          code: error.code,
          error: localizedError,
          requestId: error.requestId,
        },
        { status: error.status },
      );
    }

    const message =
      error instanceof Error
        ? localizeServerMessage(error.message, messages)
        : messages.errors.unexpectedServerError;

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
