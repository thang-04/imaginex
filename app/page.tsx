'use client';

import { useState, useEffect } from 'react';
import { Copyright, Zap, Clock, Timer } from 'lucide-react';
import ControlPanel from '@/components/control-panel';
import ImageCanvas from '@/components/image-canvas';
import { useLanguage } from '@/components/language-provider';
import PromptInput from '@/components/prompt-input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTokenLimit } from '@/hooks/use-token-limit';
import {
  DEFAULT_SETTINGS,
  parseImageSize,
  toImageDataUrl,
  estimateNeuronCost,
  type GenerationSettings,
} from '@/lib/image-generation';

function CountdownTimer({ label }: { label: string }) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextReset = new Date();
      nextReset.setUTCFullYear(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
      nextReset.setUTCHours(0, 0, 0, 0);

      const diff = nextReset.getTime() - now.getTime();
      if (diff <= 0) return '00:00:00';

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="mx-auto mt-6 flex w-fit flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 px-8 py-4 shadow-lg shadow-red-500/5">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-red-300">
        <Timer className="h-4 w-4" />
        {label}
      </span>
      <span className="font-mono text-4xl font-bold tracking-widest text-red-400 drop-shadow-md sm:text-5xl">
        {timeLeft}
      </span>
    </div>
  );
}

export default function Home() {
  const { locale, setLocale, messages } = useLanguage();
  const { used, limit, remaining, isLoaded, increment } = useTokenLimit();
  const [mode, setMode] = useState<'text-to-image' | 'image-to-image'>('text-to-image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
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
      formData.append('locale', locale);

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
        meta?: { width: number; height: number; steps: number };
      };

      if (!response.ok) {
        if (data.code === 'RATE_LIMITED') {
          setShowRateLimitModal(true);
          return;
        }

        const reference = data.requestId
          ? ` (${messages.errors.referenceLabel}: ${data.requestId})`
          : '';
        throw new Error(`${data.error || messages.errors.imageGenerationFailed}${reference}`);
      }

      const imageUrl = data.dataUrl || (data.image ? toImageDataUrl(data.image) : '');
      if (!imageUrl) {
        throw new Error(messages.errors.apiResponseMissingImage);
      }

      setGeneratedImages((previous) => [imageUrl, ...previous].slice(0, 24));

      const usedWidth = data.meta?.width || width;
      const usedHeight = data.meta?.height || height;
      const usedSteps = data.meta?.steps || settings.steps;
      increment(estimateNeuronCost(usedWidth, usedHeight, usedSteps));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : messages.errors.imageGenerationFailed;
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
            <div className="flex min-w-0 flex-col sm:flex-row items-start sm:items-center gap-4">
              <img
                src="/logo_imaginex.svg"
                alt={messages.app.logoAlt}
                className="block h-16 w-auto max-w-[240px] select-none sm:h-24 sm:max-w-[320px]"
                draggable={false}
              />
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white sm:text-2xl">{messages.app.title}</h1>
                <p className="mt-1.5 text-sm text-slate-500 whitespace-pre-wrap leading-snug">{messages.app.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <div className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/30 p-1">
                  <button
                    type="button"
                    onClick={() => handleModeChange('text-to-image')}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${mode === 'text-to-image'
                      ? 'bg-brand-gradient text-white shadow-lg shadow-primary/20'
                      : 'text-slate-300 hover:text-white'
                      }`}
                  >
                    {messages.app.textToImage}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('image-to-image')}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${mode === 'image-to-image'
                      ? 'bg-brand-gradient text-white shadow-lg shadow-primary/20'
                      : 'text-slate-300 hover:text-white'
                      }`}
                  >
                    {messages.app.imageToImage}
                  </button>
                </div>

                {isLoaded && (
                  <div
                    className="flex flex-col justify-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-800/30 px-3 py-1.5 shadow-sm"
                    title={`${messages.app.tokenLimit}: ${used}/${limit}`}
                  >
                    <div className="flex items-center justify-between gap-4 text-xs font-medium">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Zap className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {messages.app.tokens}
                      </span>
                      <span className={remaining < 100 ? 'font-bold text-red-400' : 'text-slate-300'}>
                        {Math.floor(used).toLocaleString()} / {limit.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={Math.min(100, Math.max(0, (used / limit) * 100))} className="h-1 w-full min-w-[100px] bg-slate-700/50" />
                  </div>
                )}

                <div className="flex items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-800/30 p-1">
                  {(['vi', 'en'] as const).map((nextLocale) => (
                    <button
                      key={nextLocale}
                      type="button"
                      onClick={() => setLocale(nextLocale)}
                      className={`rounded-md px-3 py-2 text-xs font-semibold transition-all ${locale === nextLocale
                        ? 'bg-brand-gradient text-white shadow-lg shadow-primary/20'
                        : 'text-slate-300 hover:text-white'
                        }`}
                    >
                      {nextLocale.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400">{messages.app.sessionGallery(generatedImages.length)}</p>
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
              onRateLimit={() => setShowRateLimitModal(true)}
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
          <span>{messages.app.footer}</span>
        </footer>
      </div>

      <Dialog open={showRateLimitModal} onOpenChange={setShowRateLimitModal}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl border-slate-700 bg-slate-900 p-8 shadow-2xl shadow-black">
          <DialogHeader className="gap-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-2">
              <Clock className="h-8 w-8 text-red-400" />
            </div>
            <DialogTitle className="text-center text-2xl text-white">
              {messages.app.rateLimitTitle || 'Daily Limit Reached'}
            </DialogTitle>
            <DialogDescription className="text-center text-base leading-relaxed text-slate-300">
              {messages.app.rateLimitDescription || "You have used up your daily free allocation. Please wait for the daily reset."}
            </DialogDescription>
            <div className="mt-2">
              <CountdownTimer label={messages.app.resetTimerLabel || "Time until UTC 00:00 reset"} />
            </div>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-8">
                {messages.imageCanvas.close || 'Close'}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
