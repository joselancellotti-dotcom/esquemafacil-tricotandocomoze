import React from 'react';
import type { FormData } from '../types';

interface PrintableMeasurementsProps {
  formData: FormData;
  sizes: readonly string[];
  barTypeSelection?: string;
  barSwatchValue?: string;
  barSwatchOrlaLength?: string;
  buttonBandTypeSelection?: string;
  buttonBandSwatchStitches?: string;
  buttonBandSwatchRows?: string;
  buttonBandSwatchGauge?: string;
  necklineArmholeFinishing?: string;
  finishingSwatchStitches?: string;
  finishingSwatchRows?: string;
  finishingSwatchGauge?: string;
  projectType?: string;
  armholeType?: string;
  necklineSelection?: string;
  machineGauge?: string;
}

const TableRow: React.FC<{ label: string; values: Record<string, string>; sizes: readonly string[] }> = ({ label, values, sizes }) => (
  <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
    <td className="py-3 px-4 font-semibold text-slate-700 text-left text-sm">{label}</td>
    {sizes.map(size => (
      <td key={size} className="py-3 px-4 text-center text-blue-700 font-mono font-bold text-sm">
        {values[size] || '-'}
      </td>
    ))}
  </tr>
);

const SectionHeader: React.FC<{ title: string; colSpan: number }> = ({ title, colSpan }) => (
  <tr className="bg-slate-100">
    <td colSpan={colSpan} className="py-2 px-4 font-black text-blue-800 text-left uppercase text-[10px] tracking-[0.2em] border-y border-slate-200">{title}</td>
  </tr>
);

export const PrintableMeasurements: React.FC<PrintableMeasurementsProps> = ({ 
  formData, 
  sizes, 
  barTypeSelection, 
  barSwatchValue,
  barSwatchOrlaLength,
  buttonBandTypeSelection,
  buttonBandSwatchStitches,
  buttonBandSwatchRows,
  buttonBandSwatchGauge,
  necklineArmholeFinishing,
  finishingSwatchStitches,
  finishingSwatchRows,
  finishingSwatchGauge,
  projectType,
  armholeType,
  necklineSelection,
  machineGauge
}) => {
  const { bodyMeasurements, sleeveMeasurements, pieceName, yarn, gauge, swatchStitches, swatchRows, isSleeveless } = formData;
  const colSpan = sizes.length + 1;
  const isCavaRedonda = (projectType === 'Blusa' || projectType === 'Casaco' || projectType === 'Colete' || projectType === 'Colete Aberto' || projectType === 'Regata' || projectType === 'Regata Aberta') && armholeType === 'Cava Redonda';

  const isVNeck = necklineSelection === 'Decote V' || necklineSelection === 'Decote em V';
  const roundFrontNecklineDepth = isCavaRedonda
    ? (isVNeck ? (bodyMeasurements.roundFrontNecklineDepthV || {}) : (bodyMeasurements.roundFrontNecklineDepthRound || {}))
    : {};

  const targetStitches = machineGauge === '6,5mm' ? 30 : (machineGauge === '9,0mm' ? 20 : 40);
  const targetRows = machineGauge === '6,5mm' ? 40 : (machineGauge === '9,0mm' ? 30 : 60);

  const numSts = parseFloat(swatchStitches);
  const numRows = parseFloat(swatchRows);
  const stsPerCm = !isNaN(numSts) && numSts > 0 ? parseFloat((targetStitches / numSts).toFixed(2)) : 0;
  const rowsPerCm = !isNaN(numRows) && numRows > 0 ? parseFloat((targetRows / numRows).toFixed(2)) : 0;
  const swatchDisplay = stsPerCm && rowsPerCm 
    ? `${targetStitches}pts = ${swatchStitches}cm, ${targetRows}carrs = ${swatchRows}cm (${(stsPerCm * 10).toFixed(1)} pts/10 cm, ${(rowsPerCm * 10).toFixed(1)} carrs/10 cm)`
    : `${swatchStitches || '-'}x${swatchRows || '-'}`;

  let barSwatchText = '';
  if (barTypeSelection) {
    const parts = [];
    let label = '';
    if (['1x1', '2x2', '3x3'].includes(barTypeSelection)) {
      label = 'Pontos em 10 cm';
    } else if (['2x1', '3x2'].includes(barTypeSelection)) {
      label = 'Canaletas em 10 cm';
    } else if (barTypeSelection === 'Barra dobrada em Ponto Meia') {
      label = 'Medida de 40 carreiras em Ponto Meia';
    }
    if (label && barSwatchValue) {
      parts.push(`${label}: ${barSwatchValue}`);
    }
    if (barSwatchOrlaLength) {
      parts.push(`Carreiras da Amostra em Cm: ${barSwatchOrlaLength}`);
    }
    if (parts.length > 0) {
      barSwatchText = parts.join(', ');
    }
  }

  let buttonBandSwatchText = '';
  if (buttonBandTypeSelection && buttonBandTypeSelection !== 'Igual a Barra') {
    const parts = [];
    if (buttonBandSwatchStitches) {
      parts.push(`40 pts = ${buttonBandSwatchStitches} cm`);
    }
    if (buttonBandSwatchRows) {
      parts.push(`40 carrs = ${buttonBandSwatchRows} cm`);
    }
    if (buttonBandSwatchGauge) {
      const regLabel = buttonBandTypeSelection === 'Em Malha Cheia' ? 'Reg. Malha Cheia' : 'Reg. Ponto Meia';
      parts.push(`${regLabel}: ${buttonBandSwatchGauge}`);
    }
    if (parts.length > 0) {
      buttonBandSwatchText = parts.join(', ');
    }
  }

  let finishingSwatchText = '';
  if (necklineArmholeFinishing === 'Ponto Meia Dobrado') {
    const parts = [];
    if (finishingSwatchStitches) {
      parts.push(`40 pts = ${finishingSwatchStitches} cm`);
    }
    if (finishingSwatchRows) {
      parts.push(`40 carrs = ${finishingSwatchRows} cm`);
    }
    if (finishingSwatchGauge) {
      parts.push(`Reg. Ponto Meia: ${finishingSwatchGauge}`);
    }
    if (parts.length > 0) {
      finishingSwatchText = parts.join(', ');
    }
  }

  const totalHeights: Record<string, string> = {};
  sizes.forEach(size => {
    const h = parseFloat(bodyMeasurements.roundHemToArmholeHeight?.[size] || '0') || 0;
    const c = parseFloat(bodyMeasurements.roundArmholeHeight?.[size] || '0') || 0;
    const s = parseFloat(bodyMeasurements.roundShoulderSlope?.[size] || '0') || 0;
    const total = h + c + s;
    totalHeights[size] = total > 0 ? parseFloat(total.toFixed(2)).toString() : '';
  });

  const totalSleeveHeights: Record<string, string> = {};
  sizes.forEach(size => {
    const h = parseFloat(sleeveMeasurements.roundSleeveHemToArmholeHeight?.[size] || '0') || 0;
    const c = parseFloat(sleeveMeasurements.roundSleeveCapHeight?.[size] || '0') || 0;
    const total = h + c;
    totalSleeveHeights[size] = total > 0 ? parseFloat(total.toFixed(2)).toString() : '';
  });

  return (
    <div className="bg-white text-slate-900 p-12 font-sans min-h-screen mx-auto pdf-section" style={{ width: '210mm' }}>
      <header className="text-center mb-12 border-b-2 border-slate-200 pb-8">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 text-slate-900">
          Tabela de Medidas {isCavaRedonda ? '(Cava Redonda)' : '(Raglan)'}
        </h1>
        {pieceName && <p className="text-2xl text-slate-600 font-light mt-1">{pieceName}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span className="bg-slate-50 px-3 py-1 rounded-full border border-slate-200">Amostra: <span className="text-slate-900">{swatchDisplay}</span></span>
            {barSwatchText && <span className="bg-slate-50 px-3 py-1 rounded-full border border-slate-200">Amostra da Barra: <span className="text-slate-900">{barSwatchText}</span></span>}
            {buttonBandSwatchText && <span className="bg-slate-50 px-3 py-1 rounded-full border border-slate-200">Amostra da Tira: <span className="text-slate-900">{buttonBandSwatchText}</span></span>}
            {finishingSwatchText && <span className="bg-slate-50 px-3 py-1 rounded-full border border-slate-200">Amostra do Acabamento: <span className="text-slate-900">{finishingSwatchText}</span></span>}
            {yarn && <span className="bg-slate-50 px-3 py-1 rounded-full border border-slate-200">Fio: <span className="text-slate-900">{yarn}</span></span>}
        </div>
      </header>
      
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl">
        <table className="w-full text-sm border-collapse bg-white">
            <thead>
                <tr className="bg-slate-900 text-white">
                    <th className="py-3 px-4 text-left w-1/3 uppercase text-[11px] font-black tracking-widest border-b border-slate-700">Medida (cm)</th>
                    {sizes.map(size => {
                        if (size.includes(' - ')) {
                            const [name, rawDesc] = size.split(' - ');
                            const desc = rawDesc.replace(/[˜~]/g, ' a ').replace(/\s+/g, ' ').trim();
                            return (
                                <th key={size} className="py-2.5 px-3 text-center border-b border-slate-700">
                                    <div className="uppercase text-xs font-black tracking-wider text-amber-400">{name}</div>
                                    <div className="text-[10px] text-slate-300 font-medium normal-case whitespace-nowrap">{desc}</div>
                                </th>
                            );
                        }
                        return <th key={size} className="py-4 px-4 text-center uppercase text-[11px] font-black tracking-widest border-b border-slate-700">{size}</th>;
                    })}
                </tr>
            </thead>
            <tbody>
                {isCavaRedonda ? (
                  <>
                    <SectionHeader title="Corpo - Larguras" colSpan={colSpan} />
                    <TableRow label="Busto" values={bodyMeasurements.roundBustWidth || {}} sizes={sizes} />
                    <TableRow label="Ombro" values={bodyMeasurements.roundShoulderWidth || {}} sizes={sizes} />
                    <TableRow label="Decote Costas" values={bodyMeasurements.roundBackNecklineWidth || {}} sizes={sizes} />
                    <TableRow label="Entre-Cavas (Frente)" values={bodyMeasurements.roundFrontCrossChest || {}} sizes={sizes} />
                    <TableRow label="Entre-Cavas (Costas)" values={bodyMeasurements.roundBackCrossChest || {}} sizes={sizes} />
                    
                    <SectionHeader title="Corpo - Alturas" colSpan={colSpan} />
                    <TableRow label="Barra até Cava" values={bodyMeasurements.roundHemToArmholeHeight || {}} sizes={sizes} />
                    <TableRow label="Cava" values={bodyMeasurements.roundArmholeHeight || {}} sizes={sizes} />
                    <TableRow label="Inclinação do Ombro" values={bodyMeasurements.roundShoulderSlope || {}} sizes={sizes} />
                    <TableRow label="Decote Costas" values={bodyMeasurements.roundBackNecklineDepth || {}} sizes={sizes} />
                    <TableRow label="Decote Frente" values={roundFrontNecklineDepth} sizes={sizes} />

                    <SectionHeader title="Corpo - Total" colSpan={colSpan} />
                    <TableRow label="Altura Total da Peça" values={totalHeights} sizes={sizes} />
                  </>
                ) : (
                  <>
                    <SectionHeader title="Corpo - Larguras" colSpan={colSpan} />
                    <TableRow label="Busto" values={bodyMeasurements.bustWidth} sizes={sizes} />
                    <TableRow label="Arr. Inicial Cava" values={bodyMeasurements.initialArmholeBindoff} sizes={sizes} />
                    <TableRow label="Decote Frente" values={bodyMeasurements.necklineFrontWidth} sizes={sizes} />
                    <TableRow label="Decote Costas" values={bodyMeasurements.necklineBackWidth} sizes={sizes} />
                    
                    <SectionHeader title="Corpo - Alturas" colSpan={colSpan} />
                    <TableRow label="Barra até a Cava" values={bodyMeasurements.hemToArmholeHeight} sizes={sizes} />
                    <TableRow label="Cava Frente" values={bodyMeasurements.armholeHeightFront} sizes={sizes} />
                    <TableRow label="Cava Costas" values={bodyMeasurements.armholeHeightBack} sizes={sizes} />
                    <TableRow label="Decote Frente" values={bodyMeasurements.necklineFrontDepth} sizes={sizes} />
                    <TableRow label="Prof. Decote Costas" values={bodyMeasurements.necklineBackDepth} sizes={sizes} />
                  </>
                )}
                
                {!isSleeveless && (
                  isCavaRedonda ? (
                    <>
                      <SectionHeader title="Manga" colSpan={colSpan} />
                      <TableRow label="Largura do Punho" values={sleeveMeasurements.roundSleeveWristWidth || {}} sizes={sizes} />
                      <TableRow label="Largura Máxima" values={sleeveMeasurements.roundSleeveMaxWidth || {}} sizes={sizes} />
                      <TableRow label="Arremate Final" values={sleeveMeasurements.roundSleeveFinalBindoff || {}} sizes={sizes} />
                      <TableRow label="Barra até a Cava" values={sleeveMeasurements.roundSleeveHemToArmholeHeight || {}} sizes={sizes} />
                      <TableRow label="Cabeça da Manga" values={sleeveMeasurements.roundSleeveCapHeight || {}} sizes={sizes} />
                      <TableRow label="Total da Manga" values={totalSleeveHeights} sizes={sizes} />
                    </>
                  ) : (
                    <>
                      <SectionHeader title="Manga" colSpan={colSpan} />
                      <TableRow label="Largura do Punho" values={sleeveMeasurements.wristWidth} sizes={sizes} />
                      <TableRow label="Largura Máxima" values={sleeveMeasurements.sleeveMaxWidth} sizes={sizes} />
                      <TableRow label="Largura Final (Topo)" values={sleeveMeasurements.sleeveFinalWidth} sizes={sizes} />
                      <TableRow label="Barra até a Cava" values={sleeveMeasurements.sleeveHemToArmholeHeight} sizes={sizes} />
                      <TableRow label="Raglan Frente" values={sleeveMeasurements.sleeveArmholeHeightFront} sizes={sizes} />
                      <TableRow label="Raglan Costas" values={sleeveMeasurements.sleeveArmholeHeightBack} sizes={sizes} />
                    </>
                  )
                )}
            </tbody>
        </table>
      </div>

      <footer className="text-center text-[10px] text-slate-400 mt-16 pt-6 border-t border-slate-200 uppercase tracking-widest">
        <p>Gerado por Tricotando com o Zé — Tecnologia Esquema Fácil</p>
      </footer>
    </div>
  );
};