'use client';

import { useState } from 'react';
import { Copyright } from 'lucide-react';
import PromptInput from '@/components/prompt-input';
import ImageCanvas from '@/components/image-canvas';
import ControlPanel from '@/components/control-panel';
import {
  DEFAULT_SETTINGS,
  parseImageSize,
  toImageDataUrl,
  type GenerationSettings,
} from '@/lib/image-generation';

export default function Home() {
  const [mode, setMode] = useState<'text-to-image' | 'image-to-image'>('text-to-image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);

  const handleModeChange = (nextMode: 'text-to-image' | 'image-to-image') => {
    setMode(nextMode);
    setSettings((current) => ({
      ...current,
      action: nextMode === 'image-to-image' ? 'transform' : 'create',
    }));
  };

  const handleGenerate = async ({
    prompt,
    inputImageFile,
  }: {
    prompt: string;
    inputImageFile?: File | null;
  }) => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      const { width, height } = parseImageSize(settings.imageSize);

      formData.append('prompt', prompt);
      formData.append('mode', mode);
      formData.append('action', settings.action);
      formData.append('style', settings.style);
      formData.append('guidance', String(settings.guidance));
      formData.append('imageSize', settings.imageSize);
      formData.append('width', String(width));
      formData.append('height', String(height));
      formData.append('steps', String(settings.steps));

      if (settings.seed >= 0) {
        formData.append('seed', String(settings.seed));
      }

      if (inputImageFile) {
        formData.append('input_image_0', inputImageFile, inputImageFile.name);
      }

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json()) as {
        error?: string;
        code?: string;
        requestId?: string;
        dataUrl?: string;
        image?: string;
      };

      if (!response.ok) {
        const reference = data.requestId ? ` (Ref: ${data.requestId})` : '';
        const flaggedHint =
          data.code === 'CONTENT_FLAGGED'
            ? mode === 'image-to-image'
              ? ' Update prompt/style or use another input image and try again.'
              : ' Rephrase the prompt, choose a safer action/style, and try again.'
            : '';
        throw new Error(`${data.error || 'Image generation failed.'}${flaggedHint}${reference}`);
      }

      const imageUrl = data.dataUrl || (data.image ? toImageDataUrl(data.image) : '');
      if (!imageUrl) {
        throw new Error('The API response did not include an image.');
      }

      setGeneratedImages((previous) => [imageUrl, ...previous].slice(0, 24));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image generation failed.';
      setErrorMessage(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-transparent text-foreground">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient opacity-85" />
        <svg className="absolute inset-0 h-full w-full opacity-10">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-700/50 bg-slate-950/45 px-5 py-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <img
                src="/logo_imaginex.svg"
                alt="Imaginex logo"
                className="block h-11 w-auto max-w-[220px] select-none sm:h-12 sm:max-w-[250px]"
                draggable={false}
              />
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white sm:text-2xl">AI Generate Image Studio</h1>
                <p className="text-sm text-slate-400">Prompt, tweak, preview and compare in one workflow.</p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <div className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/30 p-1">
                <button
                  type="button"
                  onClick={() => handleModeChange('text-to-image')}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    mode === 'text-to-image'
                      ? 'bg-brand-gradient text-white shadow-lg shadow-primary/20'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Text to Image
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('image-to-image')}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    mode === 'image-to-image'
                      ? 'bg-brand-gradient text-white shadow-lg shadow-primary/20'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Image to Image
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Session gallery: <span className="font-semibold text-slate-200">{generatedImages.length}</span>{' '}
                image{generatedImages.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </header>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-6">
            <PromptInput
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              mode={mode}
              promptContext={{
                action: settings.action,
                style: settings.style,
              }}
            />
            <ImageCanvas
              generatedImages={generatedImages}
              isGenerating={isGenerating}
              mode={mode}
              onClearHistory={() => setGeneratedImages([])}
            />
          </section>

          <aside className="space-y-6">
            <ControlPanel
              settings={settings}
              onSettingsChange={setSettings}
              onReset={() => setSettings(DEFAULT_SETTINGS)}
              mode={mode}
            />
          </aside>
        </div>

        <footer className="flex items-center justify-center gap-1.5 pb-2 text-xs text-slate-500">
          <Copyright className="h-3.5 w-3.5" />
          <span>Built by Thắng Nguyễn Duy</span>
        </footer>
      </div>
    </div>
  );
}
