
import React from 'react';
import type { BodyMeasurements, Size } from '../types';
import { BodyIcon } from './icons/BodyIcon';

interface BodyMeasurementsCardProps {
  measurements: BodyMeasurements;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  mode: 'single' | 'grid';
  selectedSize: Size;
  onSelectedSizeChange: (size: Size) => void;
  gradingValues: Record<string, string>;
  onGradingChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAutoGrade: () => void;
  baseGradationSize: Size;
  onBaseGradationSizeChange: (size: Size) => void;
  sizes: readonly string[]; 
  projectType?: string;
  armholeType?: string;
  necklineSelection?: string;
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

export const BodyMeasurementsCard: React.FC<BodyMeasurementsCardProps> = ({ measurements, onChange, mode, selectedSize, onSelectedSizeChange, gradingValues, onGradingChange, onAutoGrade, baseGradationSize, onBaseGradationSizeChange, sizes, projectType, armholeType, necklineSelection }) => {
  const isCavaRedonda = (projectType === 'Blusa' || projectType === 'Casaco' || projectType === 'Colete' || projectType === 'Colete Aberto' || projectType === 'Regata' || projectType === 'Regata Aberta') && armholeType === 'Cava Redonda';
  const isVNeck = necklineSelection === 'Decote V' || necklineSelection === 'Decote em V';
  const roundFrontNecklineFieldName = isVNeck ? 'roundFrontNecklineDepthV' : 'roundFrontNecklineDepthRound';

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
            <LabelCell>Busto</LabelCell>
            <GradingInputCell name="roundBustWidth" value={gradingValues.roundBustWidth || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`roundBustWidth-${size}`} value={measurements.roundBustWidth?.[size] || ''} onChange={onChange} />)}

            <LabelCell>Ombro</LabelCell>
            <GradingInputCell name="roundShoulderWidth" value={gradingValues.roundShoulderWidth || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`roundShoulderWidth-${size}`} value={measurements.roundShoulderWidth?.[size] || ''} onChange={onChange} />)}

            <LabelCell>Decote Costas</LabelCell>
            <GradingInputCell name="roundBackNecklineWidth" value={gradingValues.roundBackNecklineWidth || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`roundBackNecklineWidth-${size}`} value={measurements.roundBackNecklineWidth?.[size] || ''} onChange={onChange} />)}

            <LabelCell>Entre-Cavas (Frente)</LabelCell>
            <GradingInputCell name="roundFrontCrossChest" value={gradingValues.roundFrontCrossChest || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`roundFrontCrossChest-${size}`} value={measurements.roundFrontCrossChest?.[size] || ''} onChange={onChange} />)}

            <LabelCell>Entre-Cavas (Costas)</LabelCell>
            <GradingInputCell name="roundBackCrossChest" value={gradingValues.roundBackCrossChest || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`roundBackCrossChest-${size}`} value={measurements.roundBackCrossChest?.[size] || ''} onChange={onChange} />)}

            <SectionHeader>Alturas</SectionHeader>
            <LabelCell>Barra até Cava</LabelCell>
            <GradingInputCell name="roundHemToArmholeHeight" value={gradingValues.roundHemToArmholeHeight || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`roundHemToArmholeHeight-${size}`} value={measurements.roundHemToArmholeHeight?.[size] || ''} onChange={onChange} />)}

            <LabelCell>Cava</LabelCell>
            <GradingInputCell name="roundArmholeHeight" value={gradingValues.roundArmholeHeight || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`roundArmholeHeight-${size}`} value={measurements.roundArmholeHeight?.[size] || ''} onChange={onChange} />)}

            <LabelCell>Inclinação do Ombro</LabelCell>
            <GradingInputCell name="roundShoulderSlope" value={gradingValues.roundShoulderSlope || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`roundShoulderSlope-${size}`} value={measurements.roundShoulderSlope?.[size] || ''} onChange={onChange} />)}

            <LabelCell>Decote Costas</LabelCell>
            <GradingInputCell name="roundBackNecklineDepth" value={gradingValues.roundBackNecklineDepth || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`roundBackNecklineDepth-${size}`} value={measurements.roundBackNecklineDepth?.[size] || ''} onChange={onChange} />)}

            <LabelCell>Decote Frente</LabelCell>
            <GradingInputCell name={roundFrontNecklineFieldName} value={gradingValues[roundFrontNecklineFieldName] || ''} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`${roundFrontNecklineFieldName}-${size}`} value={measurements[roundFrontNecklineFieldName]?.[size] || ''} onChange={onChange} />)}

            <SectionHeader>Total</SectionHeader>
            <LabelCell>Altura Total da Peça</LabelCell>
            <GradingInputCell name="roundTotalHeightGrad" value="" disabled />
            {sizes.map(size => {
              const h = parseFloat(measurements.roundHemToArmholeHeight?.[size] || '0') || 0;
              const c = parseFloat(measurements.roundArmholeHeight?.[size] || '0') || 0;
              const s = parseFloat(measurements.roundShoulderSlope?.[size] || '0') || 0;
              const total = h + c + s;
              const displayVal = total > 0 ? parseFloat(total.toFixed(2)).toString() : '';
              return <InputCell key={size} name={`roundTotalHeight-${size}`} value={displayVal} onChange={() => {}} disabled />;
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
            <LabelCell>Busto</LabelCell>
            <GradingInputCell name="bustWidth" value={gradingValues.bustWidth} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`bustWidth-${size}`} value={measurements.bustWidth?.[size]} onChange={onChange} />)}
            
            <LabelCell>Arremate Inicial</LabelCell>
            <GradingInputCell name="initialArmholeBindoff" value={gradingValues.initialArmholeBindoff} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`initialArmholeBindoff-${size}`} value={measurements.initialArmholeBindoff?.[size]} onChange={onChange} />)}

            <LabelCell>Decote Frente</LabelCell>
            <GradingInputCell name="necklineFrontWidth" value={gradingValues.necklineFrontWidth} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`necklineFrontWidth-${size}`} value={measurements.necklineFrontWidth?.[size]} onChange={onChange} />)}

            <LabelCell>Decote Costas</LabelCell>
            <GradingInputCell name="necklineBackWidth" value={gradingValues.necklineBackWidth} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`necklineBackWidth-${size}`} value={measurements.necklineBackWidth?.[size]} onChange={onChange} />)}
            
            <SectionHeader>Alturas</SectionHeader>
            <LabelCell>Barra até Cava</LabelCell>
            <GradingInputCell name="hemToArmholeHeight" value={gradingValues.hemToArmholeHeight} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`hemToArmholeHeight-${size}`} value={measurements.hemToArmholeHeight?.[size]} onChange={onChange} />)}
            
            <LabelCell>Altura Cava Frente</LabelCell>
            <GradingInputCell name="armholeHeightFront" value={gradingValues.armholeHeightFront} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`armholeHeightFront-${size}`} value={measurements.armholeHeightFront?.[size]} onChange={onChange} />)}

            <LabelCell>Altura Cava Costas</LabelCell>
            <GradingInputCell name="armholeHeightBack" value={gradingValues.armholeHeightBack} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`armholeHeightBack-${size}`} value={measurements.armholeHeightBack?.[size]} onChange={onChange} />)}

            <LabelCell>Decote Frente</LabelCell>
            <GradingInputCell name="necklineFrontDepth" value={gradingValues.necklineFrontDepth} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`necklineFrontDepth-${size}`} value={measurements.necklineFrontDepth?.[size]} onChange={onChange} />)}
            
            <LabelCell>Decote Costas</LabelCell>
            <GradingInputCell name="necklineBackDepth" value={gradingValues.necklineBackDepth} onChange={onGradingChange} />
            {sizes.map(size => <InputCell key={size} name={`necklineBackDepth-${size}`} value={measurements.necklineBackDepth?.[size]} onChange={onChange} />)}
        </div>
      </div>
    );
  };
  
  const renderSingle = () => {
    if (isCavaRedonda) {
      return (
        <div className="space-y-4">
          <div><LabelCell htmlFor="size-select">Tamanho</LabelCell><select id="size-select" value={selectedSize} onChange={(e) => onSelectedSizeChange(e.target.value as Size)} className="mt-1 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg block w-full p-2.5">{sizes.map(size => <option key={size} value={size}>{size}</option>)}</select></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <SectionHeader gridColumn="1 / -1">Larguras</SectionHeader>
              <div><LabelCell>Busto</LabelCell><InputCell name="roundBustWidth" value={measurements.roundBustWidth?.[selectedSize] || ''} onChange={onChange} /></div>
              <div><LabelCell>Ombro</LabelCell><InputCell name="roundShoulderWidth" value={measurements.roundShoulderWidth?.[selectedSize] || ''} onChange={onChange} /></div>
              <div><LabelCell>Decote Costas</LabelCell><InputCell name="roundBackNecklineWidth" value={measurements.roundBackNecklineWidth?.[selectedSize] || ''} onChange={onChange} /></div>
              <div><LabelCell>Entre-Cavas (Frente)</LabelCell><InputCell name="roundFrontCrossChest" value={measurements.roundFrontCrossChest?.[selectedSize] || ''} onChange={onChange} /></div>
              <div><LabelCell>Entre-Cavas (Costas)</LabelCell><InputCell name="roundBackCrossChest" value={measurements.roundBackCrossChest?.[selectedSize] || ''} onChange={onChange} /></div>
              
              <SectionHeader gridColumn="1 / -1">Alturas</SectionHeader>
              <div><LabelCell>Barra até Cava</LabelCell><InputCell name="roundHemToArmholeHeight" value={measurements.roundHemToArmholeHeight?.[selectedSize] || ''} onChange={onChange} /></div>
              <div><LabelCell>Cava</LabelCell><InputCell name="roundArmholeHeight" value={measurements.roundArmholeHeight?.[selectedSize] || ''} onChange={onChange} /></div>
              <div><LabelCell>Inclinação do Ombro</LabelCell><InputCell name="roundShoulderSlope" value={measurements.roundShoulderSlope?.[selectedSize] || ''} onChange={onChange} /></div>
              <div><LabelCell>Decote Costas</LabelCell><InputCell name="roundBackNecklineDepth" value={measurements.roundBackNecklineDepth?.[selectedSize] || ''} onChange={onChange} /></div>
              <div><LabelCell>Decote Frente</LabelCell><InputCell name={roundFrontNecklineFieldName} value={measurements[roundFrontNecklineFieldName]?.[selectedSize] || ''} onChange={onChange} /></div>

              <SectionHeader gridColumn="1 / -1">Total</SectionHeader>
              <div>
                <LabelCell>Altura Total da Peça</LabelCell>
                {(() => {
                  const h = parseFloat(measurements.roundHemToArmholeHeight?.[selectedSize] || '0') || 0;
                  const c = parseFloat(measurements.roundArmholeHeight?.[selectedSize] || '0') || 0;
                  const s = parseFloat(measurements.roundShoulderSlope?.[selectedSize] || '0') || 0;
                  const total = h + c + s;
                  const displayVal = total > 0 ? parseFloat(total.toFixed(2)).toString() : '';
                  return <InputCell name="roundTotalHeight" value={displayVal} onChange={() => {}} disabled />;
                })()}
              </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
         <div><LabelCell htmlFor="size-select">Tamanho</LabelCell><select id="size-select" value={selectedSize} onChange={(e) => onSelectedSizeChange(e.target.value as Size)} className="mt-1 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg block w-full p-2.5">{sizes.map(size => <option key={size} value={size}>{size}</option>)}</select></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <SectionHeader gridColumn="1 / -1">Larguras</SectionHeader>
              <div><LabelCell>Busto</LabelCell><InputCell name="bustWidth" value={measurements.bustWidth?.[selectedSize]} onChange={onChange} /></div>
              <div><LabelCell>Arremate Inicial</LabelCell><InputCell name="initialArmholeBindoff" value={measurements.initialArmholeBindoff?.[selectedSize]} onChange={onChange} /></div>
              <div><LabelCell>Decote Frente</LabelCell><InputCell name="necklineFrontWidth" value={measurements.necklineFrontWidth?.[selectedSize]} onChange={onChange} /></div>
              <div><LabelCell>Decote Costas</LabelCell><InputCell name="necklineBackWidth" value={measurements.necklineBackWidth?.[selectedSize]} onChange={onChange} /></div>
              <SectionHeader gridColumn="1 / -1">Alturas</SectionHeader>
              <div><LabelCell>Barra até Cava</LabelCell><InputCell name="hemToArmholeHeight" value={measurements.hemToArmholeHeight?.[selectedSize]} onChange={onChange} /></div>
              <div><LabelCell>Cava Frente</LabelCell><InputCell name="armholeHeightFront" value={measurements.armholeHeightFront?.[selectedSize]} onChange={onChange} /></div>
              <div><LabelCell>Cava Costas</LabelCell><InputCell name="armholeHeightBack" value={measurements.armholeHeightBack?.[selectedSize]} onChange={onChange} /></div>
              <div><LabelCell>Decote Frente</LabelCell><InputCell name="necklineFrontDepth" value={measurements.necklineFrontDepth?.[selectedSize]} onChange={onChange} /></div>
              <div><LabelCell>Prof. Decote Costas</LabelCell><InputCell name="necklineBackDepth" value={measurements.necklineBackDepth?.[selectedSize]} onChange={onChange} /></div>
          </div>
      </div>
    );
  };

  return (
    <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/40 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 pb-2 border-b border-slate-200/60">
        <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-3 font-display"><span className="text-emerald-700"><BodyIcon /></span>Medidas: Corpo (cm)</h2>
        {mode === 'grid' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="base-size-select" className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Base:</label>
              <select 
                id="base-size-select"
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
