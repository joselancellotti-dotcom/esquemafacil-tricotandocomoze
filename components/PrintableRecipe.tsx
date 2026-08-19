import React from 'react';
import type { AppResult, RecipePart, CalculationSummary } from '../types';
import { SUMMARY_LABELS, getVisibleSummaryEntries } from '../types';
import { PieceContourCard } from './PieceContourCard';

interface PrintableRecipeProps {
  result: AppResult;
  size: string;
  armholeType?: string;
}

const formatDescription = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="text-slate-900 font-bold bg-slate-100 px-1 rounded">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const PrintablePart: React.FC<{ part: RecipePart }> = ({ part }) => (
  <div className="mt-6 break-inside-avoid border-t-2 border-slate-800 pt-4">
    <h3 className="text-xl font-bold mb-4 text-center uppercase tracking-wider text-slate-900 bg-slate-100 py-1.5 rounded">{part.title}</h3>
    <div className="space-y-4">
      {part.steps.map((step, index) => (
        <div key={index} className="p-4 bg-slate-50/80 rounded-xl border border-slate-300 break-inside-avoid">
          <h4 className="font-bold text-slate-900 text-base mb-1.5 border-b border-slate-200 pb-1">{step.title}</h4>
          <p className="text-sm text-slate-800 mb-3 leading-relaxed">{formatDescription(step.description)}</p>
          {step.shaping && (
            <div className="mt-2 pl-3 border-l-2 border-slate-800 py-1 bg-white p-3 rounded border border-slate-200">
              <ul className="list-none space-y-1.5 text-xs font-mono text-slate-900">
                {step.shaping.instructions.map((inst, i) => (
                  <li key={i} className={inst.trim() === "" ? "h-2" : ""}>
                    {formatDescription(inst)}
                  </li>
                ))}
              </ul>
              {step.shaping.notes && <p className="text-[11px] mt-2 text-slate-600 italic border-t border-slate-150 pt-1">{step.shaping.notes}</p>}
            </div>
          )}
          {step.technicalDetails && step.technicalDetails.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-200/80 flex flex-wrap gap-x-4 gap-y-1">
              {step.technicalDetails
                .filter(detail => !detail.includes('Base de Cálculo (Apenas Visualização)'))
                .map((detail, i) => (
                  <span key={i} className="text-[11px] text-slate-700 font-mono tracking-tight bg-white px-2 py-0.5 rounded border border-slate-200">{formatDescription(detail)}</span>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

export const PrintableRecipe: React.FC<PrintableRecipeProps> = ({ result, size, armholeType }) => {
  const currentArmholeType = armholeType || result.summary?.armholeType || 'Cava Raglan';
  const title = result.context.pieceName ? `Sua Receita de ${result.context.pieceName}` : (currentArmholeType === 'Cava Redonda' ? 'Sua Receita com Cava Redonda' : 'Sua Receita com Cava Raglan');

  return (
    <div className="bg-white text-slate-900 p-10 font-sans w-full min-h-screen">
      <div className="pdf-section">
        <header className="text-center mb-10 border-b-2 border-slate-200 pb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 text-slate-900">{title}</h1>
          {result.context.pieceName ? (
               <p className="text-2xl text-slate-600 font-light">{result.context.pieceName} — Tamanho {size}</p>
          ) : (
               <p className="text-2xl text-slate-600 font-light">Tamanho: {size}</p>
          )}
        </header>
        
        <section className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-300">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-6 border-b-2 border-slate-800 pb-2 text-center bg-slate-100 py-1.5 rounded">Configurações da Amostra</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-center">
            <div>
              <span className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Amostra (10x10)</span>
              <span className="text-lg font-semibold text-slate-900">{result.context.swatch}</span>
            </div>
            <div>
              <span className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Regulagem Principal</span>
              <span className="text-lg font-semibold text-slate-900">{result.context.gauge || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Fio</span>
              <span className="text-lg font-semibold truncate px-2 text-slate-900">{result.context.yarn || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-slate-500 uppercase text-[10px] font-bold mb-1">Máquina</span>
              <span className="text-lg font-semibold text-slate-900">
                  {result.context.machineBrand ? `${result.context.machineBrand} ` : ''}
                  {result.context.machineModel || 'N/A'}
              </span>
            </div>
          </div>
          {result.context.barSwatch && (
            <div className="mt-4 pt-4 border-t border-slate-150 text-center text-sm">
              <span className="text-slate-500 uppercase text-[10px] font-bold mr-2">Amostra da Barra:</span>
              <span className="font-semibold text-slate-900">{result.context.barSwatch}</span>
            </div>
          )}
          {result.context.buttonBandSwatch && (
            <div className="mt-4 pt-4 border-t border-slate-150 text-center text-sm">
              <span className="text-slate-500 uppercase text-[10px] font-bold mr-2">Amostra da Tira:</span>
              <span className="font-semibold text-slate-900">{result.context.buttonBandSwatch}</span>
            </div>
          )}
          {result.context.finishingSwatch && (
            <div className="mt-4 pt-4 border-t border-slate-150 text-center text-sm">
              <span className="text-slate-500 uppercase text-[10px] font-bold mr-2">Amostra do Acabamento:</span>
              <span className="font-semibold text-slate-900">{result.context.finishingSwatch}</span>
            </div>
          )}
        </section>
      </div>

      <main className="space-y-12">
        {result.recipeParts.map((part, index) => (
          <div key={index} className="pdf-section pt-4">
            <PrintablePart part={part} />
          </div>
        ))}
      </main>
        
      <div className="pdf-section w-full pb-10">
          {result.summary && (
            <div className="mt-12 pt-8 border-t-2 border-slate-200">
              <h4 className="text-center font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-800 pb-2 mb-6 bg-slate-100 py-1.5 rounded">Resumo de Carreiras, Pontos e Perímetros</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 max-w-4xl mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-300">
                  {getVisibleSummaryEntries(result.summary).map(({ key, label, value }) => (
                      <div key={key} className="flex justify-between items-center border-b border-slate-200 py-1.5 text-xs font-mono">
                          <span className="text-slate-700">{label}:</span>
                          <span className="text-slate-900 font-bold text-sm bg-white px-2 py-0.5 rounded border border-slate-200">{value.toString()}</span>
                      </div>
                  ))}
              </div>
            </div>
          )}
          
          {result.summary && (
            <div className="bg-white text-slate-900 mt-10">
              <PieceContourCard summary={result.summary} pieceName={result.context.pieceName} isPrint={true} />
            </div>
          )}

          <footer className="text-center text-[10px] text-slate-400 mt-16 pt-6 border-t border-slate-200 uppercase tracking-widest">
            <p>Gerado por Tricotando com o Zé — Tecnologia Esquema Fácil</p>
          </footer>
      </div>
    </div>
  );
};