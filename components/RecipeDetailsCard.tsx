
import React from 'react';
import type { RecipeDetails } from '../types';
import { InputGroup } from '../App';
import { InfoIcon } from './icons/InfoIcon';

interface RecipeDetailsCardProps {
  details: RecipeDetails;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  // Structural Props
  isOpenPiece: boolean;
  isSleeveless: boolean;
  buttonBandWidth: string;
  isRaglan: boolean;
  isVNeck: boolean;
  projectType: string;
  onStructuralChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const RecipeDetailsCard: React.FC<RecipeDetailsCardProps> = ({ 
    details, 
    onChange,
    isOpenPiece,
    isSleeveless,
    buttonBandWidth,
    isRaglan,
    isVNeck,
    projectType,
    onStructuralChange
}) => {
  const showStructuralSection = isRaglan || isOpenPiece || isVNeck || projectType === 'Casaco' || isSleeveless;

  return (
    <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/40 shadow-sm transition-all hover:shadow-md">
      <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-3 mb-6 pb-2 border-b border-slate-200/60 font-display">
        <span className="text-emerald-700"><InfoIcon /></span>
        Detalhes do Projeto
      </h2>

      <div className="space-y-6">
        
        {/* Structural Section */}
        {showStructuralSection && (
          <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Tipo de Diminuição Raglan */}
                  {isRaglan && !isSleeveless && (
                      <div>
                           <label htmlFor="raglanDecreaseType" className="block mb-1 text-base font-bold text-slate-700">Tipo de Diminuição Raglan</label>
                           <select
                              id="raglanDecreaseType"
                              name="raglanDecreaseType"
                              value={details.raglanDecreaseType}
                              onChange={onChange}
                              className="bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 block w-full p-2.5 transition font-medium"
                          >
                              <option value="1">1 ponto por vez</option>
                              <option value="2">2 pontos por vez</option>
                              <option value="3">3 pontos por vez</option>
                          </select>
                      </div>
                  )}

                  {/* Largura da Tira de acabamento das Cavas */}
                  {isSleeveless && (
                      <div>
                           <label htmlFor="armholeFinishingWidth" className="block mb-1 text-base font-bold text-slate-700">Largura da Tira de acabamento das Cavas (cm)</label>
                           <input
                              type="text"
                              id="armholeFinishingWidth"
                              name="armholeFinishingWidth"
                              value={details.armholeFinishingWidth || ''}
                              onChange={onChange}
                              className="bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 block w-full p-2.5 font-medium"
                              placeholder="Ex: 2"
                              inputMode="decimal"
                          />
                      </div>
                  )}

                  {/* Tipo de Diminuição Decote em V */}
                  {isVNeck && (
                      <div>
                          <label htmlFor="vNeckDecreaseType" className="block mb-1 text-base font-bold text-slate-700">Tipo de Diminuição Decote em V</label>
                          <select
                              id="vNeckDecreaseType"
                              name="vNeckDecreaseType"
                              value={details.vNeckDecreaseType || '1'}
                              onChange={onChange}
                              className="bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 block w-full p-2.5 transition font-medium"
                          >
                              <option value="1">1 ponto por vez</option>
                              <option value="2">2 pontos por vez</option>
                              <option value="3">3 pontos por vez</option>
                          </select>
                      </div>
                  )}

                  {/* Largura do Transpasse (Condicional) */}
                  {(projectType === 'Casaco' || projectType === 'Colete Aberto' || projectType === 'Regata Aberta') && (
                      <div>
                           <label htmlFor="buttonBandWidth" className="block mb-1 text-base font-bold text-slate-700">Largura do Transpasse (cm)</label>
                           <input
                              type="text"
                              id="buttonBandWidth"
                              name="buttonBandWidth"
                              value={buttonBandWidth}
                              onChange={onStructuralChange}
                              className="bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 block w-full p-2.5 font-medium"
                              placeholder="Ex: 2"
                              inputMode="decimal"
                          />
                      </div>
                  )}
              </div>

          </div>
        )}

        {/* Ribbing Section */}
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {details.ribbingType !== 'folded' && (
                    <InputGroup label="Largura da Tira da Gola" name="ribbingGauge" value={details.ribbingGauge} onChange={onChange} placeholder="Ex: Reg. 3" labelClassName="block mb-2 text-base font-bold text-slate-700" />
                )}
                <InputGroup label="Altura da Barra (cm)" name="ribbingHeightCm" value={details.ribbingHeightCm || ''} onChange={onChange} placeholder="Ex: 5" labelClassName="block mb-2 text-base font-semibold text-slate-700" />
            </div>
        </div>

      </div>
    </div>
  );
};
