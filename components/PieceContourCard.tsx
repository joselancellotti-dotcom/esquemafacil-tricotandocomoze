
import React, { useMemo } from 'react';
import type { CalculationSummary } from '../types';

interface PieceContourCardProps {
  summary: CalculationSummary;
  pieceName?: string;
  isPrint?: boolean;
  availableSizes?: string[];
  activeSize?: string | null;
  onSizeChange?: (size: string) => void;
}

const GridDefs: React.FC<{ scaleX: number; scaleY: number }> = ({ scaleX, scaleY }) => (
  <defs>
    <pattern id="gridSub" width={10 * scaleX} height={10 * scaleY} patternUnits="userSpaceOnUse">
      <path d={`M ${10 * scaleX} 0 L 0 0 0 ${10 * scaleY}`} fill="none" stroke="rgba(31, 63, 36, 0.04)" strokeWidth="0.5"/>
    </pattern>
    <pattern id="gridMain" width={50 * scaleX} height={50 * scaleY} patternUnits="userSpaceOnUse">
      <rect width={50 * scaleX} height={50 * scaleY} fill="url(#gridSub)" />
      <path d={`M ${50 * scaleX} 0 L 0 0 0 ${50 * scaleY}`} fill="none" stroke="rgba(31, 63, 36, 0.12)" strokeWidth="1"/>
    </pattern>
  </defs>
);

const ShapingSummary: React.FC<{ 
  shaping?: { pts: number; gap: number; times: number }[]; 
  label: string; 
  action?: 'Diminua' | 'Aumentar' | 'Suspenda';
  extraInfo?: { label: string; value: string | number }[];
}> = ({ shaping, label, action = 'Diminua', extraInfo }) => {
  if (!shaping || shaping.length === 0) return null;

  return (
    <div className="mb-4 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/60 shadow-sm">
      <h6 className="text-[10px] font-black text-emerald-900 uppercase mb-2 border-b border-emerald-200/50 pb-1 flex items-center gap-1.5 font-display tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        {label}
      </h6>
      <div className="space-y-1.5 mb-2">
        {shaping.map((s, i) => {
          const isCentral = i === 0 && action === 'Suspenda' && label.includes('Decote');
          return (
            <div key={i} className="flex justify-between items-center text-[11px] font-medium text-slate-800 bg-white/70 px-2 py-1 rounded">
               <div className="flex items-center gap-1">
                  <span className="text-emerald-800 font-bold uppercase text-[9px]">
                    {action} {s.pts} {s.pts === 1 ? 'pt.' : 'pts.'} {isCentral ? 'centrais' : ''}
                  </span>
                  {!isCentral && <span className="text-slate-600 font-semibold tracking-tighter self-end ml-1">+ {s.gap} carrs.</span>}
               </div>
               {!isCentral && <span className="bg-emerald-100 text-emerald-800 px-1.5 rounded-full text-[9px] font-black">{s.times} x</span>}
            </div>
          );
        })}
      </div>
      {extraInfo && extraInfo.length > 0 && (
        <div className="mt-2 pt-2 border-t border-emerald-100/50 grid grid-cols-2 gap-2">
          {extraInfo.map((info, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase font-bold">{info.label}:</span>
              <span className="text-[10px] text-emerald-950 font-black">{info.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DecreaseTable: React.FC<{ rows: number[]; label: string; initialSts: number; shaping?: { pts: number; gap: number; times: number }[]; isIncrease?: boolean }> = ({ rows, label, initialSts, shaping, isIncrease = false }) => {
  if (!rows || rows.length === 0) return null;

  // Reconstroi a lista de pontos modificados por evento
  const ptsPerEvent: number[] = [];
  if (shaping) {
    shaping.forEach(s => {
      for (let i = 0; i < s.times; i++) ptsPerEvent.push(s.pts);
    });
  }

  const data = rows.map((r, i) => {
    // Para simplificar, se não houver shaping, assume 2 pts para dec e 1 para inc
    const change = ptsPerEvent[i] !== undefined ? ptsPerEvent[i] : (isIncrease ? 1 : 2);
    return { row: r, change };
  });

  let currentSts = initialSts;
  const tableData = data.map(d => {
      // O usuário quer ver a quantidade de pontos que mudam no evento
      return { row: d.row, pts: d.change };
  });

  const half = Math.ceil(tableData.length / 2);
  const col1 = tableData.slice(0, half);
  const col2 = tableData.slice(half);

  return (
    <div className="mt-4 w-full">
      <h6 className="text-[10px] font-black text-slate-900 uppercase mb-2 border-b border-slate-200 pb-1 tracking-wider">{label}</h6>
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="grid grid-cols-2 bg-slate-200 text-[9px] font-black text-slate-800 px-2 py-1 rounded-t-md">
            <span>Carreira</span>
            <span className="text-right">Pts {isIncrease ? '+' : '-'}</span>
          </div>
          <div className="border-x border-b border-slate-200 rounded-b-md bg-white overflow-hidden">
            {col1.map((d, i) => (
              <div key={i} className={`grid grid-cols-2 text-[10px] px-2 py-1.5 border-b border-slate-50 last:border-0 font-mono ${i % 2 === 0 ? 'bg-slate-50/30' : ''}`}>
                <span className="text-slate-700 font-bold">{d.row.toString().padStart(3, '0')}</span>
                <span className="text-right text-blue-800 font-black">{d.pts}</span>
              </div>
            ))}
          </div>
        </div>
        {col2.length > 0 && (
          <div className="flex-1">
            <div className="grid grid-cols-2 bg-slate-200 text-[9px] font-black text-slate-800 px-2 py-1 rounded-t-md">
              <span>Carreira</span>
              <span className="text-right">Pts {isIncrease ? '+' : '-'}</span>
            </div>
            <div className="border-x border-b border-slate-200 rounded-b-md bg-white overflow-hidden">
              {col2.map((d, i) => (
                <div key={i} className={`grid grid-cols-2 text-[10px] px-2 py-1.5 border-b border-slate-50 last:border-0 font-mono ${i % 2 === 0 ? 'bg-slate-50/30' : ''}`}>
                  <span className="text-slate-700 font-bold">{d.row.toString().padStart(3, '0')}</span>
                  <span className="text-right text-blue-800 font-black">{d.pts}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const PieceContourCard: React.FC<PieceContourCardProps> = ({ 
  summary, 
  pieceName, 
  isPrint = false,
  availableSizes = [],
  activeSize,
  onSizeChange
}) => {
  const {
    bustSts,
    armholeStartRow,
    armholeRowsFront,
    armholeRowsBack,
    necklineFrontRows,
    necklineBackRows,
    initialArmholeBindoffSts,
    necklineFrontSts,
    necklineBackSts,
    wristSts,
    sleeveMaxSts,
    sleeveFinalSts,
    sleeveIncreaseRows,
    sleeveArmholeRowsFront,
    sleeveArmholeRowsBack,
    necklineType,
    necklineSelection,
    isOpenPiece,
    swatchStitches,
    swatchRows,
    bodyFrontDecRows,
    bodyBackDecRows,
    sleeveFrontDecRows,
    sleeveBackDecRows,
    sleeveIncreaseRowsList,
    bodyFrontShaping,
    bodyBackShaping,
    sleeveFrontShaping,
    sleeveBackShaping,
    sleeveIncShaping,
    necklineFrontShaping,
    necklineBackShaping,
    sleeveTopShaping,
    transpasseSts,
    frontBustSts,
    armholeType,
    shoulderSts,
    frontCrossChestSts,
    backCrossChestSts,
    ptsToDecFrontBodyPerSide,
    ptsToDecBackBodyPerSide,
    shoulderSlopeRows,
    isSleeveless
  } = summary;

  // Escala proporção: 1 ponto x 1 carreira
  // Em cm: W = 10/swatchStitches, H = 10/swatchRows
  const safeStitches = swatchStitches && swatchStitches > 0 ? swatchStitches : 32;
  const safeRows = swatchRows && swatchRows > 0 ? swatchRows : 46;
  const widthFactor = 10 / safeStitches;
  const heightFactor = 10 / safeRows;

  // Dimensões totais em "cm equivalentes"
  const totalW_cm = Math.max(10, Math.max(bustSts || 0, sleeveMaxSts || 0) * widthFactor);
  const totalH_cm = Math.max(10, Math.max(
    (armholeStartRow || 0) + Math.max(armholeRowsFront || 0, armholeRowsBack || 0), 
    (sleeveIncreaseRows || 0) + Math.max(sleeveArmholeRowsFront || 0, sleeveArmholeRowsBack || 0)
  ) * heightFactor);
  
  const padding = 60;
  const targetDimension = 500; // Increased to 500 for bolder and larger visualization on large screens
  
  const baseMultiplier = Math.min(targetDimension / totalW_cm, targetDimension / totalH_cm);
  
  const scaleX = baseMultiplier * widthFactor;
  const scaleY = baseMultiplier * heightFactor;

  const drawBody = (isFront: boolean) => {
    const isOpening = isFront && isOpenPiece;
    const tSts = transpasseSts || 0;
    const width = isOpening ? (frontBustSts || (bustSts / 2 - tSts / 2)) : bustSts;
    const hBase = armholeStartRow;
    const hRaglan = isFront ? armholeRowsFront : armholeRowsBack;
    const neckSts = isOpening ? (necklineFrontSts / 2 - tSts / 2) : (isFront ? necklineFrontSts : necklineBackSts);
    const neckRows = isFront ? necklineFrontRows : necklineBackRows;
    const bindoff = initialArmholeBindoffSts;
    const decRowsArr = isFront ? bodyFrontDecRows : bodyBackDecRows;
    const shapingArr = isFront ? bodyFrontShaping : bodyBackShaping;
    const neckShapingArr = isFront ? necklineFrontShaping : necklineBackShaping;
    const initialStsAtArmhole = width - (bindoff * 2);
    
    const centerX = width / 2;
    const isCavaRedonda = armholeType === 'Cava Redonda';
    const sSlope = isCavaRedonda ? (shoulderSlopeRows || 0) : 0;
    const sSts = isCavaRedonda ? (shoulderSts || 0) : 0;
    const ptsToDec = isCavaRedonda ? (isFront ? (ptsToDecFrontBodyPerSide || 0) : (ptsToDecBackBodyPerSide || 0)) : 0;

    const sel = (necklineSelection || '').toLowerCase();
    const isV = isFront && (sel.includes('v') || necklineType.startsWith('v'));
    const isSquare = isFront && sel.includes('quadrado');
    const isU = isFront && (sel.includes(' u') || sel.endsWith(' u') || sel === 'decote em u');
    const isCanoa = isFront && sel.includes('canoa');

    const renderBodySVG = (mirrored: boolean = false) => {
        let pathD = "";
        let widthForSvg = width;

        if (isCavaRedonda) {
            const getRoundArmholeShapingRows = (pts: number) => {
                if (pts <= 0) return 0;
                const initialBindoff = pts > 0 ? Math.max(1, Math.min(pts, Math.round(2 * safeStitches / 10))) : 0;
                const rem = Math.max(0, pts - initialBindoff);
                const base = Math.floor(rem / 3);
                const extra = rem % 3;
                const group1 = base + (extra >= 1 ? 1 : 0);
                const group2 = base + (extra >= 2 ? 1 : 0);
                const group3 = base;
                return 2 + (group1 * 1) + (group2 * 2) + (group3 * 3);
            };
            const calcCurveRows = getRoundArmholeShapingRows(ptsToDec);
            const curveRows = calcCurveRows > 0 ? Math.min(hRaglan, calcCurveRows) : Math.round(hRaglan * 0.4);
            if (isOpening) {
                // Se mirrored, o decote fica à direita, a cava à esquerda
                // topInternalX é o lado da abertura
                const topInternalX = mirrored ? width : 0;
                const topExternalX = mirrored ? width - neckSts : neckSts; 
                const shoulderOuterX = mirrored ? width - neckSts - sSts : neckSts + sSts;
                const armholeX = mirrored ? 0 : width;
                const hemX = mirrored ? 0 : width;
                const internalHemX = mirrored ? width : 0;

                const bOffX = mirrored ? bindoff : width - bindoff;
                const curveStartX = mirrored ? ptsToDec : width - ptsToDec;
                const curveStartY = hRaglan - curveRows;

                // Começamos na abertura na bainha (bainha interna)
                pathD = `M ${internalHemX * scaleX} ${(hRaglan + hBase) * scaleY}`;
                // Vai até o hemX na lateral
                pathD += ` L ${hemX * scaleX} ${(hRaglan + hBase) * scaleY}`;
                // Sobe reto até a cava
                pathD += ` L ${armholeX * scaleX} ${hRaglan * scaleY}`;
                // Arremate horizontal da cava
                pathD += ` L ${bOffX * scaleX} ${hRaglan * scaleY}`;
                // Curva da cava redonda (côncava)
                pathD += ` Q ${curveStartX * scaleX} ${hRaglan * scaleY} ${curveStartX * scaleX} ${curveStartY * scaleY}`;
                // Linha da cava até o ombro externo
                pathD += ` L ${shoulderOuterX * scaleX} ${sSlope * scaleY}`;
                // Inclinação do ombro até o decote externo (ombro interno)
                pathD += ` L ${topExternalX * scaleX} 0`;
                
                // Decote
                if (neckRows > 0) {
                    if (isV) {
                        // Decote em V (linha reta)
                        pathD += ` L ${topInternalX * scaleX} ${neckRows * scaleY}`;
                    } else if (isSquare) {
                        // Decote Quadrado
                        pathD += ` L ${topExternalX * scaleX} ${neckRows * scaleY} L ${topInternalX * scaleX} ${neckRows * scaleY}`;
                    } else if (isU) {
                        // Decote em U
                        const uStraight = neckRows * 0.55;
                        pathD += ` L ${topExternalX * scaleX} ${uStraight * scaleY}`;
                        pathD += ` C ${topExternalX * scaleX} ${neckRows * scaleY}, ${topInternalX * scaleX} ${neckRows * scaleY}, ${topInternalX * scaleX} ${neckRows * scaleY}`;
                    } else if (isCanoa) {
                        // Decote Canoa
                        const dir = mirrored ? -1 : 1;
                        const cp2X = topInternalX + dir * neckSts * 0.4;
                        const shallowY = neckRows * 0.4;
                        pathD += ` C ${topExternalX * scaleX} ${shallowY * scaleY}, ${cp2X * scaleX} ${shallowY * scaleY}, ${topInternalX * scaleX} ${neckRows * scaleY}`;
                    } else {
                        // Decote redondo (curva suave entrando horizontalmente na abertura)
                        const dir = mirrored ? -1 : 1;
                        const cp2X = topInternalX + dir * neckSts * 0.4;
                        pathD += ` C ${topExternalX * scaleX} ${neckRows * scaleY}, ${cp2X * scaleX} ${neckRows * scaleY}, ${topInternalX * scaleX} ${neckRows * scaleY}`;
                    }
                } else {
                    pathD += ` L ${topInternalX * scaleX} 0`;
                }

                // Desce reto pela abertura até o hem interno
                pathD += ` L ${topInternalX * scaleX} ${(hRaglan + hBase) * scaleY} Z`;
            } else {
                // Peça fechada (Frente ou Costas)
                const leftOuterShoulderX = centerX - (neckSts / 2 + sSts);
                const leftInnerShoulderX = centerX - neckSts / 2;
                const rightInnerShoulderX = centerX + neckSts / 2;
                const rightOuterShoulderX = centerX + (neckSts / 2 + sSts);

                const leftArmholeStartX = ptsToDec;
                const rightArmholeStartX = width - ptsToDec;
                const curveStartY = hRaglan - curveRows;

                // Começa no canto inferior esquerdo da bainha
                pathD = `M ${(centerX - width / 2) * scaleX} ${(hRaglan + hBase) * scaleY}`;
                // Vai até o canto inferior direito
                pathD += ` L ${(centerX + width / 2) * scaleX} ${(hRaglan + hBase) * scaleY}`;
                // Sobe reto pela lateral direita
                pathD += ` L ${(centerX + width / 2) * scaleX} ${hRaglan * scaleY}`;
                // Arremate horizontal da cava direita
                pathD += ` L ${(centerX + width / 2 - bindoff) * scaleX} ${hRaglan * scaleY}`;
                // Curva da cava direita (côncava)
                pathD += ` Q ${rightArmholeStartX * scaleX} ${hRaglan * scaleY} ${rightArmholeStartX * scaleX} ${curveStartY * scaleY}`;
                // Sobe até o ombro externo direito
                pathD += ` L ${rightOuterShoulderX * scaleX} ${sSlope * scaleY}`;
                // Inclinação do ombro direito até o decote direito (ombro interno direito)
                pathD += ` L ${rightInnerShoulderX * scaleX} 0`;

                // Decote
                if (neckRows > 0) {
                    if (isV) {
                        // Decote V na frente
                        pathD += ` L ${centerX * scaleX} ${neckRows * scaleY} L ${leftInnerShoulderX * scaleX} 0`;
                    } else if (isSquare) {
                        // Decote Quadrado
                        pathD += ` L ${rightInnerShoulderX * scaleX} ${neckRows * scaleY} L ${leftInnerShoulderX * scaleX} ${neckRows * scaleY} L ${leftInnerShoulderX * scaleX} 0`;
                    } else if (isU) {
                        // Decote em U
                        const uStraight = neckRows * 0.55;
                        pathD += ` L ${rightInnerShoulderX * scaleX} ${uStraight * scaleY}`;
                        pathD += ` C ${rightInnerShoulderX * scaleX} ${neckRows * scaleY}, ${leftInnerShoulderX * scaleX} ${neckRows * scaleY}, ${leftInnerShoulderX * scaleX} ${uStraight * scaleY}`;
                        pathD += ` L ${leftInnerShoulderX * scaleX} 0`;
                    } else if (isCanoa) {
                        // Decote Canoa
                        const cpY = neckRows * 0.4;
                        pathD += ` C ${rightInnerShoulderX * scaleX} ${cpY * scaleY}, ${leftInnerShoulderX * scaleX} ${cpY * scaleY}, ${leftInnerShoulderX * scaleX} 0`;
                    } else {
                        // Decote redondo (frente ou costas)
                        const cpY = neckRows * (4 / 3);
                        pathD += ` C ${rightInnerShoulderX * scaleX} ${cpY * scaleY}, ${leftInnerShoulderX * scaleX} ${cpY * scaleY}, ${leftInnerShoulderX * scaleX} 0`;
                    }
                } else {
                    pathD += ` L ${leftInnerShoulderX * scaleX} 0`;
                }

                // Inclinação do ombro esquerdo (do ombro interno até o ombro externo esquerdo)
                pathD += ` L ${leftOuterShoulderX * scaleX} ${sSlope * scaleY}`;
                // Desce até a cava esquerda top
                pathD += ` L ${leftArmholeStartX * scaleX} ${curveStartY * scaleY}`;
                // Curva da cava esquerda (côncava)
                pathD += ` Q ${leftArmholeStartX * scaleX} ${hRaglan * scaleY} ${(centerX - width / 2 + bindoff) * scaleX} ${hRaglan * scaleY}`;
                // Linha horizontal da cava até a quina esquerda
                pathD += ` L ${(centerX - width / 2) * scaleX} ${hRaglan * scaleY}`;
                // Linha vertical lateral esquerda de volta para a bainha
                pathD += ` Z`;
            }
        } else {
            if (isOpening) {
                // Se mirrored, o decote fica à direita, a cava à esquerda
                // topInternalX é o lado da abertura
                const topInternalX = mirrored ? width : 0;
                const topExternalX = mirrored ? width - neckSts : neckSts; 
                const armholeX = mirrored ? 0 : width;
                const hemX = mirrored ? 0 : width;
                const internalHemX = mirrored ? width : 0;
                
                const pts = [
                    { x: topInternalX, y: 0 },
                    { x: topExternalX, y: 0 },
                    { x: mirrored ? armholeX + bindoff : armholeX - bindoff, y: hRaglan },
                    { x: armholeX, y: hRaglan },
                    { x: hemX, y: hRaglan + hBase },
                    { x: internalHemX, y: hRaglan + hBase }
                ];

                pathD = `M ${pts[1].x * scaleX} ${pts[1].y * scaleY} L ${pts[2].x * scaleX} ${pts[2].y * scaleY} L ${pts[3].x * scaleX} ${pts[3].y * scaleY} L ${pts[4].x * scaleX} ${pts[4].y * scaleY} L ${pts[5].x * scaleX} ${pts[5].y * scaleY}`;
                
                if (neckRows > 0) {
                    pathD += ` L ${topInternalX * scaleX} ${neckRows * scaleY}`;
                    if (isV) {
                        pathD += ` L ${pts[1].x * scaleX} ${pts[1].y * scaleY} Z`;
                    } else if (isSquare) {
                        pathD += ` L ${pts[1].x * scaleX} ${neckRows * scaleY} L ${pts[1].x * scaleX} ${pts[1].y * scaleY} Z`;
                    } else if (isU) {
                        const uStraight = neckRows * 0.55;
                        pathD += ` C ${topInternalX * scaleX} ${neckRows * scaleY}, ${pts[1].x * scaleX} ${neckRows * scaleY}, ${pts[1].x * scaleX} ${uStraight * scaleY} L ${pts[1].x * scaleX} ${pts[1].y * scaleY} Z`;
                    } else if (isCanoa) {
                        const dir = mirrored ? -1 : 1;
                        const cp1X = topInternalX + dir * neckSts * 0.4;
                        const shallowY = neckRows * 0.4;
                        pathD += ` C ${cp1X * scaleX} ${shallowY * scaleY}, ${pts[1].x * scaleX} ${shallowY * scaleY}, ${pts[1].x * scaleX} ${pts[1].y * scaleY} Z`;
                    } else {
                        const dir = mirrored ? -1 : 1;
                        const cp1X = topInternalX + dir * neckSts * 0.4;
                        pathD += ` C ${cp1X * scaleX} ${neckRows * scaleY}, ${pts[1].x * scaleX} ${neckRows * scaleY}, ${pts[1].x * scaleX} ${pts[1].y * scaleY} Z`;
                    }
                } else {
                    pathD += ` L ${pts[0].x * scaleX} ${pts[0].y * scaleY} Z`;
                }
            } else {
                const leftRaglanTopX = centerX - neckSts / 2;
                const rightRaglanTopX = centerX + neckSts / 2;
                
                const pts = [
                    { x: centerX + width / 2, y: hRaglan + hBase },
                    { x: centerX - width / 2, y: hRaglan + hBase },
                    { x: centerX - width / 2, y: hRaglan },
                    { x: centerX - (width / 2 - bindoff), y: hRaglan },
                    { x: leftRaglanTopX, y: 0 },
                    { x: rightRaglanTopX, y: 0 },
                    { x: centerX + (width / 2 - bindoff), y: hRaglan },
                    { x: centerX + width / 2, y: hRaglan },
                ];

                pathD = `M ${pts[0].x * scaleX} ${pts[0].y * scaleY} L ${pts[1].x * scaleX} ${pts[1].y * scaleY} L ${pts[2].x * scaleX} ${pts[2].y * scaleY} L ${pts[3].x * scaleX} ${pts[3].y * scaleY} L ${pts[4].x * scaleX} ${pts[4].y * scaleY}`;
                
                if (neckRows > 0) {
                    if (isV) {
                        pathD += ` L ${centerX * scaleX} ${neckRows * scaleY} L ${pts[5].x * scaleX} ${pts[5].y * scaleY}`;
                    } else if (isSquare) {
                        pathD += ` L ${pts[4].x * scaleX} ${neckRows * scaleY} L ${pts[5].x * scaleX} ${neckRows * scaleY} L ${pts[5].x * scaleX} ${pts[5].y * scaleY}`;
                    } else if (isU) {
                        const uStraight = neckRows * 0.55;
                        pathD += ` L ${pts[4].x * scaleX} ${uStraight * scaleY}`;
                        pathD += ` C ${pts[4].x * scaleX} ${neckRows * scaleY}, ${pts[5].x * scaleX} ${neckRows * scaleY}, ${pts[5].x * scaleX} ${uStraight * scaleY}`;
                        pathD += ` L ${pts[5].x * scaleX} ${pts[5].y * scaleY}`;
                    } else if (isCanoa) {
                        const cpY = neckRows * 0.4;
                        pathD += ` C ${pts[4].x * scaleX} ${cpY * scaleY}, ${pts[5].x * scaleX} ${cpY * scaleY}, ${pts[5].x * scaleX} ${pts[5].y * scaleY}`;
                    } else {
                        const cpY = neckRows * (4 / 3);
                        pathD += ` C ${pts[4].x * scaleX} ${cpY * scaleY}, ${pts[5].x * scaleX} ${cpY * scaleY}, ${pts[5].x * scaleX} ${pts[5].y * scaleY}`;
                    }
                } else {
                    pathD += ` L ${pts[5].x * scaleX} ${pts[5].y * scaleY}`;
                }
                
                pathD += ` L ${pts[6].x * scaleX} ${pts[6].y * scaleY} L ${pts[7].x * scaleX} ${pts[7].y * scaleY} Z`;
            }
        }

        const labelPosNeckX = isOpening ? (mirrored ? (width - neckSts/2) : (neckSts/2)) : centerX;
        const armholeLabelX = isOpening ? (mirrored ? 8 : widthForSvg - 8) : widthForSvg - 8;
        const shadowTextX = isOpening ? (mirrored ? width - neckSts/2 : neckSts/2) : centerX;

        const svgW = (widthForSvg * scaleX) + padding;
        const svgH = ((hBase + hRaglan) * scaleY) + padding;

        return (
            <svg 
              viewBox={`0 0 ${svgW} ${svgH}`}
              width="100%"
              style={{ maxWidth: `${svgW}px` }}
              className="bg-white rounded-xl border border-slate-200 shadow-inner overflow-visible w-full h-auto"
            >
                <GridDefs scaleX={scaleX} scaleY={scaleY} />
                <rect width="100%" height="100%" fill="url(#gridMain)" rx="8" />
                <g transform={`translate(${padding / 2}, ${padding / 2})`}>
                    <path d={pathD} fill="rgba(180, 83, 9, 0.05)" stroke="#B45309" strokeWidth="2" strokeLinejoin="round" />
                    {/* Rótulo de Pontos do Hem */}
                    <text x={(widthForSvg / 2) * scaleX} y={(hRaglan + hBase) * scaleY + 22} textAnchor="middle" className="fill-slate-800 text-[12px] font-black">{width} pts</text>
                    {/* Rótulo de Carreiras do Corpo */}
                    <text x={(armholeLabelX * scaleX) + (isOpening && mirrored ? 0 : 0)} y={(hRaglan + hBase / 2) * scaleY} transform={`rotate(90, ${armholeLabelX * scaleX}, ${(hRaglan + hBase / 2) * scaleY})`} textAnchor="middle" className="fill-emerald-800 text-[11px] font-bold">{hBase} car.</text>
                    
                    {/* Rótulo de Pontos do Decote (Topo) */}
                    <text x={labelPosNeckX * scaleX} y={-14} textAnchor="middle" className="fill-amber-700 text-[11px] font-bold">{neckSts} pts dec.</text>
                    
                    {/* Rótulo de Carreiras da Cava (Raglan) - Horizontal no Meio */}
                    <text x={(centerX) * scaleX} y={(hRaglan / 2) * scaleY} textAnchor="middle" className="fill-slate-600 text-[11px] font-black uppercase tracking-tighter bg-white/50">{hRaglan} car. cava</text>
                </g>
            </svg>
        );
    };
    
    return (
      <div className="flex flex-col bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow w-full max-w-full">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex flex-col items-center w-full lg:flex-[1.4] lg:max-w-[60%]">
            <h5 className="text-slate-800 font-black mb-4 text-[13px] uppercase tracking-widest border-b-2 border-amber-500 pb-1.5 w-full text-center">
                {isFront ? (isOpening ? 'Frente (Par)' : 'Frente') : 'Costas'}
            </h5>
            <div className="flex flex-wrap justify-center gap-4 w-full">
                {renderBodySVG(false)}
                {isOpening && renderBodySVG(true)}
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 w-full text-[11px] bg-white p-3 rounded-lg border border-slate-200 shadow-sm font-medium">
                <span className="text-slate-600">Arremate Cava:</span> <span className="text-right font-black text-slate-900">{bindoff} pts</span>
                <span className="text-slate-600">Total Raglan:</span> <span className="text-right font-black text-slate-900">{hRaglan} car.</span>
                <span className="text-slate-600">Pts. Finais:</span> <span className="text-right font-black text-amber-700">{neckSts} pts</span>
            </div>
          </div>
          <div className="flex-1 w-full lg:max-w-xl">
             <ShapingSummary 
                shaping={shapingArr} 
                label={`Plano de Cava ${isFront ? 'Frente' : 'Costas'}`} 
                extraInfo={[
                  { label: isFront ? 'Largura Frente' : 'Largura Costas', value: `${width} pts` },
                  { label: 'Total Raglan', value: `${hRaglan} carrs.` },
                  { label: 'Início na Carr.', value: '0' }
                ]}
             />
             <ShapingSummary 
                shaping={neckShapingArr} 
                label={`Plano do Decote ${isFront ? 'Frente' : 'Costas'}`} 
                action="Suspenda"
                extraInfo={[
                  { label: 'Largura Decote', value: `${neckSts} pts` },
                  { label: 'Carreiras Decote', value: `${neckRows} carrs.` },
                  { label: 'Início na Carr.', value: `${hRaglan - neckRows}` }
                ]}
             />
             <DecreaseTable 
                rows={decRowsArr || []} 
                label="Diminuições Passo a Passo" 
                initialSts={initialStsAtArmhole} 
                shaping={shapingArr}
             />
          </div>
        </div>
      </div>
    );
  };

  const drawSleeve = () => {
    const wWrist = wristSts;
    const wMax = sleeveMaxSts;
    const wFinal = sleeveFinalSts;
    const hInc = sleeveIncreaseRows;
    const hRaglanF = sleeveArmholeRowsFront;
    const hRaglanB = sleeveArmholeRowsBack;
    const bindoff = initialArmholeBindoffSts;
    const isCavaRedonda = armholeType === 'Cava Redonda';

    const maxHRaglan = Math.max(hRaglanF, hRaglanB);
    const initialStsAtSleeveArmhole = wMax - (bindoff * 2);

    const renderSleeveSVG = (mirrored: boolean = false) => {
        const hRagF = mirrored ? sleeveArmholeRowsBack : sleeveArmholeRowsFront;
        const hRagB = mirrored ? sleeveArmholeRowsFront : sleeveArmholeRowsBack;
        const centerX = wMax / 2;
        let pathData = "";

        if (isCavaRedonda) {
            // Desenho do topo de manga de Cava Redonda (bell-shaped sleeve cap)
            // Começa no canto inferior esquerdo do punho
            pathData = `M ${(centerX - wWrist / 2) * scaleX} ${(maxHRaglan + hInc) * scaleY}`;
            // Linha lateral esquerda até o início da cava (sob as axilas)
            pathData += ` L ${(centerX - wMax / 2) * scaleX} ${maxHRaglan * scaleY}`;
            // Arremate horizontal da cava esquerda (bindoff)
            pathData += ` L ${(centerX - (wMax / 2 - bindoff)) * scaleX} ${maxHRaglan * scaleY}`;
            
            // Curva S (Bell Curve) da cava esquerda até o topo da manga
            // Do ponto (centerX - (wMax/2 - bindoff), maxHRaglan) até o topo esquerdo (centerX - wFinal/2, 0)
            const leftStart = centerX - (wMax / 2 - bindoff);
            const leftEnd = centerX - wFinal / 2;
            const widthDiff = (wMax - wFinal) / 2;
            const hCurveW = Math.max(0, widthDiff - bindoff);
            const leftCp1X = leftStart + hCurveW * 0.45;
            const leftCp1Y = maxHRaglan * 0.95;
            const leftCp2X = leftEnd - hCurveW * 0.35;
            const leftCp2Y = maxHRaglan * 0.05;
            pathData += ` C ${leftCp1X * scaleX} ${leftCp1Y * scaleY} ${leftCp2X * scaleX} ${leftCp2Y * scaleY} ${leftEnd * scaleX} 0`;
            
            // Linha horizontal reta do topo plano da manga
            pathData += ` L ${(centerX + wFinal / 2) * scaleX} 0`;
            
            // Curva S (Bell Curve) da cava direita, descendo do topo direito (centerX + wFinal/2, 0) até a cava direita (centerX + wMax/2 - bindoff, maxHRaglan)
            const rightStart = centerX + wFinal / 2;
            const rightEnd = centerX + (wMax / 2 - bindoff);
            const rightCp1X = rightStart + hCurveW * 0.35;
            const rightCp1Y = maxHRaglan * 0.05;
            const rightCp2X = rightEnd - hCurveW * 0.45;
            const rightCp2Y = maxHRaglan * 0.95;
            pathData += ` C ${rightCp1X * scaleX} ${rightCp1Y * scaleY} ${rightCp2X * scaleX} ${rightCp2Y * scaleY} ${rightEnd * scaleX} ${maxHRaglan * scaleY}`;
            
            // Arremate horizontal da cava direita (para a borda)
            pathData += ` L ${(centerX + wMax / 2) * scaleX} ${maxHRaglan * scaleY}`;
            // Linha lateral direita descendo de volta para o punho
            pathData += ` L ${(centerX + wWrist / 2) * scaleX} ${(maxHRaglan + hInc) * scaleY}`;
            // Fecha o caminho de volta para o punho esquerdo
            pathData += ` Z`;
        } else {
            const pts = [
                { x: centerX - wFinal / 2, y: maxHRaglan - hRagF }, // Topo Esquerda
                { x: centerX + wFinal / 2, y: maxHRaglan - hRagB }, // Topo Direita
                { x: centerX + wMax / 2 - bindoff, y: maxHRaglan },      // Cava Direita (início raglan)
                { x: centerX + wMax / 2, y: maxHRaglan },               // Cava Direita (arremate)
                { x: centerX + wWrist / 2, y: maxHRaglan + hInc },      // Punho Direita
                { x: centerX - wWrist / 2, y: maxHRaglan + hInc },      // Punho Esquerda
                { x: centerX - wMax / 2, y: maxHRaglan },               // Cava Esquerda (arremate)
                { x: centerX - (wMax / 2 - bindoff), y: maxHRaglan },   // Cava Esquerda (início raglan)
            ];

            pathData = `M ${pts.map(p => `${p.x * scaleX} ${p.y * scaleY}`).join(' L ')} Z`;
        }
        const labelF = mirrored ? 'C' : 'F';
        const labelB = mirrored ? 'F' : 'C';

        const svgW = (wMax * scaleX) + padding;
        const svgH = ((hInc + maxHRaglan) * scaleY) + padding;

        return (
            <svg 
              viewBox={`0 0 ${svgW} ${svgH}`}
              width="100%"
              style={{ maxWidth: `${svgW}px` }}
              className="bg-white rounded-xl border border-slate-200 shadow-inner overflow-visible w-full h-auto"
            >
              <GridDefs scaleX={scaleX} scaleY={scaleY} />
              <rect width="100%" height="100%" fill="url(#gridMain)" rx="8" />
              <g transform={`translate(${padding / 2}, ${padding / 2})`}>
                <path d={pathData} fill="rgba(180, 83, 9, 0.05)" stroke="#B45309" strokeWidth="2" strokeLinejoin="round" />
                {/* Punho */}
                <text x={(centerX) * scaleX} y={(maxHRaglan + hInc) * scaleY + 22} textAnchor="middle" className="fill-slate-800 text-[12px] font-black">{wWrist} pts</text>
                {/* Carreiras Punho-Cava */}
                <text x={(centerX + wMax / 2) * scaleX - 12} y={(maxHRaglan + hInc / 2) * scaleY} transform={`rotate(90, ${(centerX + wMax / 2) * scaleX - 12}, ${(maxHRaglan + hInc / 2) * scaleY})`} textAnchor="middle" className="fill-emerald-800 text-[11px] font-bold">{hInc} car.</text>
                {/* Topo */}
                <text x={(centerX) * scaleX} y={-14} textAnchor="middle" className="fill-slate-800 text-[12px] font-black">{wFinal} pts topo</text>
                
                {/* Máximo Cava Stitches */}
                <text x={(centerX) * scaleX} y={(maxHRaglan * scaleY) + 14} textAnchor="middle" className="fill-amber-700 text-[11px] font-black">{wMax} pts cava</text>
                
                {/* Carreiras Cava (Manga) - Horizontal */}
                <text x={(centerX - wMax/4) * scaleX} y={(maxHRaglan - hRagF/2) * scaleY} textAnchor="middle" className="fill-slate-600 text-[10px] font-black uppercase tracking-tighter">{hRagF} car. {labelF}</text>
                <text x={(centerX + wMax/4) * scaleX} y={(maxHRaglan - hRagB/2) * scaleY} textAnchor="middle" className="fill-slate-600 text-[10px] font-black uppercase tracking-tighter">{hRagB} car. {labelB}</text>
              </g>
            </svg>
        );
    };

    return (
      <div className="flex flex-col bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow w-full max-w-full mx-auto">
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          <div className="flex flex-col items-center w-full xl:flex-[1.4] xl:max-w-[60%]">
            <h5 className="text-slate-800 font-black mb-4 text-[13px] uppercase tracking-widest border-b-2 border-amber-500 pb-1.5 w-full text-center">Mangas (Par)</h5>
            <div className="flex flex-wrap justify-center gap-4 w-full">
                {renderSleeveSVG(false)}
                {renderSleeveSVG(true)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 w-full text-[11px] bg-white p-3 rounded-lg border border-slate-200 shadow-sm font-medium">
                <span className="text-slate-600">Total Cava F/C:</span> <span className="text-right font-black text-slate-900">{hRaglanF} / {hRaglanB} car.</span>
                <span className="text-slate-600">Máximo Cava:</span> <span className="text-right font-black text-amber-700">{wMax} pts</span>
            </div>
          </div>
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="md:col-span-2">
                <ShapingSummary 
                    shaping={sleeveIncShaping} 
                    label="Plano de Aumentos (Punho)" 
                    action="Aumentar" 
                    extraInfo={[{ label: 'Início na Carr.', value: '0' }]}
                />
                <DecreaseTable 
                    rows={sleeveIncreaseRowsList || []} 
                    label="Sequência de Aumentos" 
                    initialSts={wWrist} 
                    shaping={sleeveIncShaping}
                    isIncrease={true}
                />
            </div>

            <ShapingSummary 
                shaping={sleeveFrontShaping} 
                label="Plano Cava Frente" 
            />
            <ShapingSummary 
                shaping={sleeveBackShaping} 
                label="Plano Cava Costas" 
            />

            <div className="md:col-span-2 -mt-2 mb-2">
                <p className="text-xs text-blue-800 font-bold italic bg-blue-100/50 px-2 py-1 rounded border border-blue-200 inline-block">
                    * Zere o contador de carreiras ao iniciar as cavas da manga.
                </p>
            </div>

            <DecreaseTable 
                rows={sleeveFrontDecRows || []} 
                label="Seq. Cava Frente" 
                initialSts={initialStsAtSleeveArmhole} 
                shaping={sleeveFrontShaping}
            />
            <DecreaseTable 
                rows={sleeveBackDecRows || []} 
                label="Seq. Cava Costas" 
                initialSts={initialStsAtSleeveArmhole} 
                shaping={sleeveBackShaping}
            />

            <div className="md:col-span-2 mt-4">
                {sleeveTopShaping && sleeveTopShaping.length > 0 && (
                    <div className="mb-4">
                        <ShapingSummary 
                            shaping={sleeveTopShaping} 
                            label="Plano da Curva do Topo (Manga)" 
                            action="Suspenda" 
                            extraInfo={[
                                { label: 'Pts. Topo', value: `${wFinal} pts` },
                                { label: 'Diferença Cavas', value: `${Math.abs(hRaglanB - hRaglanF)} carrs.` },
                                { label: 'Início na Carr.', value: `${Math.min(hRaglanF, hRaglanB)}` }
                            ]}
                        />
                        <p className={`text-[9px] ${isPrint ? 'text-slate-500' : 'text-white'} italic mt-1 px-1`}>
                            * Os pontos finais podem ser arrematados ou retirados em fio de outra cor da máquina. Ao final, você terá {wFinal} pts.
                        </p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8 border-t border-white/20 pt-8 w-full">
      <h4 className="text-center font-bold mb-6 text-xl text-blue-600 uppercase tracking-tight">Esquema Visual (Contornos)</h4>
      
      {!isPrint && availableSizes.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8 px-4">
          {availableSizes.map(size => (
            <button 
              key={size} 
              onClick={() => onSizeChange?.(size)} 
              className={`px-5 py-2 text-[11px] font-black rounded-full transition-all border shadow-sm ${activeSize === size ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400/20' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'}`}
            >
              TAMANHO {size}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-8 w-full max-w-[1500px] mx-auto">
        <div className="flex flex-wrap justify-center gap-8 w-full">
          {drawBody(true)}
          {drawBody(false)}
        </div>
        {!isSleeveless && (
          <div className="w-full flex justify-center">
            {drawSleeve()}
          </div>
        )}
      </div>
    </div>
  );
};
