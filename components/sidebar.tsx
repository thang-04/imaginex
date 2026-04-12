'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Copyright } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  generatedImages: string[];
  isCollapsed?: boolean;
  onToggleVisibility?: () => void;
  onClearHistory?: () => void;
}

export default function Sidebar({
  generatedImages,
  isCollapsed = false,
  onToggleVisibility,
  onClearHistory,
}: SidebarProps) {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (generatedImages.length === 0) {
      setActiveImage(null);
      return;
    }

    if (!activeImage || !generatedImages.includes(activeImage)) {
      setActiveImage(generatedImages[0]);
    }
  }, [activeImage, generatedImages]);

  return (
    <div
      className={`${isCollapsed ? 'w-12' : 'w-64'} bg-gradient-to-b from-slate-950 to-slate-900 border-r border-slate-800 shrink-0 flex flex-col overflow-hidden transition-[width] duration-200 ease-out`}
    >
      {/* Sidebar Header */}
      <div className={`${isCollapsed ? 'p-2' : 'p-6'} border-b border-slate-800`}>
        {isCollapsed ? (
          <button
            type="button"
            onClick={onToggleVisibility}
            aria-label="Show history sidebar"
            className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700/60 bg-slate-800/50 text-slate-300 transition-colors hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Generation</h2>
              <p className="text-xs text-slate-500">History</p>
            </div>
            <button
              type="button"
              onClick={onToggleVisibility}
              aria-label="Hide history sidebar"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-700/60 bg-slate-800/50 text-slate-300 transition-colors hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {isCollapsed ? (
        <div className="flex-1" />
      ) : (
        <>
          {/* Images History - Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-3 p-4">
            {generatedImages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-lg bg-slate-800/50 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs text-slate-400">No images generated yet</p>
              </div>
            ) : (
              generatedImages.map((image, index) => (
                <div
                  key={index}
                  className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                    activeImage === image ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
                  }`}
                  onClick={() => setActiveImage(image)}
                >
                  <div className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`Generation ${index + 1}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-all" />
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 gap-1">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="flex-1 rounded-md py-1 text-xs font-medium"
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveImage(image);
                      }}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                      Use
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-slate-800 p-4 bg-slate-950/50">
            <Button
              type="button"
              variant="secondary"
              className="w-full rounded-lg text-sm font-medium"
              onClick={onClearHistory}
              disabled={generatedImages.length === 0}
            >
              Clear History
            </Button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] leading-none whitespace-nowrap text-slate-500">
              <Copyright className="h-3 w-3" />
              <span>{'Built by Nguy\u1ec5n Duy Th\u1eafng'}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
