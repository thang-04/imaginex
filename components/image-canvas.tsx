'use client';

import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/components/language-provider';

interface ImageCanvasProps {
  generatedImages: string[];
  isGenerating: boolean;
  mode: 'text-to-image' | 'image-to-image';
  onClearHistory?: () => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

function getDownloadName(index: number): string {
  return `generated-image-${index + 1}.png`;
}

function clampZoom(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, rounded));
}

export default function ImageCanvas({
  generatedImages,
  isGenerating,
  mode,
  onClearHistory,
}: ImageCanvasProps) {
  const { messages } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const selectedImage = generatedImages[selectedIndex];
  const lightboxImage = lightboxIndex === null ? null : generatedImages[lightboxIndex];

  useEffect(() => {
    if (generatedImages.length === 0) {
      setSelectedIndex(0);
      setLightboxIndex(null);
      return;
    }

    if (selectedIndex > generatedImages.length - 1) {
      setSelectedIndex(0);
    }

    if (lightboxIndex !== null && lightboxIndex > generatedImages.length - 1) {
      setLightboxIndex(0);
    }
  }, [generatedImages, lightboxIndex, selectedIndex]);

  useEffect(() => {
    if (generatedImages[0]) {
      setSelectedIndex(0);
    }
  }, [generatedImages]);

  useEffect(() => {
    if (lightboxZoom <= 1 && (lightboxPan.x !== 0 || lightboxPan.y !== 0)) {
      setLightboxPan({ x: 0, y: 0 });
    }
  }, [lightboxPan.x, lightboxPan.y, lightboxZoom]);

  const handleDownload = async (image: string, index: number) => {
    if (!image) {
      return;
    }

    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = objectUrl;
      link.download = getDownloadName(index);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);
    } catch (error) {
      console.error('Failed to download image', error);
    }
  };

  const resetLightboxView = () => {
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setIsDragging(false);
    dragStateRef.current = null;
  };

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxIndex(index);
    resetLightboxView();
  };

  const adjustZoom = (delta: number) => {
    setLightboxZoom((current) => clampZoom(current + delta));
  };

  const clearDragState = () => {
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lightboxZoom <= 1) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: lightboxPan.x,
      originY: lightboxPan.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    setLightboxPan({
      x: dragState.originX + deltaX,
      y: dragState.originY + deltaY,
    });
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    clearDragState();
  };

  const moveLightbox = (direction: 'prev' | 'next') => {
    if (lightboxIndex === null || generatedImages.length <= 1) {
      return;
    }

    const nextIndex =
      direction === 'next'
        ? (lightboxIndex + 1) % generatedImages.length
        : (lightboxIndex - 1 + generatedImages.length) % generatedImages.length;

    setLightboxIndex(nextIndex);
    setSelectedIndex(nextIndex);
    resetLightboxView();
  };

  if (generatedImages.length === 0) {
    return (
      <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/45 p-10 backdrop-blur-xl">
        <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
          {isGenerating ? (
            <>
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-primary" />
              <h3 className="mt-5 text-lg font-semibold text-white">{messages.imageCanvas.generatingTitle}</h3>
              <p className="mt-2 text-sm text-slate-400">{messages.imageCanvas.generatingHint}</p>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-primary">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{messages.imageCanvas.emptyTitle}</h3>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                {mode === 'text-to-image'
                  ? messages.imageCanvas.emptyHintTextToImage
                  : messages.imageCanvas.emptyHintImageToImage}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-700/50 bg-slate-900/45 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            {messages.imageCanvas.livePreview}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {messages.imageCanvas.sessionImages(generatedImages.length)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleDownload(selectedImage, selectedIndex)}
            className="rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700"
          >
            {messages.imageCanvas.download}
          </button>
          {onClearHistory ? (
            <button
              type="button"
              onClick={onClearHistory}
              className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
            >
              {messages.imageCanvas.clearGallery}
            </button>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => openLightbox(selectedIndex)}
        className="group relative block w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/55 text-left transition-colors hover:border-slate-500"
      >
        <div className="aspect-[16/10] min-h-[380px] w-full md:min-h-[460px]">
          <img
            src={selectedImage}
            alt={messages.imageCanvas.generatedPreviewAlt(selectedIndex)}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="absolute right-3 top-3 rounded-md bg-black/60 px-2.5 py-1 text-xs text-slate-200">
          {messages.imageCanvas.clickToPreview}
        </div>
        {isGenerating ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-100">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-primary" />
              {messages.imageCanvas.generatingNextVariation}
            </div>
          </div>
        ) : null}
      </button>

      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/45 p-4 backdrop-blur-xl">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {messages.imageCanvas.gallery}
        </h4>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {generatedImages.map((image, index) => (
            <button
              key={`${image.slice(0, 48)}-${index}`}
              type="button"
              onClick={() => openLightbox(index)}
              className={`group relative overflow-hidden rounded-xl border transition-all ${
                selectedIndex === index
                  ? 'border-primary ring-2 ring-primary/45'
                  : 'border-slate-700/70 hover:border-slate-500'
              }`}
            >
              <div className="aspect-square w-full bg-slate-900">
                <img
                  src={image}
                  alt={messages.imageCanvas.generatedImageAlt(index)}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-2 py-1 text-[11px] text-slate-200">
                <span>#{index + 1}</span>
                <span>{messages.imageCanvas.view}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLightboxIndex(null);
            resetLightboxView();
          }
        }}
      >
        <DialogContent
          className="w-[min(98vw,1800px)] max-w-[min(98vw,1800px)] border-slate-700 bg-slate-950 p-0 sm:max-w-[min(98vw,1800px)]"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{messages.imageCanvas.lightboxTitle}</DialogTitle>
          {lightboxImage ? (
            <div className="relative">
              <div
                className={`max-h-[94vh] min-h-[520px] w-full overflow-auto bg-black/80 ${
                  lightboxZoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                }`}
                onWheel={(event) => {
                  event.preventDefault();
                  const delta = event.deltaY < 0 ? 0.15 : -0.15;
                  setLightboxZoom((current) => clampZoom(current + delta));
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onLostPointerCapture={clearDragState}
                style={{ touchAction: lightboxZoom > 1 ? 'none' : 'auto' }}
              >
                <div className="grid min-h-[520px] w-full place-items-center p-6">
                  <div style={{ transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px)` }}>
                    <img
                      src={lightboxImage}
                      alt={messages.imageCanvas.lightboxPreviewAlt(lightboxIndex ?? 0)}
                      className="max-h-[88vh] max-w-full object-contain transition-transform duration-150"
                      style={{ transform: `scale(${lightboxZoom})`, transformOrigin: 'center center' }}
                      draggable={false}
                    />
                  </div>
                </div>
              </div>

              <div className="absolute left-3 top-3 rounded-md bg-black/65 px-3 py-1 text-xs text-slate-100">
                {messages.imageCanvas.imageCounter((lightboxIndex ?? 0) + 1, generatedImages.length)}
              </div>
              {lightboxZoom > 1 ? (
                <div className="absolute left-3 top-11 rounded-md bg-black/65 px-3 py-1 text-xs text-slate-100">
                  {messages.imageCanvas.dragToMove}
                </div>
              ) : null}

              <div className="absolute right-3 top-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-md bg-black/65 p-1">
                  <button
                    type="button"
                    onClick={() => adjustZoom(-0.2)}
                    disabled={lightboxZoom <= MIN_ZOOM}
                    className="rounded px-2 py-1 text-xs font-semibold text-slate-100 transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-45"
                    title={messages.imageCanvas.zoomOutTitle}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={resetLightboxView}
                    className="rounded px-2 py-1 text-xs font-semibold text-slate-100 transition-colors hover:bg-black/80"
                    title={messages.imageCanvas.resetZoomTitle}
                  >
                    {Math.round(lightboxZoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustZoom(0.2)}
                    disabled={lightboxZoom >= MAX_ZOOM}
                    className="rounded px-2 py-1 text-xs font-semibold text-slate-100 transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-45"
                    title={messages.imageCanvas.zoomInTitle}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDownload(lightboxImage, lightboxIndex ?? 0)}
                  className="rounded-md bg-black/65 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:bg-black/80"
                >
                  {messages.imageCanvas.download}
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="rounded-md bg-black/65 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:bg-black/80"
                >
                  {messages.imageCanvas.close}
                </button>
              </div>

              {generatedImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => moveLightbox('prev')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/65 p-2 text-white transition-colors hover:bg-black/80"
                    aria-label={messages.imageCanvas.previousImage}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLightbox('next')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/65 p-2 text-white transition-colors hover:bg-black/80"
                    aria-label={messages.imageCanvas.nextImage}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
