import React from 'react';
import { Sparkles, BrainCircuit, Code2 } from 'lucide-react';
import { ModelVariant } from '../types';

interface ModelSelectorProps {
  selectedModel: ModelVariant;
  onSelectModel: (variant: ModelVariant) => void;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
  className = '',
}) => {
  const models: Array<{
    id: ModelVariant;
    title: string;
    badge: string;
    icon: (isActive: boolean) => React.ReactNode;
  }> = [
    {
      id: 'standard',
      title: 'Luna',
      badge: 'Umum',
      icon: (active) => (
        <Sparkles className={`h-3.5 w-3.5 ${active ? 'text-violet-400' : 'text-neutral-400'}`} />
      ),
    },
    {
      id: 'pro',
      title: 'Luna Pro',
      badge: 'Analisis',
      icon: (active) => (
        <BrainCircuit className={`h-3.5 w-3.5 ${active ? 'text-purple-400' : 'text-neutral-400'}`} />
      ),
    },
    {
      id: 'coder',
      title: 'Luna Coder',
      badge: 'Koding',
      icon: (active) => (
        <Code2 className={`h-3.5 w-3.5 ${active ? 'text-emerald-400' : 'text-neutral-400'}`} />
      ),
    },
  ];

  return (
    <div className={`flex items-center gap-1 p-1 rounded-2xl bg-[#1a1b1d] border border-neutral-800 shadow-sm ${className}`}>
      {models.map((item) => {
        const isSelected = item.id === selectedModel;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectModel(item.id)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition-all cursor-pointer select-none active:scale-95 ${
              isSelected
                ? 'bg-[#221f2d] text-white font-semibold shadow-sm border border-neutral-700/80 ring-1 ring-white/5'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#1c1a24]'
            }`}
            title={`Pilih mode ${item.title} (${item.badge})`}
          >
            {item.icon(isSelected)}
            <span>{item.title}</span>
            <span
              className={`hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded-md ${
                isSelected
                  ? 'bg-neutral-800 text-neutral-300'
                  : 'text-neutral-500'
              }`}
            >
              {item.badge}
            </span>
          </button>
        );
      })}
    </div>
  );
};
