
export const CHILD_SIZES = [
  'RN - 0 a 3 meses',
  'P - 3 a 6 meses',
  'M - 6 a 9 meses',
  'G - 9 a 12 meses',
  '1a. - 12 a 18 meses',
] as const;
export const TEEN_SIZES = ['2a', '4a', '6a', '8a', '10a', '12a', '14a', '16a'] as const;
export const ADULT_SIZES = ['PP', 'P', 'M', 'G', 'GG'] as const;

export const ALL_SIZES = Array.from(new Set([...CHILD_SIZES, ...TEEN_SIZES, ...ADULT_SIZES]));

export type Size = typeof CHILD_SIZES[number] | typeof TEEN_SIZES[number] | typeof ADULT_SIZES[number];
export type SizeCategory = 'child' | 'teen' | 'adult';

type SizeRecord<T> = Record<string, T>;

export interface BodyMeasurements {
  bustWidth: SizeRecord<string>;
  initialArmholeBindoff: SizeRecord<string>;
  necklineFrontWidth: SizeRecord<string>;
  necklineBackWidth: SizeRecord<string>;
  hemToArmholeHeight: SizeRecord<string>;
  armholeHeightFront: SizeRecord<string>;
  armholeHeightBack: SizeRecord<string>;
  necklineBackDepth: SizeRecord<string>;
  necklineFrontDepth: SizeRecord<string>;
  totalBodyLength: SizeRecord<string>;
  // Cava Redonda fields
  roundBustWidth?: SizeRecord<string>;
  roundShoulderWidth?: SizeRecord<string>;
  roundBackNecklineWidth?: SizeRecord<string>;
  roundFrontCrossChest?: SizeRecord<string>;
  roundBackCrossChest?: SizeRecord<string>;
  roundHemToArmholeHeight?: SizeRecord<string>;
  roundArmholeHeight?: SizeRecord<string>;
  roundShoulderSlope?: SizeRecord<string>;
  roundBackNecklineDepth?: SizeRecord<string>;
  roundFrontNecklineDepthRound?: SizeRecord<string>;
  roundFrontNecklineDepthV?: SizeRecord<string>;
}

export interface SleeveMeasurements {
  wristWidth: SizeRecord<string>;
  sleeveMaxWidth: SizeRecord<string>;
  sleeveFinalWidth: SizeRecord<string>;
  sleeveHemToArmholeHeight: SizeRecord<string>;
  sleeveArmholeHeightFront: SizeRecord<string>;
  sleeveArmholeHeightBack: SizeRecord<string>;
  totalSleeveLength: SizeRecord<string>;
  // Cava Redonda fields
  roundSleeveWristWidth?: SizeRecord<string>;
  roundSleeveMaxWidth?: SizeRecord<string>;
  roundSleeveFinalBindoff?: SizeRecord<string>;
  roundSleeveHemToArmholeHeight?: SizeRecord<string>;
  roundSleeveCapHeight?: SizeRecord<string>;
}

export interface RecipeDetails {
  ribbingType: string;
  ribbingGauge: string;
  ribbingRows: string;
  ribbingHeightCm: string;
  raglanDecreaseType: '1' | '2' | '3';
  vNeckDecreaseType: '1' | '2' | '3';
  armholeFinishingWidth?: string;
}

export interface FinishingDetails {
  type: 'horizontal' | 'vertical' | 'folded_bias';
  swatchStitches: string;
  swatchRows: string;
  width?: string;
  neckRibRows?: string;
}

export interface FormData {
  pieceName: string;
  isOpenPiece: boolean;
  isSleeveless: boolean; 
  buttonBandWidth: string;
  necklineType: 'round' | 'v_1' | 'v_2';
  
  machineBrand: string;
  machineModel: string;
  swatchStitches: string;
  swatchRows: string;
  stitchType: string;
  yarn: string;
  gauge: string;

  recipeDetails: RecipeDetails;
  finishing: FinishingDetails;
  bodyMeasurements: BodyMeasurements;
  sleeveMeasurements: SleeveMeasurements;
}

export interface ShapingInstruction {
  instructions: string[];
  startRow?: number;
  notes?: string;
}

export interface RecipeContext {
  pieceName?: string; 
  swatch: string;
  stitchType?: string;
  yarn?: string;
  gauge?: string;
  machineBrand?: string;
  machineModel?: string;
  ribbingType?: string;
  ribbingGauge?: string;
  ribbingRows?: string;
  ribbingHeightCm?: string; 
  barSwatch?: string;
  buttonBandSwatch?: string;
  finishingSwatch?: string;
}

export interface RecipeStep {
  title: string;
  description: string;
  shaping?: ShapingInstruction;
  technicalDetails?: string[];
}

export interface RecipePart {
  title: string;
  steps: RecipeStep[];
}

export interface CalculationSummary {
  bustSts: number;
  frontBustSts?: number;
  armholeStartRow: number;
  totalBodyRows: number;
  isSleeveless?: boolean;
  armholeRowsFront: number;
  armholeRowsBack: number;
  necklineFrontRows: number;
  necklineBackRows: number; 
  initialArmholeBindoffSts: number;
  necklineFrontSts: number;
  necklineBackSts: number;
  wristSts: number;
  sleeveMaxSts: number;
  sleeveFinalSts: number;
  sleeveIncreaseRows: number;
  sleeveArmholeRowsFront: number;
  sleeveArmholeRowsBack: number;
  // Perímetros em cm
  necklineFrontPeri: number;
  necklineBackPeri: number;
  sleeveTopPeri: number;
  totalNecklinePeri: number;
  armholeContourPeri?: number;
  sleeveCapContourPeri?: number;
  perimeterDifference?: number;
  transpasseSts?: number;
  armholeType?: string;
  shoulderSts?: number;
  frontCrossChestSts?: number;
  backCrossChestSts?: number;
  ptsToDecFrontBodyPerSide?: number;
  ptsToDecBackBodyPerSide?: number;
  shoulderSlopeRows?: number;
  // Metadata para desenho
  necklineType: 'round' | 'v_1' | 'v_2';
  necklineSelection?: string;
  isOpenPiece: boolean;
  swatchStitches: number;
  swatchRows: number;
  // Sequências de diminuições
  bodyFrontDecRows?: number[];
  bodyBackDecRows?: number[];
  sleeveFrontDecRows?: number[];
  sleeveBackDecRows?: number[];
  sleeveIncreaseRowsList?: number[];
  // Resumos de sequências para o desenho
  bodyFrontShaping?: { pts: number; gap: number; times: number }[];
  bodyBackShaping?: { pts: number; gap: number; times: number }[];
  sleeveFrontShaping?: { pts: number; gap: number; times: number }[];
  sleeveBackShaping?: { pts: number; gap: number; times: number }[];
  sleeveIncShaping?: { pts: number; gap: number; times: number }[];
  necklineFrontShaping?: { pts: number; gap: number; times: number }[];
  necklineBackShaping?: { pts: number; gap: number; times: number }[];
  sleeveTopShaping?: { pts: number; gap: number; times: number }[];
}

export const SUMMARY_LABELS: Partial<Record<keyof CalculationSummary, string>> = {
  bustSts: 'Pts Busto',
  frontBustSts: 'Pts Frente (Total)',
  shoulderSts: 'Pts. Ombro',
  frontCrossChestSts: 'Pts. Busto Frente (Cross Chest)',
  backCrossChestSts: 'Pts. Busto Costas (Cross Chest)',
  ptsToDecFrontBodyPerSide: 'Pts. Dim. Cava Frente',
  ptsToDecBackBodyPerSide: 'Pts. Dim. Cava Costas',
  shoulderSlopeRows: 'Carrs. Inclinação do Ombro',
  armholeStartRow: 'Carrs. até Cava',
  armholeRowsFront: 'Carrs. Raglan Frente',
  armholeRowsBack: 'Carrs. Raglan Costas',
  necklineFrontRows: 'Carrs. Decote Frente',
  necklineBackRows: 'Carrs. Decote Costas',
  totalBodyRows: 'Total Carrs. Corpo',
  initialArmholeBindoffSts: 'Pts Arremate Inicial Cava',
  necklineFrontSts: 'Pts Decote Frente (Topo)',
  necklineBackSts: 'Pts Decote Costas (Topo)',
  wristSts: 'Pts Punho',
  sleeveMaxSts: 'Pts Largura Máx. Manga',
  sleeveFinalSts: 'Pts Topo da Manga',
  sleeveIncreaseRows: 'Carrs. até Cava (Manga)',
  sleeveArmholeRowsFront: 'Carrs. Raglan Manga (F)',
  sleeveArmholeRowsBack: 'Carrs. Raglan Manga (C)',
  necklineFrontPeri: 'Perímetro Decote Frente (cm)',
  necklineBackPeri: 'Perímetro Decote Costas (cm)',
  sleeveTopPeri: 'Perímetro Topo Manga (cm)',
  totalNecklinePeri: 'Perímetro Total Decote (cm)',
  armholeContourPeri: 'Perímetro Contorno Cavas (cm)',
  sleeveCapContourPeri: 'Perímetro Contorno Cabeça Manga (cm)',
  perimeterDifference: 'Diferença Contornos Cava/Manga',
  transpasseSts: 'Pts Transpasse (Abotoamento)',
  armholeType: 'Tipo de Cava',
  necklineType: 'Tipo de Decote',
  isOpenPiece: 'Peça Aberta',
  swatchStitches: 'Pontos por 10cm (Calculado)',
  swatchRows: 'Carreiras por 10cm (Calculado)',
  bodyFrontDecRows: 'Série Diminuições Frente',
  bodyBackDecRows: 'Série Diminuições Costas',
  sleeveFrontDecRows: 'Série Diminuições Manga (F)',
  sleeveBackDecRows: 'Série Diminuições Manga (C)',
  sleeveIncreaseRowsList: 'Série Aumentos Manga',
  bodyFrontShaping: 'Esquema Modelagem Frente',
  bodyBackShaping: 'Esquema Modelagem Costas',
  sleeveFrontShaping: 'Esquema Modelagem Manga (F)',
  sleeveBackShaping: 'Esquema Modelagem Manga (C)',
  sleeveIncShaping: 'Esquema Aumentos Manga',
  necklineFrontShaping: 'Esquema Modelagem Decote Frente',
  necklineBackShaping: 'Esquema Modelagem Decote Costas',
  sleeveTopShaping: 'Esquema Curva Topo Manga',
};

export interface AppResult {
  context: RecipeContext;
  recipeParts: RecipePart[];
  summary?: CalculationSummary;
}

export function getVisibleSummaryEntries(summary: CalculationSummary): { key: string; label: string; value: any }[] {
  const isCavaRedonda = summary.armholeType === 'Cava Redonda';
  const isSleeveless = summary.isSleeveless === true;

  const entries: { key: string; label: string; value: any }[] = [];

  const getLabel = (key: keyof CalculationSummary): string => {
    if (isCavaRedonda) {
      if (key === 'armholeRowsFront') return 'Carrs. Cava Frente';
      if (key === 'armholeRowsBack') return 'Carrs. Cava Costas';
      if (key === 'sleeveArmholeRowsFront') return 'Carrs. Cabeça da Manga (F)';
      if (key === 'sleeveArmholeRowsBack') return 'Carrs. Cabeça da Manga (C)';
    } else {
      if (key === 'armholeRowsFront') return 'Carrs. Raglan Frente';
      if (key === 'armholeRowsBack') return 'Carrs. Raglan Costas';
      if (key === 'sleeveArmholeRowsFront') return 'Carrs. Raglan Manga (F)';
      if (key === 'sleeveArmholeRowsBack') return 'Carrs. Raglan Manga (C)';
    }
    return SUMMARY_LABELS[key] || String(key);
  };

  const keysOrder: (keyof CalculationSummary)[] = [
    'armholeType',
    'bustSts',
    'frontBustSts',
    'armholeStartRow',
    'totalBodyRows',
    'armholeRowsFront',
    'armholeRowsBack',
    'shoulderSts',
    'frontCrossChestSts',
    'backCrossChestSts',
    'ptsToDecFrontBodyPerSide',
    'ptsToDecBackBodyPerSide',
    'shoulderSlopeRows',
    'necklineFrontSts',
    'necklineBackSts',
    'necklineFrontRows',
    'necklineBackRows',
    'wristSts',
    'sleeveMaxSts',
    'sleeveFinalSts',
    'sleeveIncreaseRows',
    'sleeveArmholeRowsFront',
    'sleeveArmholeRowsBack',
    'transpasseSts',
    'necklineFrontPeri',
    'necklineBackPeri',
    'sleeveTopPeri',
    'totalNecklinePeri',
    'armholeContourPeri',
    'sleeveCapContourPeri',
    'perimeterDifference',
    'swatchStitches',
    'swatchRows'
  ];

  for (const k of keysOrder) {
    const val = summary[k];
    if (val === undefined || val === null || Array.isArray(val)) {
      continue;
    }

    if (k === 'isOpenPiece' || k === 'necklineType' || k === 'isSleeveless') {
      continue;
    }

    if (isCavaRedonda && k === 'sleeveTopPeri') {
      continue;
    }

    if (isSleeveless && [
      'wristSts', 'sleeveMaxSts', 'sleeveFinalSts', 
      'sleeveIncreaseRows', 'sleeveArmholeRowsFront', 'sleeveArmholeRowsBack',
      'sleeveTopPeri', 'armholeContourPeri', 'sleeveCapContourPeri', 'perimeterDifference'
    ].includes(k as string)) {
      continue;
    }

    if (!isCavaRedonda && [
      'shoulderSts', 'frontCrossChestSts', 'backCrossChestSts', 
      'ptsToDecFrontBodyPerSide', 'ptsToDecBackBodyPerSide', 'shoulderSlopeRows',
      'armholeContourPeri', 'sleeveCapContourPeri', 'perimeterDifference'
    ].includes(k as string)) {
      continue;
    }

    if (k === 'transpasseSts' && (typeof val === 'number' && val === 0)) {
      continue;
    }

    let formattedVal = val;
    if (typeof val === 'boolean') {
      formattedVal = val ? 'Sim' : 'Não';
    } else if (typeof val === 'number') {
      if (['necklineFrontPeri', 'necklineBackPeri', 'sleeveTopPeri', 'totalNecklinePeri', 'armholeContourPeri', 'sleeveCapContourPeri'].includes(k as string)) {
        formattedVal = `${val.toFixed(1)} cm`;
      } else if (k === 'perimeterDifference') {
        formattedVal = `${val.toFixed(1)} cm ${val > 0.8 ? '(⚠️ > 0,8cm)' : '(✓ ≤ 0,8cm)'}`;
      } else if (['swatchStitches', 'swatchRows'].includes(k as string)) {
        formattedVal = `${val.toFixed(1)} (por 10cm)`;
      }
    }

    entries.push({
      key: k as string,
      label: getLabel(k),
      value: formattedVal
    });
  }

  return entries;
}
