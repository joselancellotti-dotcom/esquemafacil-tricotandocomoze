
import React from 'react';
import type { AppResult, RecipePart, CalculationSummary, FormData } from '../types';
import { SUMMARY_LABELS, getVisibleSummaryEntries } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { PieceContourCard } from './PieceContourCard';

interface ResultCardProps {
  result: Record<string, AppResult> | null;
  error: string | null;
  formData: FormData;
  sizes: readonly string[];
  activeTab: string | null;
  onTabChange: (size: string) => void;
  onPrint: (mode: 'current' | 'all' | 'table') => void;
  onSaveTXT: (size: string) => void;
  armholeType?: string;
}

const formatDescription = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="text-amber-400 font-bold">{part.slice(2, -2)}</strong>;
        return part;
    });
};

const RecipePartDisplay: React.FC<{ part: RecipePart }> = ({ part }) => (
  <div className="border-t border-emerald-900/40 pt-6">
    <h3 className="text-xl font-bold text-center mb-4 font-display text-emerald-100 tracking-wide uppercase text-sm border-l-4 border-amber-500 pl-2 inline-block mx-auto">{part.title}</h3>
    <div className="space-y-4">
      {part.steps.map((step, index) => (
        <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/5">
          <h4 className="font-bold text-amber-100 text-base mb-1.5 font-display">{step.title}</h4>
          <p className="text-sm text-emerald-50/90 font-medium leading-relaxed mb-3">{formatDescription(step.description)}</p>
          {step.shaping && (
            <div className="mt-2 pl-3 border-l-2 border-amber-400/60">
              <ul className="list-none space-y-1.5 text-sm text-emerald-50/80 font-medium">
                {step.shaping.instructions.map((inst, i) => (
                  <li key={i} className={inst.trim() === "" ? "h-2" : ""}>
                    {formatDescription(inst)}
                  </li>
                ))}
              </ul>
              {step.shaping.notes && <p className="text-xs mt-2 text-amber-200/80 italic font-medium">{step.shaping.notes}</p>}
            </div>
          )}
          {step.technicalDetails && step.technicalDetails.length > 0 && (
            <div className="mt-3 pt-2 border-t border-white/5 space-y-0.5">
              {step.technicalDetails.map((detail, i) => (
                <p key={i} className="text-[11px] text-emerald-100/70 leading-relaxed font-mono">{formatDescription(detail)}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

export const ResultCard: React.FC<ResultCardProps> = ({ result, error, formData, sizes, activeTab, onTabChange, onPrint, onSaveTXT, armholeType }) => {
  const availableSizes = result ? Object.keys(result) : [];
  const hasResult = availableSizes.length > 0;
  const activeResult = result && activeTab ? result[activeTab] : null;

  const title = formData.pieceName ? `Sua Receita de ${formData.pieceName}` : (armholeType === 'Cava Redonda' ? 'Sua Receita com Cava Redonda' : 'Sua Receita com Cava Raglan');

  return (
    <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 rounded-2xl shadow-xl min-h-[250px] flex flex-col justify-center border border-emerald-900/50">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
          <h2 className="text-2xl font-bold font-display text-emerald-100 tracking-tight">{title}</h2>
          {hasResult && (
            <div className="flex flex-wrap gap-2 justify-end">
                <button onClick={() => onPrint('table')} className="flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-wider font-bold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">PDF Tabela</button>
                <button onClick={() => onPrint('all')} className="flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-wider font-bold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">PDF Todos</button>
                <button onClick={() => onPrint('current')} className="flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-wider font-bold rounded-lg bg-white/15 hover:bg-white/20 transition-colors">PDF (Este)</button>
                {activeTab && <button onClick={() => onSaveTXT(activeTab)} className="flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-wider font-black rounded-lg bg-amber-500 hover:bg-amber-600 text-emerald-950 transition-colors">TXT (Este)</button>}
            </div>
          )}
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm font-semibold mb-4">{error}</div>}
      {hasResult && activeResult && (
        <div className="animate-fade-in space-y-6">
          <div className="flex flex-wrap justify-center gap-2 mb-2 bg-emerald-900/20 p-1.5 rounded-xl border border-emerald-800/10">
            {availableSizes.map(size => {
              if (size.includes(' - ')) {
                const [name, rawDesc] = size.split(' - ');
                const desc = rawDesc.replace(/[˜~]/g, ' a ').replace(/\s+/g, ' ').trim();
                return (
                  <button
                    key={size}
                    onClick={() => onTabChange(size)}
                    className={`px-3 py-1.5 rounded-lg transition-all text-center flex flex-col items-center justify-center ${activeTab === size ? 'bg-amber-500 text-emerald-950 shadow-md font-black' : 'text-emerald-100 hover:bg-white/5 font-semibold'}`}
                  >
                    <span className="text-xs font-black uppercase tracking-wider">{name}</span>
                    <span className="text-[10px] opacity-80 whitespace-nowrap font-medium leading-none mt-0.5">{desc}</span>
                  </button>
                );
              }
              return (
                <button key={size} onClick={() => onTabChange(size)} className={`px-4 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-wider ${activeTab === size ? 'bg-amber-500 text-emerald-950 shadow-md' : 'text-emerald-100 hover:bg-white/5'}`}>{size}</button>
              );
            })}
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center p-4 bg-emerald-950/40 border border-emerald-900/30 rounded-xl text-xs font-bold font-mono">
                <div><span className="text-emerald-200/70 block font-sans font-bold uppercase tracking-widest text-[9px] mb-1">Amostra</span>{activeResult.context.swatch}</div>
                <div><span className="text-emerald-200/70 block font-sans font-bold uppercase tracking-widest text-[9px] mb-1">Regulagem</span>{activeResult.context.gauge || 'N/A'}</div>
                <div><span className="text-emerald-200/70 block font-sans font-bold uppercase tracking-widest text-[9px] mb-1">Fio</span>{activeResult.context.yarn || 'N/A'}</div>
                <div><span className="text-emerald-200/70 block font-sans font-bold uppercase tracking-widest text-[9px] mb-1">Tamanho</span>{activeTab}</div>
            </div>
            {activeResult.recipeParts.map((part, index) => <RecipePartDisplay key={index} part={part} />)}
            {activeResult.summary && (
              <div className="border-t border-emerald-900/40 pt-6">
                <h4 className="text-center font-bold font-display text-emerald-100 mb-4 uppercase tracking-wider text-xs">Resumo de Carreiras, Pontos e Perímetros</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-white/5 p-4 rounded-xl border border-white/5">
                    {getVisibleSummaryEntries(activeResult.summary).map(({ key, label, value }) => (
                        <div key={key} className="flex justify-between border-b border-emerald-900/20 pb-1.5">
                            <span className="text-emerald-100/70 font-sans">{label}:</span>
                            <span className="text-amber-400 font-bold">{value.toString()}</span>
                        </div>
                    ))}
                </div>
              </div>
            )}
            {activeResult.summary && (
              <PieceContourCard 
                summary={activeResult.summary} 
                pieceName={formData.pieceName} 
                availableSizes={availableSizes}
                activeSize={activeTab}
                onSizeChange={onTabChange}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
