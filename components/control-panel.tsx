'use client';

import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ACTION_PRESETS,
  LOCKED_STEPS,
  SIZE_PRESETS,
  STYLE_PRESETS,
  type GenerationAction,
  type GenerationSettings,
} from '@/lib/image-generation';

interface ControlPanelProps {
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
  onReset: () => void;
  mode: 'text-to-image' | 'image-to-image';
}

const IMAGE_REQUIRED_ACTIONS: GenerationAction[] = ['transform', 'background-replace'];

function isImageRequiredAction(action: GenerationAction): boolean {
  return IMAGE_REQUIRED_ACTIONS.includes(action);
}

function Field({
  label,
  children,
  description,
}: {
  label: string;
  children: ReactNode;
  description?: string;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">{label}</p>
      {children}
      {description ? <p className="text-xs leading-5 text-slate-400">{description}</p> : null}
    </div>
  );
}

export default function ControlPanel({
  settings,
  onSettingsChange,
  onReset,
  mode,
}: ControlPanelProps) {
  const { messages } = useLanguage();

  const handleChange = <K extends keyof GenerationSettings>(
    key: K,
    value: GenerationSettings[K],
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-4 xl:sticky xl:top-6">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/45 p-5 backdrop-blur-xl">
        <h2 className="text-sm font-semibold text-white">{messages.controlPanel.quickSetup}</h2>
        <p className="mt-1 text-xs text-slate-400">{messages.controlPanel.quickSetupDescription}</p>

        <div className="mt-5 space-y-5">
          <Field
            label={messages.controlPanel.action}
            description={messages.presets.actions[settings.action].description}
          >
            <Select
              value={settings.action}
              onValueChange={(value) => handleChange('action', value as GenerationAction)}
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-700 bg-slate-900/70 px-3 text-left text-sm text-slate-100">
                <SelectValue placeholder={messages.controlPanel.selectAction} />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                {ACTION_PRESETS.map((action) => {
                  const disabled = mode === 'text-to-image' && isImageRequiredAction(action.value);

                  return (
                    <SelectItem
                      key={action.value}
                      value={action.value}
                      disabled={disabled}
                      className="rounded-md text-sm"
                    >
                      {messages.presets.actions[action.value].label}
                      {disabled ? ` (${messages.controlPanel.requiresImageSuffix})` : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label={messages.controlPanel.style}
            description={messages.presets.styles[settings.style].description}
          >
            <Select
              value={settings.style}
              onValueChange={(value) =>
                handleChange('style', value as GenerationSettings['style'])
              }
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-700 bg-slate-900/70 px-3 text-left text-sm text-slate-100">
                <SelectValue placeholder={messages.controlPanel.selectStyle} />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                {STYLE_PRESETS.map((style) => (
                  <SelectItem key={style.value} value={style.value} className="rounded-md text-sm">
                    {messages.presets.styles[style.value].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label={messages.controlPanel.outputSize}>
            <Select
              value={settings.imageSize}
              onValueChange={(value) =>
                handleChange('imageSize', value as GenerationSettings['imageSize'])
              }
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-700 bg-slate-900/70 px-3 text-left text-sm text-slate-100">
                <SelectValue placeholder={messages.controlPanel.selectSize} />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                {SIZE_PRESETS.map((size) => (
                  <SelectItem key={size.value} value={size.value} className="rounded-md text-sm">
                    {messages.presets.sizes[size.value].label} ({size.value})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/45 p-5 backdrop-blur-xl">
        <h3 className="text-sm font-semibold text-white">{messages.controlPanel.advanced}</h3>

        <div className="mt-4 space-y-5">
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/55 p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                {messages.controlPanel.steps}
              </p>
              <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                {LOCKED_STEPS}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              {messages.controlPanel.fixedStepsDescription}
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                {messages.controlPanel.guidance}
              </p>
              <span className="text-xs font-semibold text-slate-100">
                {settings.guidance.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={settings.guidance}
              onChange={(event) => handleChange('guidance', Number.parseFloat(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-primary"
            />
            <p className="text-xs leading-5 text-slate-400">
              {messages.controlPanel.guidanceDescription}
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
              {messages.controlPanel.seed}
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={settings.seed}
                onChange={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10);
                  handleChange('seed', Number.isFinite(parsed) ? parsed : -1);
                }}
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none transition-colors focus:border-primary"
                placeholder={messages.controlPanel.seedPlaceholder}
              />
              <button
                type="button"
                onClick={() => handleChange('seed', Math.floor(Math.random() * 1000000))}
                className="h-11 rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-800"
              >
                {messages.controlPanel.random}
              </button>
            </div>
            <p className="text-xs leading-5 text-slate-400">{messages.controlPanel.seedDescription}</p>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={onReset}
        className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-800"
      >
        {messages.controlPanel.resetAllSettings}
      </Button>
    </div>
  );
}
