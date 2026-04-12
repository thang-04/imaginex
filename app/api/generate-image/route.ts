import { NextResponse } from 'next/server';
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const prompt = readString(formData, 'prompt');
    const mode = readMode(formData);
    const action = (readString(formData, 'action') || 'create') as GenerationAction;
    const style = (readString(formData, 'style') || 'cinematic') as GenerationStyle;
    const imageSize = readString(formData, 'imageSize') || readString(formData, 'size') || '1024x1024';
    const guidance = readNumber(formData, 'guidance');
    const seed = readNumber(formData, 'seed');
    const { width, height } = parseImageSize(imageSize);

    if (!prompt.trim() && mode === 'text-to-image') {
      return NextResponse.json(
        { error: 'Prompt is required for text-to-image.' },
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
    if (error instanceof CloudflareGenerationError) {
      return NextResponse.json(error.toResponseBody(), { status: error.status });
    }

    const message = error instanceof Error ? error.message : 'Unexpected server error.';

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
