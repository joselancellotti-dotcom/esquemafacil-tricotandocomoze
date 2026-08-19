
import React from 'react';
import type { SleeveMeasurements, Size } from '../types';
import { SleeveIcon } from './icons/SleeveIcon';

interface SleeveCardProps {
  measurements: SleeveMeasurements;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mode: 'single' | 'grid';
  selectedSize: Size;
  gradingValues: Record<string, string>;
  onGradingChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAutoGrade: () => void;
  baseGradationSize: Size;
  onBaseGradationSizeChange: (size: Size) => void;
  sizes: readonly string[]; 
  projectType?: string;
  armholeType?: string;
}

const HeaderCell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof children === 'string' && children.includes(' - ')) {
    const [name, rawDesc] = children.split(' - ');
    const desc = rawDesc.replace(/[˜~]/g, ' a ').replace(/\s+/g, ' ').trim();
    return (
      <div className="flex flex-col items-center justify-center text-center p-1 bg-slate-100/90 rounded-md border border-slate-200 shadow-2xs h-full min-h-[38px] px-0.5">
        <span className="font-black text-slate-900 text-xs tracking-tight leading-none">{name}</span>
        <span className="text-[9px] text-slate-500 font-medium whitespace-nowrap leading-tight mt-0.5">{desc}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center text-center font-bold text-slate-700 text-xs p-1 bg-slate-100/90 rounded-md border border-slate-200 shadow-2xs h-full min-h-[38px] px-0.5">
      {children}
    </div>
  );
};

const LabelCell: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({ children, htmlFor }) => (
    <label htmlFor={htmlFor} className="text-xs font-bold text-slate-800 self-center pr-1">{children}</label>
);

const InputCell: React.FC<{ name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, id?: string, disabled?: boolean }> = ({ name, value, onChange, id, disabled }) => (
    <input
      id={id} type="text" name={name} value={value || ''} onChange={onChange} disabled={disabled}
      className={`border border-slate-300 text-slate-900 text-xs rounded-md block w-full py-1 px-0.5 text-center ${disabled ? 'bg-slate-200 text-slate-700 font-medium' : 'bg-slate-50 font-semibold'}`}
      placeholder="cm" inputMode="decimal"
    />
);

const GradingInputCell: React.FC<{ name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string, disabled?: boolean }> = ({ name, value, onChange, placeholder = "+/-", disabled }) => (
    <input
      type="text" name={name} value={value || ''} onChange={onChange} disabled={disabled}
      className={`border border-slate-300 text-slate-900 text-xs rounded-md block w-full py-1 px-0.5 text-center ${disabled ? 'bg-slate-200' : 'bg-slate-100'}`}
      placeholder={disabled ? '-' : placeholder} inputMode="decimal"
    />
);

const SectionHeader: React.FC<{ children: React.ReactNode, gridColumn?: string }> = ({ children, gridColumn = '1 / -1' }) => (
    <h3 className="text-xs font-bold text-slate-700 uppercase pt-2 border-t border-slate-200 mt-2" style={{gridColumn}}>
      {children}
    </h3>
);

export const SleeveCard: React.FC<SleeveCardProps> = ({ measurements, onChange, mode, selectedSize, gradingValues, onGradingChange, onAutoGrade, baseGradationSize, onBaseGradationSizeChange, sizes, projectType, armholeType }) => {
  const isCavaRedonda = (projectType === 'Blusa' || projectType === 'Casaco' || projectType === 'Colete' || projectType === 'Colete Aberto' || projectType === 'Regata' || projectType === 'Regata Aberta') && armholeType === 'Cava Redonda';

  const isChildGrade = sizes.some(s => s.includes(' - '));
  const minColWidth = isChildGrade ? '48px' : sizes.length > 5 ? '36px' : '40px';
  const tableMinWidthClass = isChildGrade ? 'min-w-[460px]' : sizes.length > 5 ? 'min-w-[480px]' : 'min-w-[400px]';

  const gridStyle = {
      display: 'grid',
      gridTemplateColumns: `minmax(115px, 1.2fr) minmax(50px, 50px) repeat(${sizes.length}, minmax(${minColWidth}, 1fr))`,
      gap: '3px'
  };

  const renderGrid = () => {
    if (isCavaRedonda) {
      return (
        <div className="overflow-x-auto">
          <div style={gridStyle} className={tableMinWidthClass}>
            <HeaderCell>Medida</HeaderCell>
            <HeaderCell>Grad. (cm)</HeaderCell>
            {sizes.map(size => <HeaderCell key={size}>{size}</HeaderCell>)}

            <SectionHeader>Larguras</SectionHeader>
            <LabelCell>Punho</LabelCell>
            <GradingInputCell name="roundSleeveWristWidth" value={gradingValues.roundSleeveWristWidth || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`roundSleeveWristWidth-${size}`} value={measurements.roundSleeveWristWidth?.[size] || ''} onChange={onChange} />)}

            <LabelCell>Largura Máxima</LabelCell>
            <GradingInputCell name="roundSleeveMaxWidth" value={gradingValues.roundSleeveMaxWidth || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`roundSleeveMaxWidth-${size}`} value={measurements.roundSleeveMaxWidth?.[size] || ''} onChange={onChange} />)}

            <LabelCell>Arremate Final</LabelCell>
            <GradingInputCell name="roundSleeveFinalBindoff" value="" disabled />
            {sizes.map(size => <InputCell key={size} name={`roundSleeveFinalBindoff-${size}`} value={measurements.roundSleeveFinalBindoff?.[size] || ''} onChange={onChange} disabled />)}

            <SectionHeader>Alturas</SectionHeader>
            <LabelCell>Barra até Cava</LabelCell>
            <GradingInputCell name="roundSleeveHemToArmholeHeight" value={gradingValues.roundSleeveHemToArmholeHeight || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`roundSleeveHemToArmholeHeight-${size}`} value={measurements.roundSleeveHemToArmholeHeight?.[size] || ''} onChange={onChange} />)}

            <LabelCell>Cabeça da Manga</LabelCell>
            <GradingInputCell name="roundSleeveCapHeight" value={gradingValues.roundSleeveCapHeight || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`roundSleeveCapHeight-${size}`} value={measurements.roundSleeveCapHeight?.[size] || ''} onChange={onChange} />)}

            <SectionHeader>Total</SectionHeader>
            <LabelCell>Total da Manga</LabelCell>
            <GradingInputCell name="roundSleeveTotalHeightGrad" value="" disabled />
            {sizes.map(size => {
              const h = parseFloat(measurements.roundSleeveHemToArmholeHeight?.[size] || '0') || 0;
              const c = parseFloat(measurements.roundSleeveCapHeight?.[size] || '0') || 0;
              const total = h + c;
              const displayVal = total > 0 ? parseFloat(total.toFixed(2)).toString() : '';
              return <InputCell key={size} name={`roundSleeveTotalHeight-${size}`} value={displayVal} onChange={() => {}} disabled />;
            })}
          </div>
        </div>
      );
    }

    return (
     <div className="overflow-x-auto">
        <div style={gridStyle} className={tableMinWidthClass}>
            <HeaderCell>Medida</HeaderCell>
            <HeaderCell>Grad. (cm)</HeaderCell>
            {sizes.map(size => <HeaderCell key={size}>{size}</HeaderCell>)}

            <SectionHeader>Larguras</SectionHeader>
            <LabelCell>Punho</LabelCell>
            <GradingInputCell name="wristWidth" value={gradingValues.wristWidth || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`wristWidth-${size}`} value={measurements.wristWidth[size] || ''} onChange={onChange} />)}

            <LabelCell>Largura Máxima</LabelCell>
            <GradingInputCell name="sleeveMaxWidth" value={gradingValues.sleeveMaxWidth || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`sleeveMaxWidth-${size}`} value={measurements.sleeveMaxWidth[size] || ''} onChange={onChange} />)}

            <LabelCell>Largura Final (Topo)</LabelCell>
            <GradingInputCell name="sleeveFinalWidth" value={gradingValues.sleeveFinalWidth || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`sleeveFinalWidth-${size}`} value={measurements.sleeveFinalWidth[size] || ''} onChange={onChange} />)}

            <SectionHeader>Alturas</SectionHeader>
            <LabelCell>Barra até Cava</LabelCell>
            <GradingInputCell name="sleeveHemToArmholeHeight" value={gradingValues.sleeveHemToArmholeHeight || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`sleeveHemToArmholeHeight-${size}`} value={measurements.sleeveHemToArmholeHeight[size] || ''} onChange={onChange} />)}

            <LabelCell>Cava Frente</LabelCell>
            <GradingInputCell name="sleeveArmholeHeightFront" value={gradingValues.sleeveArmholeHeightFront || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`sleeveArmholeHeightFront-${size}`} value={measurements.sleeveArmholeHeightFront[size] || ''} onChange={onChange} />)}

            <LabelCell>Cava Costas</LabelCell>
            <GradingInputCell name="sleeveArmholeHeightBack" value={gradingValues.sleeveArmholeHeightBack || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`sleeveArmholeHeightBack-${size}`} value={measurements.sleeveArmholeHeightBack[size] || ''} onChange={onChange} />)}
        </div>
      </div>
    );
  };

  const renderSingle = () => {
    if (isCavaRedonda) {
      return (
        <div className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
               <SectionHeader gridColumn="1 / -1">Larguras</SectionHeader>
               <div><LabelCell>Punho</LabelCell><InputCell name="roundSleeveWristWidth" value={measurements.roundSleeveWristWidth?.[selectedSize] || ''} onChange={onChange} /></div>
               <div><LabelCell>Largura Máxima</LabelCell><InputCell name="roundSleeveMaxWidth" value={measurements.roundSleeveMaxWidth?.[selectedSize] || ''} onChange={onChange} /></div>
               <div><LabelCell>Arremate Final</LabelCell><InputCell name="roundSleeveFinalBindoff" value={measurements.roundSleeveFinalBindoff?.[selectedSize] || ''} onChange={onChange} disabled /></div>
               
               <SectionHeader gridColumn="1 / -1">Alturas</SectionHeader>
               <div><LabelCell>Barra até Cava</LabelCell><InputCell name="roundSleeveHemToArmholeHeight" value={measurements.roundSleeveHemToArmholeHeight?.[selectedSize] || ''} onChange={onChange} /></div>
               <div><LabelCell>Cabeça da Manga</LabelCell><InputCell name="roundSleeveCapHeight" value={measurements.roundSleeveCapHeight?.[selectedSize] || ''} onChange={onChange} /></div>

               <SectionHeader gridColumn="1 / -1">Total</SectionHeader>
               <div>
                 <LabelCell>Total da Manga</LabelCell>
                 {(() => {
                   const h = parseFloat(measurements.roundSleeveHemToArmholeHeight?.[selectedSize] || '0') || 0;
                   const c = parseFloat(measurements.roundSleeveCapHeight?.[selectedSize] || '0') || 0;
                   const total = h + c;
                   const displayVal = total > 0 ? parseFloat(total.toFixed(2)).toString() : '';
                   return <InputCell name="roundSleeveTotalHeight" value={displayVal} onChange={() => {}} disabled />;
                 })()}
               </div>
           </div>
        </div>
      );
    }

    return (
       <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <SectionHeader gridColumn="1 / -1">Larguras</SectionHeader>
              <div><LabelCell>Punho</LabelCell><InputCell name="wristWidth" value={measurements.wristWidth[selectedSize] || ''} onChange={onChange} /></div>
              <div><LabelCell>Largura Máxima</LabelCell><InputCell name="sleeveMaxWidth" value={measurements.sleeveMaxWidth[selectedSize] || ''} onChange={onChange} /></div>
              <div><LabelCell>Largura Final (Topo)</LabelCell><InputCell name="sleeveFinalWidth" value={measurements.sleeveFinalWidth[selectedSize] || ''} onChange={onChange} /></div>
              <SectionHeader gridColumn="1 / -1">Alturas</SectionHeader>
              <div><LabelCell>Barra até Cava</LabelCell><InputCell name="sleeveHemToArmholeHeight" value={measurements.sleeveHemToArmholeHeight[selectedSize] || ''} onChange={onChange} /></div>
              <div><LabelCell>Cava Frente</LabelCell><InputCell name="sleeveArmholeHeightFront" value={measurements.sleeveArmholeHeightFront[selectedSize] || ''} onChange={onChange} /></div>
              <div><LabelCell>Cava Costas</LabelCell><InputCell name="sleeveArmholeHeightBack" value={measurements.sleeveArmholeHeightBack[selectedSize] || ''} onChange={onChange} /></div>
          </div>
       </div>
    );
  };

  return (
    <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/40 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 pb-2 border-b border-slate-200/60">
        <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-3 font-display"><span className="text-emerald-700"><SleeveIcon /></span>Medidas: Manga (cm)</h2>
        {mode === 'grid' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="base-size-select-sleeve" className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Base:</label>
              <select 
                id="base-size-select-sleeve"
                value={baseGradationSize} 
                onChange={(e) => onBaseGradationSizeChange(e.target.value as Size)}
                className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 font-bold focus:ring-2 focus:ring-emerald-700 outline-none"
              >
                {sizes.map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
            <button onClick={onAutoGrade} className="px-4 py-2 text-xs font-black text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-all uppercase tracking-wider shadow-sm hover:shadow">Graduar Automaticamente</button>
          </div>
        )}
      </div>
      {mode === 'grid' ? renderGrid() : renderSingle()}
    </div>
  );
};
