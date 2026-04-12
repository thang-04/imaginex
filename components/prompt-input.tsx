'use client';

import { DragEvent, useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-provider';
import { type GenerationAction, type GenerationStyle } from '@/lib/image-generation';

interface PromptInputProps {
  onGenerate: (payload: {
    prompt: string;
    inputImageFile?: File | null;
  }) => Promise<void> | void;
  isGenerating: boolean;
  mode: 'text-to-image' | 'image-to-image';
  promptContext: {
    action: GenerationAction;
    style: GenerationStyle;
  };
}

type RewritePromptResponse = {
  prompt?: string;
  error?: string;
};

export default function PromptInput({
  onGenerate,
  isGenerating,
  mode,
  promptContext,
}: PromptInputProps) {
  const { locale, messages } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (mode === 'text-to-image') {
      setSelectedFile(null);
    }
  }, [mode]);

  const handleDrag = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const files = event.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleGenerate = async () => {
    if (mode === 'text-to-image' && !prompt.trim()) {
      return;
    }

    if (mode === 'image-to-image' && !selectedFile) {
      return;
    }

    await onGenerate({
      prompt,
      inputImageFile: mode === 'image-to-image' ? selectedFile : undefined,
    });
  };

  const handleEnhancePrompt = async () => {
    const currentPrompt = prompt.trim();
    if (!currentPrompt) {
      return;
    }

    setPromptError(null);
    setIsEnhancingPrompt(true);

    try {
      const response = await fetch('/api/rewrite-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          mode,
          action: promptContext.action,
          style: promptContext.style,
          locale,
        }),
      });

      const data = (await response.json()) as RewritePromptResponse;

      if (!response.ok) {
        throw new Error(data.error || messages.errors.promptRewriteFailed);
      }

      const rewrittenPrompt = data.prompt?.trim();
      if (!rewrittenPrompt) {
        throw new Error(messages.errors.promptRewriteMissingContent);
      }

      setPrompt(rewrittenPrompt);
      requestAnimationFrame(() => {
        promptInputRef.current?.focus();
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : messages.errors.promptRewriteFailed;
      setPromptError(message);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const renderPromptToolbar = () => (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {messages.promptInput.promptLabel}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">{messages.promptInput.promptHint}</p>
      </div>
      <button
        type="button"
        onClick={() => void handleEnhancePrompt()}
        disabled={isGenerating || isEnhancingPrompt || !prompt.trim()}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {isEnhancingPrompt ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-500 border-t-white" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {isEnhancingPrompt
          ? messages.promptInput.enhancingPrompt
          : messages.promptInput.enhancePrompt}
      </button>
    </div>
  );

  const renderPromptError = () =>
    promptError ? <p className="mt-2 text-xs text-amber-300">{promptError}</p> : null;

  return (
    <div className="w-full">
      {mode === 'text-to-image' ? (
        <div className="space-y-4">
          <div className="group relative">
            <div className="absolute inset-0 rounded-2xl bg-brand-gradient opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
            <div className="relative rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-xl transition-colors hover:border-slate-600/50">
              {renderPromptToolbar()}
              <textarea
                ref={promptInputRef}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={messages.promptInput.textPlaceholder}
                className="w-full resize-none bg-transparent text-base leading-relaxed text-white placeholder-slate-500 focus:outline-none"
                rows={5}
              />
              {renderPromptError()}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isGenerating || isEnhancingPrompt || !prompt.trim()}
              className="group relative overflow-hidden rounded-xl px-8 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="absolute inset-0 animate-pulse rounded-xl bg-brand-gradient" />
              <div className="absolute inset-0.5 rounded-xl bg-brand-gradient opacity-90 transition-all" />
              <div className="absolute inset-0 rounded-xl bg-brand-gradient opacity-0 blur transition-opacity group-hover:opacity-20" />

              <div className="relative flex items-center justify-center gap-2">
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>{messages.promptInput.generating}</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z" />
                    </svg>
                    <span>{messages.promptInput.generateImage}</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative rounded-2xl border-2 border-dashed transition-all ${
              dragActive
                ? 'border-primary bg-primary/10'
                : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
            }`}
          >
            <div className="absolute inset-0 rounded-2xl bg-brand-gradient opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
            <div className="relative flex cursor-pointer flex-col items-center justify-center p-6">
              {previewUrl ? (
                <div className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-700 bg-slate-900/70">
                  <img
                    src={previewUrl}
                    alt={messages.promptInput.selectedUploadPreviewAlt}
                    className="h-48 w-full object-cover"
                  />
                </div>
              ) : (
                <>
                  <svg
                    className="mb-3 h-12 w-12 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <h3 className="mb-1 font-semibold text-white">{messages.promptInput.uploadTitle}</h3>
                  <p className="text-sm text-slate-400">{messages.promptInput.uploadHint}</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange={(event) => event.target.files && setSelectedFile(event.target.files[0])}
                className="hidden"
              />
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={(event) => {
                    event.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="rounded-lg"
                >
                  {messages.promptInput.browseFiles}
                </Button>
                {selectedFile ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="rounded-lg text-slate-300"
                  >
                    {messages.promptInput.clearFile}
                  </Button>
                ) : null}
              </div>
              {selectedFile ? (
                <p className="mt-3 text-xs text-slate-400">{selectedFile.name}</p>
              ) : (
                <p className="mt-3 text-xs text-slate-500">{messages.promptInput.bestResultsHint}</p>
              )}
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 rounded-2xl bg-brand-gradient opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
            <div className="relative rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 backdrop-blur-xl transition-colors hover:border-slate-600/50">
              {renderPromptToolbar()}
              <textarea
                ref={promptInputRef}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={messages.promptInput.imagePlaceholder}
                className="w-full resize-none bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                rows={3}
              />
              {renderPromptError()}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isGenerating || isEnhancingPrompt || !selectedFile}
              className="group relative overflow-hidden rounded-xl px-8 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="absolute inset-0 animate-pulse rounded-xl bg-brand-gradient" />
              <div className="absolute inset-0.5 rounded-xl bg-brand-gradient opacity-90 transition-all" />
              <div className="absolute inset-0 rounded-xl bg-brand-gradient opacity-0 blur transition-opacity group-hover:opacity-20" />
              <div className="relative flex items-center justify-center gap-2">
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>{messages.promptInput.generating}</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z" />
                    </svg>
                    <span>
                      {selectedFile
                        ? messages.promptInput.generateImage
                        : messages.promptInput.uploadImageFirst}
                    </span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
