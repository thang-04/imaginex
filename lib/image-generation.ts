export const ACTION_PRESETS = [
  {
    value: 'create',
    label: 'Create from scratch',
    prompt: 'Generate a brand new image from scratch.',
  },
  {
    value: 'transform',
    label: 'Transform image',
    prompt:
      'Use the uploaded image as the base and apply the requested changes while keeping the subject recognizable.',
  },
  {
    value: 'style-transfer',
    label: 'Style transfer',
    prompt:
      'Preserve the composition and subject placement, then restyle the image to match the requested look.',
  },
  {
    value: 'product-shot',
    label: 'Product shot',
    prompt:
      'Create a polished commercial product image with clean studio lighting and premium presentation.',
  },
  {
    value: 'portrait',
    label: 'Portrait',
    prompt:
      'Create or enhance a flattering portrait with natural skin texture, balanced lighting, and sharp facial detail.',
  },
  {
    value: 'background-replace',
    label: 'Background replace',
    prompt:
      'Keep the subject consistent and replace the background according to the prompt.',
  },
] as const;

export type GenerationAction = (typeof ACTION_PRESETS)[number]['value'];

export const STYLE_PRESETS = [
  {
    value: 'cinematic',
    label: 'Cinematic',
    prompt: 'cinematic lighting, dramatic contrast, filmic color grading',
  },
  {
    value: 'photorealistic',
    label: 'Photorealistic',
    prompt: 'photorealistic, natural colors, ultra-detailed textures',
  },
  {
    value: 'anime',
    label: 'Anime',
    prompt: 'anime style, clean line art, expressive faces, vibrant colors',
  },
  {
    value: 'watercolor',
    label: 'Watercolor',
    prompt: 'watercolor wash, soft edges, paper texture, hand-painted feel',
  },
  {
    value: 'oil-painting',
    label: 'Oil Painting',
    prompt: 'oil painting, rich brushstrokes, classical composition',
  },
  {
    value: 'digital-art',
    label: 'Digital Art',
    prompt: 'digital art, polished illustration, crisp rendering',
  },
  {
    value: 'neon',
    label: 'Neon',
    prompt: 'neon glow, high contrast, luminous accents',
  },
  {
    value: 'cyberpunk',
    label: 'Cyberpunk',
    prompt: 'cyberpunk atmosphere, neon city lights, futuristic detail',
  },
] as const;

export type GenerationStyle = (typeof STYLE_PRESETS)[number]['value'];

export const SIZE_PRESETS = [
  { value: '1024x1024', label: '1:1 Square', width: 1024, height: 1024 },
  { value: '1280x720', label: '16:9 Landscape', width: 1280, height: 720 },
  { value: '720x1280', label: '9:16 Portrait', width: 720, height: 1280 },
  { value: '1536x1024', label: '3:2 Wide', width: 1536, height: 1024 },
  { value: '1024x1536', label: '2:3 Tall', width: 1024, height: 1536 },
] as const;

export type ImageSize = (typeof SIZE_PRESETS)[number]['value'];

export const LOCKED_STEPS = 4;

export interface GenerationSettings {
  steps: number;
  guidance: number;
  imageSize: ImageSize;
  seed: number;
  style: GenerationStyle;
  action: GenerationAction;
}

export const DEFAULT_SETTINGS: GenerationSettings = {
  steps: LOCKED_STEPS,
  guidance: 5,
  imageSize: '1024x1024',
  seed: -1,
  style: 'cinematic',
  action: 'create',
};

export function parseImageSize(size: string): { width: number; height: number } {
  const preset = SIZE_PRESETS.find((item) => item.value === size);

  if (preset) {
    return {
      width: preset.width,
      height: preset.height,
    };
  }

  const [rawWidth, rawHeight] = size.split('x');
  const width = Number.parseInt(rawWidth ?? '', 10);
  const height = Number.parseInt(rawHeight ?? '', 10);

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width, height };
  }

  return {
    width: 1024,
    height: 1024,
  };
}

export function normalizeSeed(seed: number): number | undefined {
  if (!Number.isFinite(seed) || seed < 0) {
    return undefined;
  }

  return Math.trunc(seed);
}

function getPresetPrompt<T extends { value: string; prompt: string }>(
  presets: readonly T[],
  value: string,
): string {
  return presets.find((item) => item.value === value)?.prompt ?? '';
}

export function buildPrompt({
  prompt,
  mode,
  action,
  style,
}: {
  prompt: string;
  mode: 'text-to-image' | 'image-to-image';
  action: GenerationAction;
  style: GenerationStyle;
}): string {
  const parts: string[] = [];
  const userPrompt = prompt.trim().replace(/\s+/g, ' ');

  if (mode === 'image-to-image') {
    parts.push('Use the uploaded image as the base reference.');
  }

  const actionPrompt = getPresetPrompt(ACTION_PRESETS, action);
  if (actionPrompt) {
    parts.push(actionPrompt);
  }

  if (userPrompt) {
    parts.push(userPrompt);
  }

  const stylePrompt = getPresetPrompt(STYLE_PRESETS, style);
  if (stylePrompt) {
    parts.push(`Style: ${stylePrompt}.`);
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function toImageDataUrl(image: string, mimeType = 'image/png'): string {
  if (image.startsWith('data:')) {
    return image;
  }

  const normalized = image.trim();

  if (normalized.startsWith('/9j/')) {
    return `data:image/jpeg;base64,${normalized}`;
  }

  if (normalized.startsWith('iVBORw0KGgo')) {
    return `data:image/png;base64,${normalized}`;
  }

  if (normalized.startsWith('UklGR')) {
    return `data:image/webp;base64,${normalized}`;
  }

  if (normalized.startsWith('R0lGOD')) {
    return `data:image/gif;base64,${normalized}`;
  }

  if (
    normalized.startsWith('AAAAIGZ0eXBhdmlm') ||
    normalized.startsWith('AAAAGGZ0eXBhdmlm')
  ) {
    return `data:image/avif;base64,${normalized}`;
  }

  return `data:${mimeType};base64,${normalized}`;
}
