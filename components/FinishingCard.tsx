
import React from 'react';
import type { FinishingDetails } from '../types';
import { InputGroup } from '../App';
import { FinishingIcon } from './icons/FinishingIcon';

interface FinishingCardProps {
  finishing: FinishingDetails;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  isOpenPiece: boolean;
  ribbingType?: string;
  ribbingRows?: string;
}

export const FinishingCard: React.FC<FinishingCardProps> = ({ finishing, onChange, isOpenPiece, ribbingType, ribbingRows }) => {
  // Logic to change label based on ribbing type
  const isSpecialRibbing = ribbingType === '2x1' || ribbingType === '3x2';
  const swatchLabel = isSpecialRibbing 
    ? "Canaletas em 10cm (Barra da Manga)" 
    : "Pontos em 10cm (Barra da Manga)";

  return (
    <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/40 shadow-sm transition-all hover:shadow-md">
      <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-3 mb-6 pb-2 border-b border-slate-200/60 font-display">
        <span className="text-emerald-700"><FinishingIcon /></span>
        3. Acabamentos / Golas
      </h2>
      
      <div className="space-y-4">
        <div>
            <label htmlFor="finishingType" className="block mb-1 text-xs font-black text-slate-700 uppercase tracking-wider">Tipo de Construção</label>
            <select
                id="finishingType"
                name="type"
                value={finishing.type}
                onChange={onChange}
                className="bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 block w-full p-2.5 transition font-medium"
            >
                <option value="horizontal">Tira de Canelado</option>
                <option value="vertical">Canelado Vertical (Tira Separada/Costurada)</option>
                <option value="folded_bias">Ponto Meia Vies dobrado</option>
            </select>
            <p className="mt-2 text-xs text-slate-600 font-medium bg-emerald-50/30 p-2 rounded-lg border border-emerald-100/30">
                {finishing.type === 'horizontal' && "Tira de canelado tecida separadamente (comprimento definido por agulhas/canaletas)."}
                {finishing.type === 'vertical' && "Tira estreita e longa tecida verticalmente para ser costurada."}
                {finishing.type === 'folded_bias' && "Acabamento duplo em ponto meia (viés) usando a amostra da peça como padrão."}
            </p>
        </div>

        {finishing.type === 'folded_bias' && (
            <div className="sm:col-span-2">
                <InputGroup 
                    label="Largura do acabamento (cm)" 
                    name="width" 
                    value={finishing.width || ''} 
                    onChange={onChange} 
                    placeholder="Ex: 3" 
                />
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {finishing.type === 'horizontal' ? (
                 <div className="sm:col-span-2">
                    <InputGroup 
                        label={swatchLabel}
                        name="swatchStitches" 
                        value={finishing.swatchStitches} 
                        onChange={onChange} 
                        placeholder={isSpecialRibbing ? "Ex: 18" : "Ex: 28"} 
                    />
                    <p className="mt-1 text-xs text-slate-700 font-medium">
                        {isSpecialRibbing 
                            ? "Conte quantas colunas de malha (canaletas) existem em 10cm na amostra ou punho."
                            : "Use a amostra da barra da manga já tecida como referência."
                        }
                    </p>
                 </div>
            ) : (
                <>
                    <InputGroup 
                        label="Amostra Acabamento - Pontos (10cm)" 
                        name="swatchStitches" 
                        value={finishing.swatchStitches} 
                        onChange={onChange} 
                        placeholder="Ex: 30" 
                    />
                    <InputGroup 
                        label="Amostra Acabamento - Carreiras (10cm)" 
                        name="swatchRows" 
                        value={finishing.swatchRows} 
                        onChange={onChange} 
                        placeholder="Ex: 40" 
                    />
                </>
            )}
            {finishing.type === 'horizontal' && (
                <div className="sm:col-span-2">
                    <InputGroup 
                        label="Número de Carreiras da Tira (Acabamento)" 
                        name="neckRibRows" 
                        value={finishing.neckRibRows || ''} 
                        onChange={onChange}
                        placeholder={ribbingRows ? `Sugerido: ${Math.floor(parseInt(ribbingRows) / 2) + 4}` : "Ex: 24"}
                    />
                    <p className="mt-1 text-xs text-slate-700 font-medium italic">
                        * Geralmente resulta no valor de metade das carreiras da barra + 4 (Aprox. 3 a 3.5cm).
                    </p>
                </div>
            )}
            {finishing.type === 'folded_bias' && (
                <p className="sm:col-span-2 text-[11px] text-amber-800 font-bold bg-amber-50/70 p-2.5 rounded-lg border border-amber-100/50">
                    * Se os campos de amostra acima ficarem vazios, será utilizada a amostra principal da peça.
                </p>
            )}
        </div>
      </div>
    </div>
  );
};
