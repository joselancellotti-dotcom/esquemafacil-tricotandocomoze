import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { FormData, AppResult, BodyMeasurements, Size, SizeCategory, RecipePart, RecipeStep, CalculationSummary } from './types';
import { CHILD_SIZES, ADULT_SIZES, TEEN_SIZES, ALL_SIZES, SUMMARY_LABELS, getVisibleSummaryEntries } from './types';
import { SwatchIcon } from './components/icons/SwatchIcon';
import { PieceIcon } from './components/icons/PieceIcon';
import { ResultCard } from './components/ResultCard';
import { BodyMeasurementsCard } from './components/BodyMeasurementsCard';
import { SleeveCard } from './components/SleeveCard';
import { RecipeDetailsCard } from './components/RecipeDetailsCard';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { UploadIcon } from './components/icons/UploadIcon';
import { PrintableRecipe } from './components/PrintableRecipe';
import { PrintableMeasurements } from './components/PrintableMeasurements';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { LoginWall } from './components/LoginWall';
import { FirestoreProjectsModal } from './components/FirestoreProjectsModal';
import type { SavedRecipe } from './services/recipeService';

const initialSizeRecord = ALL_SIZES.reduce((acc, size) => ({ ...acc, [size]: '' }), {} as Record<string, string>);

const initialFormData: FormData = {
  pieceName: '',
  isOpenPiece: false, 
  isSleeveless: false, 
  buttonBandWidth: '', 
  necklineType: 'round', 
  
  machineBrand: '',
  machineModel: '',
  swatchStitches: '',
  swatchRows: '',
  stitchType: '',
  yarn: '',
  gauge: '',

  recipeDetails: {
    ribbingType: '',
    ribbingGauge: '',
    ribbingRows: '',
    ribbingHeightCm: '',
    raglanDecreaseType: '1',
    vNeckDecreaseType: '1',
    armholeFinishingWidth: '',
  },
  finishing: {
    type: 'horizontal',
    swatchStitches: '',
    swatchRows: '',
    neckRibRows: '',
  },
  bodyMeasurements: {
    bustWidth: { ...initialSizeRecord },
    initialArmholeBindoff: { ...initialSizeRecord },
    necklineFrontWidth: { ...initialSizeRecord },
    necklineBackWidth: { ...initialSizeRecord },
    hemToArmholeHeight: { ...initialSizeRecord },
    armholeHeightFront: { ...initialSizeRecord },
    armholeHeightBack: { ...initialSizeRecord },
    necklineBackDepth: { ...initialSizeRecord },
    necklineFrontDepth: { ...initialSizeRecord },
    totalBodyLength: { ...initialSizeRecord },
    // Cava Redonda fields
    roundBustWidth: { ...initialSizeRecord },
    roundShoulderWidth: { ...initialSizeRecord },
    roundBackNecklineWidth: { ...initialSizeRecord },
    roundFrontCrossChest: { ...initialSizeRecord },
    roundBackCrossChest: { ...initialSizeRecord },
    roundHemToArmholeHeight: { ...initialSizeRecord },
    roundArmholeHeight: { ...initialSizeRecord },
    roundShoulderSlope: { ...initialSizeRecord },
    roundBackNecklineDepth: { ...initialSizeRecord },
    roundFrontNecklineDepthRound: { ...initialSizeRecord },
    roundFrontNecklineDepthV: { ...initialSizeRecord },
  },
  sleeveMeasurements: {
    wristWidth: { ...initialSizeRecord },
    sleeveMaxWidth: { ...initialSizeRecord },
    sleeveFinalWidth: { ...initialSizeRecord },
    sleeveHemToArmholeHeight: { ...initialSizeRecord },
    sleeveArmholeHeightFront: { ...initialSizeRecord },
    sleeveArmholeHeightBack: { ...initialSizeRecord },
    totalSleeveLength: { ...initialSizeRecord },
    // Cava Redonda fields
    roundSleeveWristWidth: { ...initialSizeRecord },
    roundSleeveMaxWidth: { ...initialSizeRecord },
    roundSleeveFinalBindoff: { ...initialSizeRecord },
    roundSleeveHemToArmholeHeight: { ...initialSizeRecord },
    roundSleeveCapHeight: { ...initialSizeRecord },
  },
};

const safeMerge = (target: any, source: any): any => {
    if (!source || typeof source !== 'object') return JSON.parse(JSON.stringify(target));
    const result = Array.isArray(target) ? [] : { ...target };
    Object.keys(target).forEach(key => {
        const targetValue = target[key];
        let sourceValue = source[key];
        if (sourceValue === undefined && typeof key === 'string' && key.includes(' a ')) {
          const oldKey = key.replace(' a ', '˜');
          if (source[oldKey] !== undefined) sourceValue = source[oldKey];
        }
        if (targetValue !== null && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
            result[key] = safeMerge(targetValue, sourceValue);
        } else if (sourceValue !== undefined && sourceValue !== '') {
            result[key] = sourceValue;
        } else {
            result[key] = targetValue !== undefined ? JSON.parse(JSON.stringify(targetValue)) : '';
        }
    });
    return result;
};

const defaultGradingValues: Record<string, string> = {
  bustWidth: '2',
  initialArmholeBindoff: '0',
  necklineFrontWidth: '1',
  necklineBackWidth: '1',
  hemToArmholeHeight: '2',
  armholeHeightFront: '1',
  armholeHeightBack: '1',
  necklineBackDepth: '0',
  necklineFrontDepth: '0.5',
  wristWidth: '1',
  sleeveMaxWidth: '1.5',
  sleeveFinalWidth: '1',
  sleeveHemToArmholeHeight: '2',
  sleeveArmholeHeightFront: '1',
  sleeveArmholeHeightBack: '1',
  // Cava Redonda fields
  roundBustWidth: '3',
  roundShoulderWidth: '1',
  roundBackNecklineWidth: '1',
  roundFrontCrossChest: '3',
  roundBackCrossChest: '3',
  roundHemToArmholeHeight: '1.5',
  roundArmholeHeight: '1',
  roundShoulderSlope: '0',
  roundBackNecklineDepth: '0',
  roundFrontNecklineDepthRound: '0.5',
  roundFrontNecklineDepthV: '1',
  roundSleeveWristWidth: '1',
  roundSleeveMaxWidth: '2',
  roundSleeveFinalBindoff: '0.33',
  roundSleeveHemToArmholeHeight: '1',
  roundSleeveCapHeight: '0.5',
};

const createPrefilledData = (): FormData => {
    const data = JSON.parse(JSON.stringify(initialFormData));
    data.stitchType = 'Jersey';
    data.yarn = 'Lã 2/28';
    data.gauge = '6';
    data.swatchStitches = '12.9';
    data.swatchRows = '13.0';

    const sizes = ['PP', 'P', 'M', 'G', 'GG'];
    const childSizes = [
      'RN - 0 a 3 meses',
      'P - 3 a 6 meses',
      'M - 6 a 9 meses',
      'G - 9 a 12 meses',
      '1a. - 12 a 18 meses',
    ];
    const teenSizes = ['2a', '4a', '6a', '8a', '10a', '12a', '14a', '16a'];

    // Prefill Cava Raglan values for Adult (PP, P, M, G, GG)
    const ragBust = ['50', '52', '54', '56', '58'];
    const ragInitBindoff = ['2', '2', '2', '2', '2'];
    const ragFrontNeckWidth = ['17', '18', '19', '20', '21'];
    const ragBackNeckWidth = ['12', '13', '14', '15', '16'];
    const ragHemToArm = ['34', '36', '38', '40', '42'];
    const ragArmHeightFront = ['19', '20', '21', '22', '23'];
    const ragArmHeightBack = ['22', '23', '24', '25', '26'];
    const ragFrontNeckDepth = ['3.5', '4', '4', '4.5', '4.5'];
    const ragBackNeckDepth = ['0', '0', '0', '0', '0'];

    const ragSleeveWrist = ['21', '22', '23', '24', '25'];
    const ragSleeveMax = ['36.5', '38', '39.5', '41', '42.5'];
    const ragSleeveFinal = ['5', '6', '7', '8', '9'];
    const ragSleeveHem = ['36', '38', '40', '42', '44'];
    const ragSleeveArmFront = ['19', '20', '21', '22', '23'];
    const ragSleeveArmBack = ['22', '23', '24', '25', '26'];

    sizes.forEach((size, index) => {
        data.bodyMeasurements.bustWidth[size] = ragBust[index];
        data.bodyMeasurements.initialArmholeBindoff[size] = ragInitBindoff[index];
        data.bodyMeasurements.necklineFrontWidth[size] = ragFrontNeckWidth[index];
        data.bodyMeasurements.necklineBackWidth[size] = ragBackNeckWidth[index];
        data.bodyMeasurements.hemToArmholeHeight[size] = ragHemToArm[index];
        data.bodyMeasurements.armholeHeightFront[size] = ragArmHeightFront[index];
        data.bodyMeasurements.armholeHeightBack[size] = ragArmHeightBack[index];
        data.bodyMeasurements.necklineFrontDepth[size] = ragFrontNeckDepth[index];
        data.bodyMeasurements.necklineBackDepth[size] = ragBackNeckDepth[index];

        data.sleeveMeasurements.wristWidth[size] = ragSleeveWrist[index];
        data.sleeveMeasurements.sleeveMaxWidth[size] = ragSleeveMax[index];
        data.sleeveMeasurements.sleeveFinalWidth[size] = ragSleeveFinal[index];
        data.sleeveMeasurements.sleeveHemToArmholeHeight[size] = ragSleeveHem[index];
        data.sleeveMeasurements.sleeveArmholeHeightFront[size] = ragSleeveArmFront[index];
        data.sleeveMeasurements.sleeveArmholeHeightBack[size] = ragSleeveArmBack[index];
    });

    // Prefill Cava Raglan values for Child (RN, P, M, G, 1a)
    const ragChildBust = ['24', '26', '28', '30', '32'];
    const ragChildInitBindoff = ['1.5', '1.5', '2', '2', '2'];
    const ragChildFrontNeckWidth = ['9', '10', '11', '11.5', '12'];
    const ragChildBackNeckWidth = ['7', '7.5', '8', '8.5', '9'];
    const ragChildHemToArm = ['14', '16', '18', '20', '22'];
    const ragChildArmHeightFront = ['9', '10', '11', '12', '13'];
    const ragChildArmHeightBack = ['10', '11', '12', '13', '14'];
    const ragChildFrontNeckDepth = ['2.5', '2.5', '3', '3', '3.5'];
    const ragChildBackNeckDepth = ['0', '0', '0', '0', '0'];

    const ragChildSleeveWrist = ['10', '11', '12', '13', '14'];
    const ragChildSleeveMax = ['17', '18.5', '20', '21.5', '23'];
    const ragChildSleeveFinal = ['3', '3', '3.5', '3.5', '4'];
    const ragChildSleeveHem = ['13', '15', '17', '19', '21'];
    const ragChildSleeveArmFront = ['9', '10', '11', '12', '13'];
    const ragChildSleeveArmBack = ['10', '11', '12', '13', '14'];

    childSizes.forEach((size, index) => {
        data.bodyMeasurements.bustWidth[size] = ragChildBust[index];
        data.bodyMeasurements.initialArmholeBindoff[size] = ragChildInitBindoff[index];
        data.bodyMeasurements.necklineFrontWidth[size] = ragChildFrontNeckWidth[index];
        data.bodyMeasurements.necklineBackWidth[size] = ragChildBackNeckWidth[index];
        data.bodyMeasurements.hemToArmholeHeight[size] = ragChildHemToArm[index];
        data.bodyMeasurements.armholeHeightFront[size] = ragChildArmHeightFront[index];
        data.bodyMeasurements.armholeHeightBack[size] = ragChildArmHeightBack[index];
        data.bodyMeasurements.necklineFrontDepth[size] = ragChildFrontNeckDepth[index];
        data.bodyMeasurements.necklineBackDepth[size] = ragChildBackNeckDepth[index];

        data.sleeveMeasurements.wristWidth[size] = ragChildSleeveWrist[index];
        data.sleeveMeasurements.sleeveMaxWidth[size] = ragChildSleeveMax[index];
        data.sleeveMeasurements.sleeveFinalWidth[size] = ragChildSleeveFinal[index];
        data.sleeveMeasurements.sleeveHemToArmholeHeight[size] = ragChildSleeveHem[index];
        data.sleeveMeasurements.sleeveArmholeHeightFront[size] = ragChildSleeveArmFront[index];
        data.sleeveMeasurements.sleeveArmholeHeightBack[size] = ragChildSleeveArmBack[index];
    });

    // Prefill Cava Raglan values for Teen (2a to 16a)
    const ragTeenBust = ['34', '36', '38', '40', '42', '44', '46', '48'];
    const ragTeenInitBindoff = ['2', '2', '2', '2', '2', '2', '2', '2'];
    const ragTeenFrontNeckWidth = ['13', '14', '15', '16', '17', '18', '19', '20'];
    const ragTeenBackNeckWidth = ['9', '10', '11', '12', '13', '14', '15', '16'];
    const ragTeenHemToArm = ['24', '26', '28', '30', '32', '34', '36', '38'];
    const ragTeenArmHeightFront = ['13', '14', '15', '16', '17', '18', '19', '20'];
    const ragTeenArmHeightBack = ['15', '16', '17', '18', '19', '20', '21', '22'];
    const ragTeenFrontNeckDepth = ['3', '3.5', '3.5', '4', '4', '4.5', '4.5', '5'];
    const ragTeenBackNeckDepth = ['0', '0', '0', '0', '0', '0', '0', '0'];

    const ragTeenSleeveWrist = ['14', '15', '16', '17', '18', '19', '20', '21'];
    const ragTeenSleeveMax = ['24', '25.5', '27', '28.5', '30', '31.5', '33', '34.5'];
    const ragTeenSleeveFinal = ['4', '5', '6', '7', '8', '9', '10', '11'];
    const ragTeenSleeveHem = ['24', '26', '28', '30', '32', '34', '36', '38'];
    const ragTeenSleeveArmFront = ['13', '14', '15', '16', '17', '18', '19', '20'];
    const ragTeenSleeveArmBack = ['15', '16', '17', '18', '19', '20', '21', '22'];

    teenSizes.forEach((size, index) => {
        data.bodyMeasurements.bustWidth[size] = ragTeenBust[index];
        data.bodyMeasurements.initialArmholeBindoff[size] = ragTeenInitBindoff[index];
        data.bodyMeasurements.necklineFrontWidth[size] = ragTeenFrontNeckWidth[index];
        data.bodyMeasurements.necklineBackWidth[size] = ragTeenBackNeckWidth[index];
        data.bodyMeasurements.hemToArmholeHeight[size] = ragTeenHemToArm[index];
        data.bodyMeasurements.armholeHeightFront[size] = ragTeenArmHeightFront[index];
        data.bodyMeasurements.armholeHeightBack[size] = ragTeenArmHeightBack[index];
        data.bodyMeasurements.necklineFrontDepth[size] = ragTeenFrontNeckDepth[index];
        data.bodyMeasurements.necklineBackDepth[size] = ragTeenBackNeckDepth[index];

        data.sleeveMeasurements.wristWidth[size] = ragTeenSleeveWrist[index];
        data.sleeveMeasurements.sleeveMaxWidth[size] = ragTeenSleeveMax[index];
        data.sleeveMeasurements.sleeveFinalWidth[size] = ragTeenSleeveFinal[index];
        data.sleeveMeasurements.sleeveHemToArmholeHeight[size] = ragTeenSleeveHem[index];
        data.sleeveMeasurements.sleeveArmholeHeightFront[size] = ragTeenSleeveArmFront[index];
        data.sleeveMeasurements.sleeveArmholeHeightBack[size] = ragTeenSleeveArmBack[index];
    });

    // Prefill Cava Redonda values for Adult (PP, P, M, G, GG)
    const rBust = ['50', '53', '56', '59', '62'];
    const rShoulder = ['12', '13', '14', '15', '16'];
    const rBackNeck = ['18', '19', '20', '21', '22'];
    const rFrontCross = ['38', '41', '44', '47', '50'];
    const rBackCross = ['39', '42', '45', '48', '51'];
    const rHemToArm = ['37.5', '39', '40.5', '42', '43.5'];
    const rArmhole = ['19', '20', '21', '22', '23'];
    const rSlope = ['3', '3', '3', '3', '3'];
    const rBackNeckDepth = ['2.5', '2.5', '2.5', '2.5', '2.5'];
    const rFrontDepthRound = ['6', '7', '7.5', '8', '8.5'];
    const rFrontDepthV = ['12', '13', '14', '15', '16'];

    const rSleeveWrist = ['29', '30', '31', '32', '33'];
    const rSleeveMax = ['36', '38', '40', '42', '44'];
    const rSleeveFinal = ['6', '6.33', '6.67', '7', '7.33'];
    const rSleeveHem = ['36', '38', '40', '42', '44'];
    const rSleeveCap = ['13', '13.5', '14', '14.5', '15'];

    sizes.forEach((size, index) => {
        data.bodyMeasurements.roundBustWidth[size] = rBust[index];
        data.bodyMeasurements.roundShoulderWidth[size] = rShoulder[index];
        data.bodyMeasurements.roundBackNecklineWidth[size] = rBackNeck[index];
        data.bodyMeasurements.roundFrontCrossChest[size] = rFrontCross[index];
        data.bodyMeasurements.roundBackCrossChest[size] = rBackCross[index];
        data.bodyMeasurements.roundHemToArmholeHeight[size] = rHemToArm[index];
        data.bodyMeasurements.roundArmholeHeight[size] = rArmhole[index];
        data.bodyMeasurements.roundShoulderSlope[size] = rSlope[index];
        data.bodyMeasurements.roundBackNecklineDepth[size] = rBackNeckDepth[index];
        data.bodyMeasurements.roundFrontNecklineDepthRound[size] = rFrontDepthRound[index];
        data.bodyMeasurements.roundFrontNecklineDepthV[size] = rFrontDepthV[index];

        data.sleeveMeasurements.roundSleeveWristWidth[size] = rSleeveWrist[index];
        data.sleeveMeasurements.roundSleeveMaxWidth[size] = rSleeveMax[index];
        data.sleeveMeasurements.roundSleeveFinalBindoff[size] = rSleeveFinal[index];
        data.sleeveMeasurements.roundSleeveHemToArmholeHeight[size] = rSleeveHem[index];
        data.sleeveMeasurements.roundSleeveCapHeight[size] = rSleeveCap[index];
    });

    // Prefill Cava Redonda values for Child (RN, P, M, G, 1a)
    const rChildBust = ['24', '26', '28', '30', '32'];
    const rChildShoulder = ['5.5', '6', '6.5', '7', '7.5'];
    const rChildBackNeck = ['9', '10', '11', '11.5', '12'];
    const rChildFrontCross = ['20', '22', '24', '25.5', '27'];
    const rChildBackCross = ['20', '22', '24', '25.5', '27'];
    const rChildHemToArm = ['14', '16', '18', '20', '22'];
    const rChildArmhole = ['9', '10', '11', '12', '13'];
    const rChildSlope = ['1', '1', '1.5', '1.5', '2'];
    const rChildBackNeckDepth = ['1.5', '1.5', '1.5', '2', '2'];
    const rChildFrontDepthRound = ['3.5', '4', '4', '4.5', '4.5'];
    const rChildFrontDepthV = ['6', '6.5', '7', '7.5', '8'];

    const rChildSleeveWrist = ['10', '11', '12', '13', '14'];
    const rChildSleeveMax = ['17', '18.5', '20', '21.5', '23'];
    const rChildSleeveFinal = ['3', '3', '3.5', '3.5', '4'];
    const rChildSleeveHem = ['13', '15', '17', '19', '21'];
    const rChildSleeveCap = ['5.5', '6', '6.5', '7', '7.5'];

    childSizes.forEach((size, index) => {
        data.bodyMeasurements.roundBustWidth[size] = rChildBust[index];
        data.bodyMeasurements.roundShoulderWidth[size] = rChildShoulder[index];
        data.bodyMeasurements.roundBackNecklineWidth[size] = rChildBackNeck[index];
        data.bodyMeasurements.roundFrontCrossChest[size] = rChildFrontCross[index];
        data.bodyMeasurements.roundBackCrossChest[size] = rChildBackCross[index];
        data.bodyMeasurements.roundHemToArmholeHeight[size] = rChildHemToArm[index];
        data.bodyMeasurements.roundArmholeHeight[size] = rChildArmhole[index];
        data.bodyMeasurements.roundShoulderSlope[size] = rChildSlope[index];
        data.bodyMeasurements.roundBackNecklineDepth[size] = rChildBackNeckDepth[index];
        data.bodyMeasurements.roundFrontNecklineDepthRound[size] = rChildFrontDepthRound[index];
        data.bodyMeasurements.roundFrontNecklineDepthV[size] = rChildFrontDepthV[index];

        data.sleeveMeasurements.roundSleeveWristWidth[size] = rChildSleeveWrist[index];
        data.sleeveMeasurements.roundSleeveMaxWidth[size] = rChildSleeveMax[index];
        data.sleeveMeasurements.roundSleeveFinalBindoff[size] = rChildSleeveFinal[index];
        data.sleeveMeasurements.roundSleeveHemToArmholeHeight[size] = rChildSleeveHem[index];
        data.sleeveMeasurements.roundSleeveCapHeight[size] = rChildSleeveCap[index];
    });

    // Prefill Cava Redonda values for Teen (2a to 16a)
    const rTeenBust = ['34', '37', '40', '43', '46', '49', '52', '55'];
    const rTeenShoulder = ['8', '9', '10', '11', '12', '13', '14', '15'];
    const rTeenBackNeck = ['12', '13', '14', '15', '16', '17', '18', '19'];
    const rTeenFrontCross = ['26', '29', '32', '35', '38', '41', '44', '47'];
    const rTeenBackCross = ['27', '30', '33', '36', '39', '42', '45', '48'];
    const rTeenHemToArm = ['24', '25.5', '27', '28.5', '30', '31.5', '33', '34.5'];
    const rTeenArmhole = ['13', '14', '15', '16', '17', '18', '19', '20'];
    const rTeenSlope = ['2', '2', '2', '2', '2', '2', '2', '2'];
    const rTeenBackNeckDepth = ['2', '2', '2', '2', '2', '2', '2', '2'];
    const rTeenFrontDepthRound = ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5'];
    const rTeenFrontDepthV = ['9', '10', '11', '12', '13', '14', '15', '16'];

    const rTeenSleeveWrist = ['16', '17', '18', '19', '20', '21', '22', '23'];
    const rTeenSleeveMax = ['24', '26', '28', '30', '32', '34', '36', '38'];
    const rTeenSleeveFinal = ['4', '4.33', '4.67', '5', '5.33', '5.67', '6', '6.33'];
    const rTeenSleeveHem = ['22', '24', '26', '28', '30', '32', '34', '36'];
    const rTeenSleeveCap = ['9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5'];

    teenSizes.forEach((size, index) => {
        data.bodyMeasurements.roundBustWidth[size] = rTeenBust[index];
        data.bodyMeasurements.roundShoulderWidth[size] = rTeenShoulder[index];
        data.bodyMeasurements.roundBackNecklineWidth[size] = rTeenBackNeck[index];
        data.bodyMeasurements.roundFrontCrossChest[size] = rTeenFrontCross[index];
        data.bodyMeasurements.roundBackCrossChest[size] = rTeenBackCross[index];
        data.bodyMeasurements.roundHemToArmholeHeight[size] = rTeenHemToArm[index];
        data.bodyMeasurements.roundArmholeHeight[size] = rTeenArmhole[index];
        data.bodyMeasurements.roundShoulderSlope[size] = rTeenSlope[index];
        data.bodyMeasurements.roundBackNecklineDepth[size] = rTeenBackNeckDepth[index];
        data.bodyMeasurements.roundFrontNecklineDepthRound[size] = rTeenFrontDepthRound[index];
        data.bodyMeasurements.roundFrontNecklineDepthV[size] = rTeenFrontDepthV[index];

        data.sleeveMeasurements.roundSleeveWristWidth[size] = rTeenSleeveWrist[index];
        data.sleeveMeasurements.roundSleeveMaxWidth[size] = rTeenSleeveMax[index];
        data.sleeveMeasurements.roundSleeveFinalBindoff[size] = rTeenSleeveFinal[index];
        data.sleeveMeasurements.roundSleeveHemToArmholeHeight[size] = rTeenSleeveHem[index];
        data.sleeveMeasurements.roundSleeveCapHeight[size] = rTeenSleeveCap[index];
    });

    return data;
};

export const InputGroup: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  labelClassName?: string;
}> = ({ label, name, value, onChange, placeholder, disabled, labelClassName }) => (
  <div>
    <label htmlFor={name} className={labelClassName || "block mb-2 text-base font-semibold text-slate-700"}>
      {label}
    </label>
    <input
      type="text"
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`border text-sm rounded-lg block w-full p-2.5 ${
        disabled
          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
          : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-600 focus:border-blue-600'
      }`}
      placeholder={placeholder}
      inputMode={['yarn', 'stitchType', 'machineBrand', 'machineModel'].includes(name) ? 'text' : 'decimal'}
    />
  </div>
);

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {}
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
  }
};

const App: React.FC = () => {
  const [authorizedUser, setAuthorizedUser] = useState<any | null>(null);
  const [authorizedUserData, setAuthorizedUserData] = useState<any | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthorizedUser(null);
      setAuthorizedUserData(null);
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const [formData, setFormData] = useState<FormData>(() => {
    try {
      const savedData = safeLocalStorage.getItem('knittingRaglanCalculatorData');
      if (savedData) return safeMerge(createPrefilledData(), JSON.parse(savedData));
    } catch (e) {}
    return createPrefilledData();
  });
  
  const [gradingValues, setGradingValues] = useState<Record<string, string>>(() => {
    try {
      const savedGrading = safeLocalStorage.getItem('knittingRaglanGradingData');
      if (savedGrading) return JSON.parse(savedGrading);
    } catch (e) {}
    return defaultGradingValues;
  });

  const [result, setResult] = useState<Record<string, AppResult> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'single' | 'grid'>(() => {
    try {
      return (safeLocalStorage.getItem('knittingRaglanMode') as any) || 'grid';
    } catch (e) {
      return 'grid';
    }
  });
  const [sizeCategory, setSizeCategory] = useState<SizeCategory>(() => {
    try {
      return (safeLocalStorage.getItem('knittingRaglanCategory') as any) || 'adult';
    } catch (e) {
      return 'adult';
    }
  });
  const [projectType, setProjectType] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanProjectType') || 'Blusa';
    } catch (e) {
      return 'Blusa';
    }
  });
  const [armholeType, setArmholeType] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanArmholeType') || 'Cava Raglan';
    } catch (e) {
      return 'Cava Raglan';
    }
  });
  const [necklineSelection, setNecklineSelection] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanNecklineSelection') || 'Decote Redondo';
    } catch (e) {
      return 'Decote Redondo';
    }
  });
  const [machineGauge, setMachineGauge] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanMachineGauge') || '4,5mm';
    } catch (e) {
      return '4,5mm';
    }
  });
  const [barTypeSelection, setBarTypeSelection] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanBarTypeSelection') || '1x1';
    } catch (e) {
      return '1x1';
    }
  });
  const [barSwatchValue, setBarSwatchValue] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanBarSwatchValue') || '';
    } catch (e) {
      return '';
    }
  });
  const [barSwatchOrlaLength, setBarSwatchOrlaLength] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanBarSwatchOrlaLength') || '';
    } catch (e) {
      return '';
    }
  });
  const [barSwatchGauge, setBarSwatchGauge] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanBarSwatchGauge') || '';
    } catch (e) {
      return '';
    }
  });
  const [buttonBandTypeSelection, setButtonBandTypeSelection] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanButtonBandTypeSelection') || 'Igual a Barra';
    } catch (e) {
      return 'Igual a Barra';
    }
  });
  const [buttonBandSwatchStitches, setButtonBandSwatchStitches] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanbuttonBandSwatchStitches') || '';
    } catch (e) {
      return '';
    }
  });
  const [buttonBandSwatchRows, setButtonBandSwatchRows] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanbuttonBandSwatchRows') || '';
    } catch (e) {
      return '';
    }
  });
  const [buttonBandSwatchGauge, setButtonBandSwatchGauge] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanbuttonBandSwatchGauge') || '';
    } catch (e) {
      return '';
    }
  });
  const [necklineArmholeFinishing, setNecklineArmholeFinishing] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanNecklineArmholeFinishing') || 'Igual à Barra';
    } catch (e) {
      return 'Igual à Barra';
    }
  });
  const [finishingSwatchStitches, setFinishingSwatchStitches] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanfinishingSwatchStitches') || '';
    } catch (e) {
      return '';
    }
  });
  const [finishingSwatchRows, setFinishingSwatchRows] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanfinishingSwatchRows') || '';
    } catch (e) {
      return '';
    }
  });
  const [finishingSwatchGauge, setFinishingSwatchGauge] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('knittingRaglanfinishingSwatchGauge') || '';
    } catch (e) {
      return '';
    }
  });
  const [baseGradationSize, setBaseGradationSize] = useState<Size>(() => {
    try {
      const savedBase = safeLocalStorage.getItem('knittingRaglanBaseGradationSize') as Size;
      return ALL_SIZES.includes(savedBase) ? savedBase : 'P';
    } catch (e) {
      return 'P';
    }
  });

  const currentSizes = useMemo(() => {
    if (sizeCategory === 'child') return CHILD_SIZES;
    if (sizeCategory === 'teen') return TEEN_SIZES;
    return ADULT_SIZES;
  }, [sizeCategory]);
  
  const [selectedSize, setSelectedSize] = useState<Size>(() => {
    try {
      const savedSize = safeLocalStorage.getItem('knittingRaglanSelectedSize') as Size;
      return ALL_SIZES.includes(savedSize) ? savedSize : 'M';
    } catch (e) {
      return 'M';
    }
  });

  const [activeTab, setActiveTab] = useState<string | null>(() => {
    try {
      const savedTab = safeLocalStorage.getItem('knittingRaglanActiveTab');
      return savedTab || null;
    } catch (e) {
      return null;
    }
  });
  const [printMode, setPrintMode] = useState<'current' | 'all' | 'table' | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);
  
  useEffect(() => {
      if (!currentSizes.includes(selectedSize as any)) {
          setSelectedSize(currentSizes.includes('M') ? 'M' : currentSizes[0]);
      }
      if (!currentSizes.includes(baseGradationSize as any)) {
          setBaseGradationSize(currentSizes.includes('P' as any) ? 'P' : currentSizes[0]);
      }

      setFormData(prev => {
        const prefilled = createPrefilledData();
        let needsUpdate = false;
        currentSizes.forEach(size => {
          if (!prev.bodyMeasurements?.bustWidth?.[size] || !prev.bodyMeasurements?.hemToArmholeHeight?.[size]) {
            needsUpdate = true;
          }
        });
        if (needsUpdate) {
          const updated = JSON.parse(JSON.stringify(prev));
          (['bodyMeasurements', 'sleeveMeasurements'] as const).forEach(cat => {
            Object.keys(prefilled[cat] || {}).forEach(mName => {
              currentSizes.forEach(size => {
                if (!updated[cat]?.[mName]?.[size] && prefilled[cat]?.[mName]?.[size]) {
                  if (!updated[cat]) updated[cat] = {};
                  if (!updated[cat][mName]) updated[cat][mName] = {};
                  updated[cat][mName][size] = prefilled[cat][mName][size];
                }
              });
            });
          });
          return updated;
        }
        return prev;
      });
  }, [sizeCategory, currentSizes]);

  useEffect(() => {
     const availableSizes = result ? Object.keys(result) : [];
     if (availableSizes.length > 0 && (!activeTab || !availableSizes.includes(activeTab))) {
         setActiveTab(availableSizes[0]);
     } else if (availableSizes.length === 0) {
         setActiveTab(null);
     }
  }, [result]);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDF = async () => {
    if (!printMode) return;
    setIsGeneratingPDF(true);
    
    const element = document.getElementById('print-container');
    if (!element) {
      setIsGeneratingPDF(false);
      setPrintMode(null);
      return;
    }

    // Temporariamente torna o elemento visível para captura
    const originalStyle = element.getAttribute('style') || '';
    const originalClass = element.className;
    
    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style.left = '0';
    element.style.top = '0';
    element.style.bottom = 'auto';
    element.style.right = 'auto';
    element.style.margin = '0';
    element.style.padding = '0';
    element.style.width = '1000px';
    element.style.height = 'auto';
    element.style.minHeight = 'auto';
    element.style.maxHeight = 'none';
    element.style.overflow = 'visible';
    element.style.zIndex = '12000';
    element.classList.remove('hidden', 'print-only', 'fixed', 'inset-0', 'overflow-y-auto');
    
    try {
      // Pequeno delay para garantir que o DOM renderizou
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const jspdfLib = (window as any).jspdf;
      const html2canvasLib = (window as any).html2canvas;

      if (!jspdfLib || !html2canvasLib) {
        console.warn('Bibliotecas PDF/Canvas não carregadas. Usando impressão nativa do navegador.');
        window.print();
        return;
      }

      const { jsPDF } = jspdfLib;
      const sections = Array.from(element.querySelectorAll('.pdf-section'));
      
      let pdf: any = null;

      if (sections.length > 0) {
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i] as HTMLElement;
          const canvas = await html2canvasLib(section, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: section.offsetWidth,
            height: section.offsetHeight,
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.85);
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;

          if (i === 0) {
            pdf = new jsPDF({
              orientation: imgWidth > imgHeight ? 'l' : 'p',
              unit: 'px',
              format: [imgWidth, imgHeight]
            });
          } else {
            pdf.addPage([imgWidth, imgHeight], imgWidth > imgHeight ? 'l' : 'p');
          }

          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        }
      } else {
        // Fallback para captura única se não houver seções (ex: tabela de medidas)
        const scrollHeight = element.scrollHeight;
        const canvas = await html2canvasLib(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 1000,
          height: scrollHeight,
          windowWidth: 1000,
          windowHeight: scrollHeight,
          scrollY: 0,
          scrollX: 0
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'l' : 'p',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      }
      
      const fileName = `${formData.pieceName || 'receita'}-${printMode}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      // Fallback para impressão do navegador se falhar
      window.print();
    } finally {
      element.setAttribute('style', originalStyle);
      element.className = originalClass;
      setPrintMode(null);
      setIsGeneratingPDF(false);
    }
  };

  useEffect(() => {
    if (printMode) {
      generatePDF();
    }
  }, [printMode]);
  
  useEffect(() => {
    const handleAfterPrint = () => setPrintMode(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setResult(null);
  }, [
    formData,
    gradingValues,
    mode,
    sizeCategory,
    projectType,
    armholeType,
    necklineSelection,
    barTypeSelection,
    barSwatchValue,
    barSwatchOrlaLength,
    barSwatchGauge,
    buttonBandTypeSelection,
    buttonBandSwatchStitches,
    buttonBandSwatchRows,
    buttonBandSwatchGauge,
    necklineArmholeFinishing,
    finishingSwatchStitches,
    finishingSwatchRows,
    finishingSwatchGauge,
    baseGradationSize,
    selectedSize
  ]);

  useEffect(() => safeLocalStorage.setItem('knittingRaglanCalculatorData', JSON.stringify(formData)), [formData]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanGradingData', JSON.stringify(gradingValues)), [gradingValues]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanMode', mode), [mode]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanSelectedSize', selectedSize), [selectedSize]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanCategory', sizeCategory), [sizeCategory]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanBaseGradationSize', baseGradationSize), [baseGradationSize]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanProjectType', projectType), [projectType]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanArmholeType', armholeType), [armholeType]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanNecklineSelection', necklineSelection), [necklineSelection]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanMachineGauge', machineGauge), [machineGauge]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanBarTypeSelection', barTypeSelection), [barTypeSelection]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanBarSwatchValue', barSwatchValue), [barSwatchValue]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanBarSwatchOrlaLength', barSwatchOrlaLength), [barSwatchOrlaLength]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanBarSwatchGauge', barSwatchGauge), [barSwatchGauge]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanButtonBandTypeSelection', buttonBandTypeSelection), [buttonBandTypeSelection]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanbuttonBandSwatchStitches', buttonBandSwatchStitches), [buttonBandSwatchStitches]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanbuttonBandSwatchRows', buttonBandSwatchRows), [buttonBandSwatchRows]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanbuttonBandSwatchGauge', buttonBandSwatchGauge), [buttonBandSwatchGauge]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanNecklineArmholeFinishing', necklineArmholeFinishing), [necklineArmholeFinishing]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanfinishingSwatchStitches', finishingSwatchStitches), [finishingSwatchStitches]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanfinishingSwatchRows', finishingSwatchRows), [finishingSwatchRows]);
  useEffect(() => safeLocalStorage.setItem('knittingRaglanfinishingSwatchGauge', finishingSwatchGauge), [finishingSwatchGauge]);
  useEffect(() => {
    if (result) {
      safeLocalStorage.setItem('knittingRaglanResult', JSON.stringify(result));
    } else {
      safeLocalStorage.removeItem('knittingRaglanResult');
    }
  }, [result]);
  useEffect(() => {
    if (activeTab) {
      safeLocalStorage.setItem('knittingRaglanActiveTab', activeTab);
    }
  }, [activeTab]);

  const targetStitches = machineGauge === '6,5mm' ? 30 : (machineGauge === '9,0mm' ? 20 : 40);
  const targetRows = machineGauge === '6,5mm' ? 40 : (machineGauge === '9,0mm' ? 30 : 60);

  useEffect(() => {
    const parts = [projectType];
    const needsArmhole = ['Blusa', 'Casaco', 'Colete', 'Colete Aberto', 'Regata', 'Regata Aberta'].includes(projectType);
    const needsNeckline = ['Blusa', 'Casaco', 'Colete', 'Colete Aberto', 'Regata', 'Regata Aberta'].includes(projectType);

    if (needsArmhole && armholeType) {
      parts.push(armholeType);
    }
    if (needsNeckline && necklineSelection) {
      parts.push(necklineSelection);
    }

    const machineParts = [formData.machineBrand, formData.machineModel].filter(Boolean).map(s => s.trim()).filter(Boolean);
    if (machineParts.length > 0) {
      parts.push(machineParts.join(' '));
    }
    if (formData.yarn && formData.yarn.trim()) {
      parts.push(formData.yarn.trim());
    }

    const combinedName = parts.filter(Boolean).join(' - ');
    if (formData.pieceName !== combinedName) {
      setFormData(prev => ({ ...prev, pieceName: combinedName }));
    }
  }, [projectType, armholeType, necklineSelection, formData.machineBrand, formData.machineModel, formData.yarn, formData.pieceName]);

  useEffect(() => {
    const isOpen = projectType === 'Casaco' || projectType === 'Colete Aberto' || projectType === 'Regata Aberta';
    if (formData.isOpenPiece !== isOpen) {
      setFormData(prev => ({ ...prev, isOpenPiece: isOpen }));
    }
  }, [projectType, formData.isOpenPiece]);

  useEffect(() => {
    const isSleevelessProject = projectType === 'Colete' || projectType === 'Colete Aberto' || projectType === 'Regata' || projectType === 'Regata Aberta';
    if (formData.isSleeveless !== isSleevelessProject) {
      setFormData(prev => ({ ...prev, isSleeveless: isSleevelessProject }));
    }
    if (isSleevelessProject && armholeType !== 'Cava Redonda') {
      setArmholeType('Cava Redonda');
    }
  }, [projectType, formData.isSleeveless, armholeType]);

  useEffect(() => {
    const newTotals = ALL_SIZES.reduce((acc, size) => {
      const hemToArmhole = parseFloat(formData.bodyMeasurements.hemToArmholeHeight[size]) || 0;
      const armholeDepth = parseFloat(formData.bodyMeasurements.armholeHeightBack[size]) || 0;
      const total = hemToArmhole + armholeDepth;
      acc[size] = total > 0 ? parseFloat(total.toFixed(2)).toString() : '';
      return acc;
    }, {} as Record<string, string>);
    if (JSON.stringify(newTotals) !== JSON.stringify(formData.bodyMeasurements.totalBodyLength)) {
      setFormData(prev => ({ ...prev, bodyMeasurements: { ...prev.bodyMeasurements, totalBodyLength: newTotals } }));
    }
  }, [formData.bodyMeasurements.hemToArmholeHeight, formData.bodyMeasurements.armholeHeightBack]);

  useEffect(() => {
    const newTotalLengths = ALL_SIZES.reduce((acc, size) => {
      const hemToArmhole = parseFloat(formData.sleeveMeasurements.sleeveHemToArmholeHeight[size]) || 0;
      const capHeight = parseFloat(formData.sleeveMeasurements.sleeveArmholeHeightBack[size]) || 0;
      const total = hemToArmhole + capHeight;
      acc[size] = total > 0 ? parseFloat(total.toFixed(2)).toString() : '';
      return acc;
    }, {} as Record<string, string>);
    if (JSON.stringify(newTotalLengths) !== JSON.stringify(formData.sleeveMeasurements.totalSleeveLength)) {
      setFormData(prev => ({ ...prev, sleeveMeasurements: { ...prev.sleeveMeasurements, totalSleeveLength: newTotalLengths } }));
    }
  }, [formData.sleeveMeasurements.sleeveHemToArmholeHeight, formData.sleeveMeasurements.sleeveArmholeHeightBack]);

  useEffect(() => {
    const newFinalBindoffs = ALL_SIZES.reduce((acc, size) => {
      const maxWidth = parseFloat(formData.sleeveMeasurements.roundSleeveMaxWidth?.[size] || '0') || 0;
      const finalBindoff = maxWidth / 6;
      acc[size] = finalBindoff > 0 ? parseFloat(finalBindoff.toFixed(2)).toString() : '';
      return acc;
    }, {} as Record<string, string>);
    if (JSON.stringify(newFinalBindoffs) !== JSON.stringify(formData.sleeveMeasurements.roundSleeveFinalBindoff)) {
      setFormData(prev => ({
        ...prev,
        sleeveMeasurements: {
          ...prev.sleeveMeasurements,
          roundSleeveFinalBindoff: newFinalBindoffs
        }
      }));
    }
  }, [formData.sleeveMeasurements.roundSleeveMaxWidth]);

  if (!authorizedUser || !authorizedUserData || !authorizedUserData.hasAccess) {
    return (
      <LoginWall 
        onAccessGranted={(user, data) => {
          setAuthorizedUser(user);
          setAuthorizedUserData(data);
        }} 
      />
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    if (name === 'isOpenPiece') return setFormData(prev => ({ ...prev, isOpenPiece: value === 'true' }));
    if (name === 'isSleeveless') return setFormData(prev => ({ ...prev, isSleeveless: checked }));
    if (name === 'necklineType') return setFormData(prev => ({ ...prev, necklineType: value as any }));
    if (['pieceName', 'stitchType', 'yarn', 'gauge', 'machineBrand', 'machineModel', 'swatchStitches', 'swatchRows', 'buttonBandWidth'].includes(name)) {
        return setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleRecipeDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, recipeDetails: { ...prev.recipeDetails, [name]: value } }));
  };

  const handleFinishingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, finishing: { ...prev.finishing, [name]: value } }));
  };
  
  const handleMeasurementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let measurementName: string;
    let size: Size;
    if (mode === 'single') { measurementName = name; size = selectedSize; } else { [measurementName, size] = name.split('-') as [string, Size]; }
    if (!measurementName || !size || !/^\d*\.?\d*$/.test(value)) return;
    const measurementType = Object.keys(initialFormData.bodyMeasurements).includes(measurementName) ? 'bodyMeasurements' : 'sleeveMeasurements';
    setFormData(prev => ({
        ...prev,
        [measurementType]: { ...prev[measurementType], [measurementName]: { ...(prev[measurementType] as any)[measurementName], [size]: value } }
    }));
};

const handleGradingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^\d*\.?\d*$/.test(value)) setGradingValues(prev => ({ ...prev, [name]: value }));
};

const handleAutoGrade = () => {
    const baseSize = currentSizes.includes(baseGradationSize as any) ? baseGradationSize : (currentSizes.includes('P' as any) ? 'P' : currentSizes[0]);
    const baseSizeIndex = currentSizes.indexOf(baseSize as any);
    const newFormData = JSON.parse(JSON.stringify(formData));
    const gradeCategory = (category: 'bodyMeasurements' | 'sleeveMeasurements') => {
        for (const measurementName in newFormData[category]) {
            if (['totalBodyLength', 'totalSleeveLength'].includes(measurementName)) continue;
            const baseValueStr = newFormData[category][measurementName][baseSize];
            const gradingValueStr = gradingValues[measurementName];
            if (gradingValueStr && baseValueStr) {
                const gradingValue = parseFloat(gradingValueStr);
                const baseValue = parseFloat(baseValueStr);
                currentSizes.forEach((size, index) => {
                    if (size !== baseSize) {
                        const diff = index - baseSizeIndex;
                        const newValue = baseValue + (diff * gradingValue);
                        newFormData[category][measurementName][size] = newValue > 0 ? parseFloat(newValue.toFixed(2)).toString() : '';
                    }
                });
            }
        }
    };
    gradeCategory('bodyMeasurements');
    if (!formData.isSleeveless) gradeCategory('sleeveMeasurements');
    setFormData(newFormData);
};

  const handleCalculate = () => {
    const { swatchStitches, swatchRows, bodyMeasurements, sleeveMeasurements, isOpenPiece, isSleeveless, buttonBandWidth, necklineType, recipeDetails, gauge, finishing } = formData;
    const numSwatchStitches = parseFloat(swatchStitches);
    const numSwatchRows = parseFloat(swatchRows);
    if (isNaN(numSwatchStitches) || numSwatchStitches <= 0 || isNaN(numSwatchRows) || numSwatchRows <= 0) {
      setError('Amostra inválida.');
      setResult(null);
      return;
    }
    const stsPerCm = parseFloat((targetStitches / numSwatchStitches).toFixed(2));
    const rowsPerCm = parseFloat((targetRows / numSwatchRows).toFixed(2));
    const allResults: Record<string, AppResult> = {};
    const sizesToCalculate = mode === 'single' ? [selectedSize] : currentSizes;

    for (const size of sizesToCalculate) {
        if (!bodyMeasurements.bustWidth[size]) continue;
        const body = Object.fromEntries(Object.entries(bodyMeasurements).map(([k, v]) => [k, parseFloat(v[size] as string) || 0])) as any;
        const sleeve = Object.fromEntries(Object.entries(sleeveMeasurements).map(([k, v]) => [k, parseFloat(v[size] as string) || 0])) as any;
        const roundToEven = (n: number) => Math.round(n / 2) * 2;
        
        const getDecreaseRows = (items: number, steps: number): number[] => {
            if (items <= 0 || steps <= 0) return [];
            const base = Math.floor(steps / items);
            const remainder = steps % items;
            const rows: number[] = [];
            let current = 2; 
            for (let i = 0; i < remainder; i++) {
                rows.push(current);
                current += (base + 1);
            }
            for (let i = 0; i < (items - remainder); i++) {
                rows.push(current);
                current += base;
            }
            return rows.sort((a,b) => a-b);
        };

        const getBodyShaping = (totalPtsToDec: number, numEvents: number, totalRows: number, ptsPerDec: number): { pts: number; gap: number; times: number }[] => {
            if (numEvents <= 0) return [];
            const remainder = totalPtsToDec % ptsPerDec;
            const hasInitialAdjustment = remainder !== 0;
            const baseRows = Math.floor(totalRows / numEvents);
            const extraRows = totalRows % numEvents;
            const res: { pts: number; gap: number; times: number }[] = [];
            
            if (hasInitialAdjustment) {
                res.push({ pts: remainder, gap: baseRows + (extraRows > 0 ? 1 : 0), times: 1 });
                const remainingEvents = numEvents - 1;
                const remainingExtraRows = Math.max(0, extraRows - 1);
                if (remainingExtraRows > 0) res.push({ pts: ptsPerDec, gap: baseRows + 1, times: remainingExtraRows });
                if (remainingEvents - remainingExtraRows > 0) res.push({ pts: ptsPerDec, gap: baseRows, times: remainingEvents - remainingExtraRows });
            } else {
                if (extraRows > 0) res.push({ pts: ptsPerDec, gap: baseRows + 1, times: extraRows });
                if (numEvents - extraRows > 0) res.push({ pts: ptsPerDec, gap: baseRows, times: numEvents - extraRows });
            }
            return res;
        };

        const getSleeveShaping = (totalPoints: number, numEvents: number, totalRows: number): { pts: number, gap: number, times: number }[] => {
            if (numEvents <= 0) return [];
            const results: { pts: number, gap: number, times: number }[] = [];
            const basePts = Math.floor(totalPoints / numEvents);
            const remPts = totalPoints % numEvents;
            const baseRows = Math.floor(totalRows / numEvents);
            const remRows = totalRows % numEvents;
            let curRemPts = remPts;
            let curRemRows = remRows;
            for (let i = 0; i < numEvents; i++) {
                const p = basePts + (curRemPts > 0 ? 1 : 0);
                const r = baseRows + (curRemRows > 0 ? 1 : 0);
                if (curRemPts > 0) curRemPts--;
                if (curRemRows > 0) curRemRows--;
                if (results.length > 0 && results[results.length - 1].pts === p && results[results.length - 1].gap === r) {
                    results[results.length - 1].times++;
                } else {
                    results.push({ pts: p, gap: r, times: 1 });
                }
            }
            return results;
        };

        const getSleeveIncShaping = (totalIncPerSide: number, sleeveIncRows: number): { pts: number, gap: number, times: number }[] => {
            if (totalIncPerSide <= 0) return [];
            const res: { pts: number, gap: number, times: number }[] = [];
            const baseInterval = Math.floor(sleeveIncRows / totalIncPerSide);
            const remainder = sleeveIncRows % totalIncPerSide;
            if (remainder > 0) res.push({ pts: 1, gap: baseInterval + 1, times: Math.round(remainder) });
            if (totalIncPerSide - remainder > 0) res.push({ pts: 1, gap: baseInterval, times: Math.round(totalIncPerSide - remainder) });
            return res;
        };

        const getNecklineShaping = (centralPts: number, sidePtsTotal: number, depthRows: number): { pts: number; gap: number; times: number }[] => {
            const res: { pts: number; gap: number; times: number }[] = [];
            if (centralPts > 0) res.push({ pts: centralPts, gap: 1, times: 1 });
            const numSteps = Math.max(1, Math.floor((depthRows - 2) / 2) + 1);
            if (numSteps > 0 && sidePtsTotal > 0) {
                const basePts = Math.floor(sidePtsTotal / numSteps);
                const extraPts = Math.round(sidePtsTotal % numSteps);
                if (extraPts > 0) res.push({ pts: basePts + 1, gap: 2, times: extraPts });
                if (numSteps - extraPts > 0) res.push({ pts: basePts, gap: 2, times: numSteps - extraPts });
            }
            return res;
        };

        const getNecklineVShaping = (ptsToDecV: number, depthRows: number, numPointsPerEvent: number): { pts: number; gap: number; times: number }[] => {
            const res: { pts: number; gap: number; times: number }[] = [];
            const numEventsV = Math.ceil(ptsToDecV / numPointsPerEvent);
            if (numEventsV > 0) {
                const baseInterval = Math.floor(depthRows / numEventsV);
                const extraRows = depthRows % numEventsV;
                if (extraRows > 0) res.push({ pts: numPointsPerEvent, gap: baseInterval + 1, times: extraRows });
                if (numEventsV - extraRows > 0) res.push({ pts: numPointsPerEvent, gap: baseInterval, times: numEventsV - extraRows });
            }
            return res;
        };

        const getSleeveTopShaping = (sleeveFinalSts: number, diffRows: number): { pts: number; gap: number; times: number }[] => {
            if (diffRows <= 0) return [];
            const results: { pts: number; gap: number; times: number }[] = [];
            const firstSusp = roundToEven(sleeveFinalSts / 3);
            const remStsForSusp = sleeveFinalSts - firstSusp;
            const numRemSuspSteps = Math.floor(diffRows / 2) + 1;
            
            results.push({ pts: firstSusp, gap: 2, times: 1 });
            
            if (numRemSuspSteps > 1) {
                const ptsPerNextSusp = Math.floor(remStsForSusp / (numRemSuspSteps - 1));
                const remPtsAfterDist = remStsForSusp % (numRemSuspSteps - 1);
                if (remPtsAfterDist > 0) results.push({ pts: ptsPerNextSusp + 1, gap: 2, times: remPtsAfterDist });
                if (numRemSuspSteps - 1 - remPtsAfterDist > 0) results.push({ pts: ptsPerNextSusp, gap: 2, times: numRemSuspSteps - 1 - remPtsAfterDist });
            }
            return results;
        };

        const formatBodyRaglanDecreases = (totalPtsToDec: number, numEvents: number, totalRows: number, ptsPerDec: number): string[] => {
            if (numEvents <= 0) return [];
            const remainder = totalPtsToDec % ptsPerDec;
            const hasInitialAdjustment = remainder !== 0;
            const baseRows = Math.floor(totalRows / numEvents);
            const extraRows = totalRows % numEvents;
            const inst: string[] = [];
            if (hasInitialAdjustment) {
                inst.push(`Diminua ${remainder} pt${remainder > 1 ? 's' : ''} + ${baseRows + (extraRows > 0 ? 1 : 0)} carrs. 1 x`);
                const remainingEvents = numEvents - 1;
                const remainingExtraRows = Math.max(0, extraRows - 1);
                if (remainingExtraRows > 0) inst.push(`Diminua ${ptsPerDec} pts + ${baseRows + 1} carrs. ${remainingExtraRows} x`);
                if (remainingEvents - remainingExtraRows > 0) inst.push(`Diminua ${ptsPerDec} pts + ${baseRows} carrs. ${remainingEvents - remainingExtraRows} x`);
            } else {
                if (extraRows > 0) inst.push(`Diminua ${ptsPerDec} pts + ${baseRows + 1} carrs. ${extraRows} x`);
                if (numEvents - extraRows > 0) inst.push(`Diminua ${ptsPerDec} pts + ${baseRows} carrs. ${numEvents - extraRows} x`);
            }
            return inst;
        };

        const formatSleeveDecreases = (totalPoints: number, numEvents: number, totalRows: number): string[] => {
            if (numEvents <= 0) return [];
            const results: { pts: number, rows: number, count: number }[] = [];
            
            const basePts = Math.floor(totalPoints / numEvents);
            const remPts = totalPoints % numEvents;
            const baseRows = Math.floor(totalRows / numEvents);
            const remRows = totalRows % numEvents;

            let curRemPts = remPts;
            let curRemRows = remRows;
            
            for (let i = 0; i < numEvents; i++) {
                const p = basePts + (curRemPts > 0 ? 1 : 0);
                const r = baseRows + (curRemRows > 0 ? 1 : 0);
                if (curRemPts > 0) curRemPts--;
                if (curRemRows > 0) curRemRows--;
                
                if (results.length > 0 && results[results.length - 1].pts === p && results[results.length - 1].rows === r) {
                    results[results.length - 1].count++;
                } else {
                    results.push({ pts: p, rows: r, count: 1 });
                }
            }
            return results.map(r => `Diminua ${r.pts} pt${r.pts > 1 ? 's' : ''} + ${r.rows} carrs. ${r.count} x`);
        };

        const isCavaRedonda = (projectType === 'Blusa' || projectType === 'Casaco' || projectType === 'Colete' || projectType === 'Colete Aberto' || projectType === 'Regata' || projectType === 'Regata Aberta') && armholeType === 'Cava Redonda';

        const getArmholeCurve = (totalPts: number): { initialBindoff: number; steps: { pts: number; times: number }[] } => {
            const initialBindoff = totalPts > 0 ? Math.max(1, Math.min(totalPts, Math.round(2 * stsPerCm))) : 0;
            const rem = Math.max(0, totalPts - initialBindoff);
            const steps: { pts: number; times: number }[] = [];
            if (rem > 0) {
                let temp = rem;
                let count3 = 0;
                let count2 = 0;
                let count1 = 0;
                if (temp >= 5) {
                    count3 = 1;
                    temp -= 3;
                }
                if (temp >= 3) {
                    count2 = Math.floor(temp / 2);
                    temp = temp % 2;
                }
                count1 = temp;
                if (count3 > 0) steps.push({ pts: 3, times: count3 });
                if (count2 > 0) steps.push({ pts: 2, times: count2 });
                if (count1 > 0) steps.push({ pts: 1, times: count1 });
            }
            return { initialBindoff, steps };
        };

        const getRoundArmholeShaping = (ptsToDec: number) => {
            const initialBindoff = ptsToDec > 0 ? Math.max(1, Math.min(ptsToDec, Math.round(2 * stsPerCm))) : 0;
            const rem = Math.max(0, ptsToDec - initialBindoff);
            const base = Math.floor(rem / 3);
            const extra = rem % 3;
            const group1 = base + (extra >= 1 ? 1 : 0);
            const group2 = base + (extra >= 2 ? 1 : 0);
            const group3 = base;
            return { initialBindoff, group1, group2, group3 };
        };

        const getRoundArmholeInstructions = (ptsToDec: number) => {
            const { initialBindoff, group1, group2, group3 } = getRoundArmholeShaping(ptsToDec);
            const inst = [];
            if (initialBindoff > 0) inst.push(`Arr. ${initialBindoff} pts. + 2 carrs. 1x`);
            if (group1 > 0) inst.push(`Dim. 1 pt. + 1 carr. ${group1} x`);
            if (group2 > 0) inst.push(`Dim. 1 pt. + 2 carrs. ${group2} x`);
            if (group3 > 0) inst.push(`Dim. 1 pt. + 3 carrs. ${group3} x`);
            return inst;
        };

        const getAdjustmentInstructionsAndRows = (ptsToIncrease: number, availableRows: number) => {
            const targetRows = availableRows;
            const baseInterval = Math.floor(targetRows / ptsToIncrease);
            const remainder = targetRows % ptsToIncrease;
            const instructions = [];
            if (remainder > 0) {
                instructions.push(`Aum. 1 pt. + ${baseInterval + 1} carrs. ${remainder} x`);
            }
            if (ptsToIncrease - remainder > 0) {
                instructions.push(`Aum. 1 pt. + ${baseInterval} carrs. ${ptsToIncrease - remainder} x`);
            }
            const totalRowsUsed = remainder * (baseInterval + 1) + (ptsToIncrease - remainder) * baseInterval;
            return { instructions, totalRowsUsed };
        };

        const getRoundNecklineShaping = (sidePts: number) => {
            const firstPart = Math.ceil(sidePts / 2);
            const secondPart = Math.floor(sidePts / 2);
            const step1 = Math.ceil(firstPart / 2);
            const step2 = Math.floor(firstPart / 2);
            const step3 = Math.ceil(secondPart / 2);
            const step4 = Math.floor(secondPart / 2);
            return {
                step1,
                step2,
                step3,
                step4
            };
        };

        const getShoulderSlopeShaping = (shoulderSts: number, slopeRows: number) => {
            const numSteps = Math.max(1, Math.floor(slopeRows / 2));
            const totalGroups = numSteps + 1;
            const base = Math.floor(shoulderSts / totalGroups);
            const rem = shoulderSts % totalGroups;
            const stepUpCount = rem;
            const stepBaseCount = totalGroups - rem;
            const instructions = [];
            if (stepUpCount > 0) {
                instructions.push(`Susp. ${base + 1} pts. + 2 carrs. ${stepUpCount}x`);
            }
            const activeBaseCount = stepBaseCount - 1;
            if (activeBaseCount > 0) {
                instructions.push(`Susp. ${base} pts. + 2 carrs. ${activeBaseCount}x`);
            }
            instructions.push(`Susp. ${base} pts. restantes.`);
            return instructions;
        };

        const getSleeveCapCurve = (totalPts: number, totalRows: number, ib: number): string[] => {
            if (!isCavaRedonda) {
                const inst: string[] = [];
                if (totalPts <= 0 || totalRows <= 0) return [];
                let remPts = totalPts;
                const start2s = Math.min(remPts, 2);
                remPts -= start2s;
                const end2s = Math.min(remPts, 4);
                remPts -= end2s;
                const middle1s = remPts;
                const activeRows = totalRows - 2 - (start2s > 0 ? 2 : 0) - (end2s > 0 ? 4 : 0);
                
                if (start2s > 0) inst.push(`Diminua **2 pts** a cada 2 carreiras, **1 x**`);
                if (middle1s > 0 && activeRows > 0) {
                    const baseInterval = Math.floor(activeRows / middle1s);
                    const extraRows = activeRows % middle1s;
                    if (extraRows > 0) inst.push(`Diminua **1 pt** a cada ${baseInterval + 1} carreiras, **${extraRows} x**`);
                    if (middle1s - extraRows > 0) inst.push(`Diminua **1 pt** a cada ${baseInterval} carreiras, **${middle1s - extraRows} x**`);
                }
                if (end2s > 0) {
                    const times = Math.ceil(end2s / 2);
                    inst.push(`Diminua **2 pts** a cada 2 carreiras, **${times} x**`);
                }
                return inst;
            } else {
                const activeRows = totalRows - 2;
                if (totalPts <= 0 || activeRows <= 0) return [];
                
                let times2_start = Math.max(0, Math.min(2, Math.floor(totalPts / 6)));
                let times3_end = Math.max(0, Math.min(1, Math.floor((totalPts - times2_start * 2) / 6)));
                let times2_end = Math.max(0, Math.min(1, Math.floor((totalPts - times2_start * 2 - times3_end * 3) / 4)));
                
                let ptsLeft = totalPts - (times2_start * 2 + times2_end * 2 + times3_end * 3);
                let times1_middle = Math.max(0, ptsLeft);
                
                const fixedRows = 2 * (times2_start + times2_end + times3_end);
                const remRows = Math.max(0, activeRows - fixedRows);
                
                let evenInterval = 2;
                if (times1_middle > 0 && remRows > 0) {
                    const interval = remRows / times1_middle;
                    evenInterval = Math.max(2, Math.floor(interval / 2) * 2);
                }
                
                const straightRows = Math.max(0, remRows - (times1_middle * evenInterval));
                const inst: string[] = [];
                
                if (times2_start > 0) {
                    inst.push(`Arr. 2 pts. + 2 carrs. ${times2_start}x`);
                }
                if (times1_middle > 0) {
                    inst.push(`Dim. 1 pt. + ${evenInterval} carrs. ${times1_middle} x`);
                }
                if (times2_end > 0) {
                    inst.push(`Arr. 2 pts. + 2 carrs. ${times2_end}x`);
                }
                if (times3_end > 0) {
                    inst.push(`Arr. 3 pts. + 2 carrs. ${times3_end}x`);
                }
                if (straightRows > 0) {
                    inst.push(`Teça as **${straightRows} carreiras** restantes reto (sem diminuir).`);
                }
                
                return inst;
            }
        };

        const bustSts = roundToEven((isCavaRedonda ? (body.roundBustWidth || 0) : (body.bustWidth || 0)) * stsPerCm);
        const necklineBackSts = roundToEven((isCavaRedonda ? (body.roundBackNecklineWidth || 0) : (body.necklineBackWidth || 0)) * stsPerCm);
        const frontCrossChestSts = isCavaRedonda ? roundToEven((body.roundFrontCrossChest || 0) * stsPerCm) : 0;
        const backCrossChestSts = isCavaRedonda ? roundToEven((body.roundBackCrossChest || 0) * stsPerCm) : 0;

        const necklineFrontSts = isCavaRedonda
            ? necklineBackSts
            : roundToEven((body.necklineFrontWidth || 0) * stsPerCm);

        const shoulderSts = isCavaRedonda 
            ? ((body.roundShoulderWidth && body.roundShoulderWidth > 0)
                ? Math.round(body.roundShoulderWidth * stsPerCm)
                : Math.max(0, Math.round((frontCrossChestSts - necklineFrontSts) / 2)))
            : 0;

        const transpasseWidth = parseFloat(buttonBandWidth) || 0;
        const transpasseSts = roundToEven(transpasseWidth * stsPerCm);
        const armholeStartRow = roundToEven((isCavaRedonda ? (body.roundHemToArmholeHeight || 0) : (body.hemToArmholeHeight || 0)) * rowsPerCm);
        
        const shoulderSlopeRows = isCavaRedonda ? roundToEven((body.roundShoulderSlope || 0) * rowsPerCm) : 0;
        const roundArmholeRows = isCavaRedonda ? roundToEven((body.roundArmholeHeight || 0) * rowsPerCm) : 0;

        const armholeRowsFront = isCavaRedonda 
            ? (roundArmholeRows + shoulderSlopeRows) 
            : roundToEven((body.armholeHeightFront || 0) * rowsPerCm);
        const armholeRowsBack = isCavaRedonda 
            ? (roundArmholeRows + shoulderSlopeRows) 
            : roundToEven((body.armholeHeightBack || 0) * rowsPerCm);

        const ptsPerDec = parseInt(recipeDetails.raglanDecreaseType) || 1;
        
        const initialBindoffSts = Math.round(2 * stsPerCm);
        
        const ptsToDecFrontBodyPerSide = isCavaRedonda 
            ? ((bustSts - frontCrossChestSts) / 2)
            : ((bustSts - (initialBindoffSts * 2) - necklineFrontSts) / 2);
        
        const ptsToDecBackBodyPerSide = isCavaRedonda
            ? ((bustSts - backCrossChestSts) / 2)
            : ((bustSts - (initialBindoffSts * 2) - necklineBackSts) / 2);

        const frontArmholeCurve = isCavaRedonda ? getArmholeCurve(ptsToDecFrontBodyPerSide) : { initialBindoff: initialBindoffSts, steps: [] };
        const backArmholeCurve = isCavaRedonda ? getArmholeCurve(ptsToDecBackBodyPerSide) : { initialBindoff: initialBindoffSts, steps: [] };

        const numEventsBodyF = isCavaRedonda ? 0 : (ptsToDecFrontBodyPerSide > 0 ? Math.ceil(ptsToDecFrontBodyPerSide / ptsPerDec) : 0);
        const numEventsBodyB = isCavaRedonda ? 0 : (ptsToDecBackBodyPerSide > 0 ? Math.ceil(ptsToDecBackBodyPerSide / ptsPerDec) : 0);
        
        const isFoldedRibbing = barTypeSelection === 'Barra dobrada em Ponto Meia';
        const ribbingHeight = parseFloat(recipeDetails.ribbingHeightCm) || 0;
        const barSwatchCm = parseFloat(barSwatchOrlaLength) || 0;
        const barRowsPerCm = barSwatchCm > 0 ? (35 / barSwatchCm) : rowsPerCm;
        
        let calculatedRibbingRows = roundToEven(ribbingHeight * barRowsPerCm);
        if (isFoldedRibbing) {
            calculatedRibbingRows = roundToEven(calculatedRibbingRows * 2);
        }
        const mainGaugeNum = parseFloat(gauge) || 0;
        const ribbingGaugeValue = isFoldedRibbing ? (mainGaugeNum - 1).toString() : (barSwatchGauge || recipeDetails.ribbingGauge || gauge);
        const closingGaugeValue = (mainGaugeNum + 2).toString();

        const recipeParts: RecipePart[] = [];
        const frontSteps: RecipeStep[] = [];
        const frontWidthPts = isOpenPiece ? (Math.round(bustSts / 2) - (transpasseSts / 2)) : bustSts;
        const targetNecklineFrontSts = isOpenPiece ? (necklineFrontSts / 2 - (transpasseSts / 2)) : necklineFrontSts;
        const frontNeedles = Math.round(frontWidthPts / 2);
        const frontNeedlesText = isOpenPiece ? `**${frontWidthPts} agulhas** em trabalho` : `**${frontNeedles}x${frontNeedles} agulhas**`;
        
        const isDecoteV = necklineSelection === 'Decote em V' || necklineSelection === 'Decote V' || necklineType === 'v_1' || necklineType === 'v_2';
        
        const effectiveNecklineFrontDepth = isCavaRedonda
            ? (isDecoteV ? (body.roundFrontNecklineDepthV || 0) : (body.roundFrontNecklineDepthRound || 0))
            : (body.necklineFrontDepth || 0);
        const effectiveNecklineBackDepth = isCavaRedonda
            ? (body.roundBackNecklineDepth || 0)
            : (body.necklineBackDepth || 0);

        if (isCavaRedonda) {
            const totalFrontRows = armholeStartRow + armholeRowsFront;
            const necklineDepthRowsFront = roundToEven(effectiveNecklineFrontDepth * rowsPerCm);
            const necklineStartRow = totalFrontRows - necklineDepthRowsFront;
            const isDeepNeckline = necklineDepthRowsFront > 0 && necklineStartRow < armholeStartRow;

            // 1. Barra e Corpo (Frente)
            const bodyEndRow = isDeepNeckline ? necklineStartRow : armholeStartRow;
            frontSteps.push({
                title: isFoldedRibbing ? "1. BARRA e CORPO" : (isDeepNeckline ? "1. Barra e Corpo (até o início do decote)" : "1. Barra e Corpo (até a cava)"),
                description: isFoldedRibbing 
                    ? `Selecione **${frontNeedlesText} agulhas**, monte os pontos com o fio de outra cor e teça **12 carreiras** em regulagem **${gauge}**. Ajuste a regulagem para **${ribbingGaugeValue}** e com o fio do trabalho teça **${calculatedRibbingRows}** carreiras. Dobre a barra e feche com uma carreira na regulagem **${closingGaugeValue}**. Mude para a regulagem **${gauge}** e teça por **${bodyEndRow}** carreiras. ${isDeepNeckline ? 'Inicie a modelagem do decote no passo a seguir.' : '**ZERE O CONTADOR** e modele a cava no passo a seguir.'}`
                    : `Selecione **${frontNeedlesText} agulhas**, faça a preparação para a barra **${barTypeSelection || '1x1'}** e teça **${calculatedRibbingRows}** carreiras na regulagem **${ribbingGaugeValue}**. Após finalizar a barra, **ZERE O CONTADOR**, passe os pontos da frontura para a máquina e teça em ponto meia na regulagem **${gauge || '0'}** por **${bodyEndRow}** carreiras. ${isDeepNeckline ? 'Inicie a modelagem do decote no passo a seguir.' : 'Antes de modelar a cava, zere o contador de carreiras.'}`,
                technicalDetails: [
                    "**Base de Cálculo (Apenas Visualização)**", 
                    `Largura: ${frontWidthPts} pts`, 
                    isDeepNeckline ? `Altura até Decote: ${necklineStartRow} carrs.` : `Altura até Cava: ${armholeStartRow} carrs.`, 
                    `Carreiras Barra: ${calculatedRibbingRows}`
                ]
            });

            // Preparação do passo do Decote (se houver)
            let decoteStep: any = null;
            if (necklineDepthRowsFront > 0) {
                const decoteInsts = [];
                const isDecoteV = necklineSelection === 'Decote em V' || necklineSelection === 'Decote V';
                if (isDecoteV) {
                    const ptsToDecV = isOpenPiece ? targetNecklineFrontSts : (targetNecklineFrontSts / 2);
                    const numPointsPerEvent = parseInt(recipeDetails.vNeckDecreaseType) || 1;
                    const numEventsV = Math.ceil(ptsToDecV / numPointsPerEvent);
                    if (numEventsV > 0) {
                        const baseInterval = Math.floor(necklineDepthRowsFront / numEventsV);
                        const extraRows = necklineDepthRowsFront % numEventsV;
                        if (extraRows > 0) decoteInsts.push(`Dim. ${numPointsPerEvent} pt${numPointsPerEvent > 1 ? 's' : ''}. + ${baseInterval + 1} carrs. ${extraRows} x`);
                        if (numEventsV - extraRows > 0) decoteInsts.push(`Dim. ${numPointsPerEvent} pt${numPointsPerEvent > 1 ? 's' : ''}. + ${baseInterval} carrs. ${numEventsV - extraRows} x`);
                    }
                } else {
                    if (isOpenPiece) {
                        const { step1, step2, step3, step4 } = getRoundNecklineShaping(targetNecklineFrontSts);
                        if (step1 > 0 && step2 > 0 && step1 === step2) {
                            decoteInsts.push(`Arr. ${step1} pts. + 2 carrs. 2x`);
                        } else {
                            if (step1 > 0) decoteInsts.push(`Arr. ${step1} pts. + 2 carrs. 1x`);
                            if (step2 > 0) decoteInsts.push(`Arr. ${step2} pts. + 2 carrs. 1x`);
                        }
                        if (step3 > 0) decoteInsts.push(`Dim. 1 pt. + 1 carr. ${step3} x`);
                        if (step4 > 0) decoteInsts.push(`Dim. 1 pt. + 2 carrs. ${step4} x`);
                    } else {
                        const centralPtsFront = Math.max(2, roundToEven(necklineFrontSts / 3));
                        const sidePtsFront = (necklineFrontSts - centralPtsFront) / 2;
                        const { step1, step2, step3, step4 } = getRoundNecklineShaping(sidePtsFront);
                        
                        if (centralPtsFront > 0) decoteInsts.push(`Arr. ${centralPtsFront} pts. centrais.`);
                        if (step1 > 0 && step2 > 0 && step1 === step2) {
                            decoteInsts.push(`Arr. ${step1} pts. + 2 carrs. 2x`);
                        } else {
                            if (step1 > 0) decoteInsts.push(`Arr. ${step1} pts. + 2 carrs. 1x`);
                            if (step2 > 0) decoteInsts.push(`Arr. ${step2} pts. + 2 carrs. 1x`);
                        }
                        if (step3 > 0) decoteInsts.push(`Dim. 1 pt. + 1 carr. ${step3} x`);
                        if (step4 > 0) decoteInsts.push(`Dim. 1 pt. + 2 carrs. ${step4} x`);
                    }
                }

                let decoteDesc = "";
                if (isDeepNeckline) {
                    const armholeExplanation = shoulderSlopeRows > 0 
                        ? `altura da cava somada à inclinação do ombro (${armholeRowsFront} carrs., sendo ${roundArmholeRows} da cava + ${shoulderSlopeRows} do ombro)`
                        : `altura da cava (${armholeRowsFront} carrs.)`;
                    decoteDesc = `Como a profundidade do decote (${necklineDepthRowsFront} carrs.) é maior que a ${armholeExplanation}, inicie a modelagem do decote na carreira **${necklineStartRow}** (contando a partir da barra), ou seja, **${armholeStartRow - necklineStartRow} carreiras antes da cava**. ${isOpenPiece ? 'Trabalhe um lado de cada vez.' : 'Divida o trabalho (separar direito e esquerdo) ainda na parte reta do corpo antes de arrematar as cavas. Arremates e diminuições sempre em ponto meia. Trabalhe um lado de cada vez.'}`;
                } else {
                    decoteDesc = isOpenPiece 
                        ? `Na carreira **${armholeRowsFront - necklineDepthRowsFront}** após a cava (carr. **${necklineStartRow}** a partir da barra), inicie a modelagem do decote na borda do abotoamento com arremates e diminuições em ponto meia.`
                        : `Na carreira **${armholeRowsFront - necklineDepthRowsFront}** após a cava (carr. **${necklineStartRow}** a partir da barra), separe o decote utilizando a técnica de sua preferência. Sugiro a técnica que usa algumas carreiras em fio de outra cor, isso evita marcas de agulhas em suspenso. Arremates e diminuições sempre em ponto meia. Trabalhe um lado de cada vez.`;
                }

                decoteStep = {
                    title: isDecoteV ? `Decote V (${recipeDetails.vNeckDecreaseType || '1'} em ${recipeDetails.vNeckDecreaseType || '1'})` : "Decote Redondo",
                    description: decoteDesc,
                    shaping: {
                        instructions: decoteInsts
                    },
                    technicalDetails: [
                        "**Base de Cálculo (Apenas Visualização)**",
                        `Largura Decote: ${isOpenPiece ? targetNecklineFrontSts : necklineFrontSts} pts`,
                        `Profundidade: ${necklineDepthRowsFront} carrs`,
                        `Transpasse descontado: ${isOpenPiece ? 'Sim' : 'No'}`,
                        `Início: ${isDeepNeckline ? `carr. ${necklineStartRow} da barra (${armholeStartRow - necklineStartRow} carrs. antes da cava)` : `carr. ${armholeRowsFront - necklineDepthRowsFront} após cava (carr. ${necklineStartRow} da barra)`}`
                    ]
                };
            }

            // Preparação do passo da Cava
            const { initialBindoff, group1, group2, group3 } = getRoundArmholeShaping(ptsToDecFrontBodyPerSide);
            const armholeInsts = [];
            if (initialBindoff > 0) armholeInsts.push(`Arr. ${initialBindoff} pts. + 2 carrs. 1x`);
            if (group1 > 0) armholeInsts.push(`Dim. 1 pt. + 1 carr. ${group1} x`);
            if (group2 > 0) armholeInsts.push(`Dim. 1 pt. + 2 carrs. ${group2} x`);
            if (group3 > 0) armholeInsts.push(`Dim. 1 pt. + 3 carrs. ${group3} x`);
            
            const targetFrontCrossStsPerSide = isOpenPiece ? (Math.round(frontCrossChestSts / 2) - (transpasseSts / 2)) : frontCrossChestSts;
            const targetFrontCrossText = isOpenPiece ? `**${targetFrontCrossStsPerSide} agulhas** em trabalho` : `**${Math.round(frontCrossChestSts / 2)}x${Math.round(frontCrossChestSts / 2)} agulhas** no total`;

            const cavaStep = {
                title: "Modelagem da Cava",
                description: isDeepNeckline
                    ? `Ao atingir a carreira **${armholeStartRow}** (contando a partir da barra), faça a cava utilizando arremates e diminuições em ponto meia, continuando as diminuições do decote em paralelo. Ao final desta etapa, você terá ${targetFrontCrossText}.`
                    : `Após tecer **${armholeStartRow} carreiras** em ponto meia na regulagem **${gauge}**, **ZERE O CONTADOR** e faça a cava utilizando arremates e diminuições em ponto meia. Ao final desta etapa, você terá ${targetFrontCrossText}.`,
                shaping: {
                    instructions: armholeInsts,
                    notes: isOpenPiece ? `Instruções para o lado da cava. Ao final, você terá ${targetFrontCrossStsPerSide} pts.` : `Instruções para cada lado. Ao final, você terá ${frontCrossChestSts} pts.`
                },
                technicalDetails: [
                    "**Base de Cálculo (Apenas Visualização)**",
                    `Início: ${frontWidthPts} pts`,
                    `Alvo: ${targetFrontCrossStsPerSide} pts`,
                    `Redução: ${frontWidthPts - targetFrontCrossStsPerSide} pts`
                ]
            };

            // Preparação do passo Ajuste da Cava
            const targetTotalStsFront = 2 * shoulderSts + necklineFrontSts;
            const diffFrenteTeorico = targetTotalStsFront - frontCrossChestSts;
            const ajustePorLadoFront = Math.round(diffFrenteTeorico / 2);
            let ajusteStep: any = null;
            if (ajustePorLadoFront > 0) {
                const straightArmholeRowsFront = roundArmholeRows;
                const startRowFrontAdjustment = Math.round(straightArmholeRowsFront / 2);
                const availableRowsFront = Math.max(ajustePorLadoFront, straightArmholeRowsFront - startRowFrontAdjustment);
                const { instructions: adjustmentInsts, totalRowsUsed: adjustmentTotalRowsFront } = getAdjustmentInstructionsAndRows(ajustePorLadoFront, availableRowsFront);
                
                ajusteStep = {
                    title: "Ajuste da Cava",
                    description: `Na carreira **${startRowFrontAdjustment} após a cava**, realize os aumentos sempre do lado oposto do carro para obter uma borda mais uniforme e sem alças aparentes ou use aumentos internos.`,
                    shaping: {
                        instructions: adjustmentInsts,
                        notes: `Aumente ${ajustePorLadoFront} pts para ajustar a peça. Ao final, você terá ${targetTotalStsFront} pts.`
                    },
                    technicalDetails: [
                        "**Base de Cálculo (Apenas Visualização)**",
                        `Dif. Frente/Teórico: ${diffFrenteTeorico} pts`,
                        `Ajuste por lado: ${ajustePorLadoFront} pts`,
                        `Carreiras: ${adjustmentTotalRowsFront}`,
                        `Início na carr. ${startRowFrontAdjustment}`
                    ]
                };
            }

            // Inserir os passos na ordem correta
            if (isDeepNeckline) {
                if (decoteStep) {
                    decoteStep.title = `2. ${decoteStep.title}`;
                    frontSteps.push(decoteStep);
                }
                cavaStep.title = `3. ${cavaStep.title}`;
                frontSteps.push(cavaStep);
                if (ajusteStep) {
                    ajusteStep.title = `4. ${ajusteStep.title}`;
                    frontSteps.push(ajusteStep);
                }
            } else {
                cavaStep.title = `2. ${cavaStep.title}`;
                frontSteps.push(cavaStep);
                if (ajusteStep) {
                    ajusteStep.title = `3. ${ajusteStep.title}`;
                    frontSteps.push(ajusteStep);
                }
                if (decoteStep) {
                    decoteStep.title = `${ajusteStep ? '4' : '3'}. ${decoteStep.title}`;
                    frontSteps.push(decoteStep);
                }
            }

            // Ombro (Frente)
            if (body.roundShoulderSlope > 0) {
                const slopeRowsFront = roundToEven(body.roundShoulderSlope * rowsPerCm);
                const ombroInsts = getShoulderSlopeShaping(shoulderSts, slopeRowsFront);
                const ombroStepNum = frontSteps.length + 1;
                
                frontSteps.push({
                    title: `${ombroStepNum}. Ombro`,
                    description: `Na carreira **${armholeRowsFront - slopeRowsFront - 1}**, inicie as suspensões do ombro. Ao finalizar, retire da máquina em fio de outra cor.`,
                    shaping: {
                        instructions: ombroInsts,
                        notes: `Ombro moldado com carreiras encurtadas. Inicie na carreira indicada. Retire com fio de outra cor.`
                    },
                    technicalDetails: [
                        "**Base de Cálculo (Apenas Visualização)**",
                        `Largura Ombro (Padrão): ${shoulderSts} pts`,
                        `Largura Ombro (Efetiva): ${shoulderSts} pts`,
                        `Altura Ombro: ${slopeRowsFront} carrs`,
                        `Início na carr. ${armholeRowsFront - slopeRowsFront - 1}`
                    ]
                });
            }

        } else {
            // General Raglan logic for Frente
            const totalFrontRows = armholeStartRow + armholeRowsFront;
            const necklineDepthRows = roundToEven(effectiveNecklineFrontDepth * rowsPerCm);
            const neckStartRow = totalFrontRows - necklineDepthRows;
            const isDeepNeck = effectiveNecklineFrontDepth > 0 && neckStartRow < armholeStartRow;

            const bodyEndRow = isDeepNeck ? neckStartRow : armholeStartRow;
            frontSteps.push({
                title: isFoldedRibbing ? "1. BARRA e CORPO" : (isDeepNeck ? "1. Barra e Corpo (até o início do decote)" : "1. Barra e Corpo (até a cava)"),
                description: isFoldedRibbing 
                    ? `Selecione **${frontNeedlesText} agulhas**, monte os pontos com o fio de outra cor e teça **12 carreiras** em regulagem **${gauge}**. Ajuste a regulagem para **${ribbingGaugeValue}** e com o fio do trabalho teça **${calculatedRibbingRows}** carreiras. Dobre a barra e feche com uma carreira na regulagem **${closingGaugeValue}**. Mude para a regulagem **${gauge}** e teça por **${bodyEndRow}** carreiras. ${isDeepNeck ? 'Inicie a modelagem do decote no passo a seguir.' : '**ZERE O CONTADOR** e modele a cava no passo a seguir.'}`
                    : `Selecione **${frontNeedlesText} agulhas**, faça a preparação para a barra **${barTypeSelection || '1x1'}** e teça **${calculatedRibbingRows}** carreiras na regulagem **${ribbingGaugeValue}**. Após finalizar a barra, **ZERE O CONTADOR**, passe os pontos da frontura para a máquina e teça em ponto meia na regulagem **${gauge || '0'}** por **${bodyEndRow}** carreiras. ${isDeepNeck ? 'Inicie a modelagem do decote no passo a seguir.' : 'Antes de modelar a cava, zere o contador de carreiras.'}`,
                technicalDetails: ["**Base de Cálculo (Apenas Visualização)**", `**Início:** ${frontWidthPts} pts`, isDeepNeck ? `**Altura até Decote:** ${neckStartRow} carrs.` : `**Altura da Barra/Cava:** ${armholeStartRow} carrs.`]
            });

            // Preparação do passo da Cava Raglan
            let cavaRaglanStep: any = null;
            if (numEventsBodyF > 0) {
                const decRows = getDecreaseRows(numEventsBodyF, armholeRowsFront - 2);
                cavaRaglanStep = {
                    title: "Modelagem da Cava Raglan Frente",
                    description: isDeepNeck 
                        ? `Ao atingir a carreira **${armholeStartRow}** (a partir da barra), faça a cava utilizando arremates e diminuições internas de **${ptsPerDec} em ${ptsPerDec} pontos**, continuando as diminuições do decote em paralelo.`
                        : `**Zere o contador** e faça a cava utilizando arremates e diminuições internas de **${ptsPerDec} em ${ptsPerDec} pontos** .`,
                    shaping: {
                        instructions: [`Arremate **${initialBindoffSts} pts** + 2 carreiras 1x`, ...formatBodyRaglanDecreases(ptsToDecFrontBodyPerSide, numEventsBodyF, armholeRowsFront - 2, ptsPerDec), `**Carrs. de Diminuição:** ${decRows.map(r => r.toString().padStart(3, '0')).join(', ')}`],
                        notes: `Instruções para o lado da cava. Ao final, você terá ${targetNecklineFrontSts} pts.`
                    },
                    technicalDetails: ["**Base de Cálculo (Apenas Visualização)**", `**Início:** ${frontWidthPts} pts`, `**Alvo:** ${targetNecklineFrontSts} pts`, `**Redução:** ${frontWidthPts - targetNecklineFrontSts} pts`, `**Altura da cava Frente:** ${armholeRowsFront} carrs.`]
                };
            }

            // Preparação do passo do Decote Raglan
            let decoteRaglanStep: any = null;
            if (isDecoteV && effectiveNecklineFrontDepth > 0) {
                const ptsToDecV = isOpenPiece ? targetNecklineFrontSts : (targetNecklineFrontSts / 2);
                const numPointsPerEvent = parseInt(recipeDetails.vNeckDecreaseType) || 1;
                const numEventsV = Math.ceil(ptsToDecV / numPointsPerEvent);
                const vNeckInstructions = [];
                
                if (!isOpenPiece) {
                    vNeckInstructions.push(`Divida o trabalho ao meio para iniciar o decote em V.`);
                }

                if (numEventsV > 0) {
                    const baseInterval = Math.floor(necklineDepthRows / numEventsV);
                    const extraRows = necklineDepthRows % numEventsV;
                    if (extraRows > 0) vNeckInstructions.push(`Diminua **${numPointsPerEvent} pt${numPointsPerEvent > 1 ? 's' : ''}.** + ${baseInterval + 1} carrs. ${extraRows} x`);
                    if (numEventsV - extraRows > 0) vNeckInstructions.push(`Diminua **${numPointsPerEvent} pt${numPointsPerEvent > 1 ? 's' : ''}.** + ${baseInterval} carrs. ${numEventsV - extraRows} x`);
                }

                let vNeckDescription = "";
                if (isDeepNeck) {
                    vNeckDescription = `Como a profundidade do decote em V (${necklineDepthRows} carrs.) é maior que a altura da cava (${armholeRowsFront} carrs.), inicie a modelagem do decote em V na carreira **${neckStartRow}** (contando a partir da barra), ou seja, **${armholeStartRow - neckStartRow} carreiras antes da cava**. Divida o trabalho e execute as diminuições do V ainda no corpo reto, continuando a modelagem ao atingir a cava. Trabalhe um lado de cada vez.`;
                } else {
                    vNeckDescription = `Na carreira **${armholeRowsFront - necklineDepthRows}** após a cava (carr. **${neckStartRow}** a partir da barra), inicie a modelagem do decote em V. Trabalhe um lado de cada vez.`;
                }

                decoteRaglanStep = {
                    title: `Decote em V (${recipeDetails.vNeckDecreaseType || '1'} em ${recipeDetails.vNeckDecreaseType || '1'})`,
                    description: vNeckDescription,
                    shaping: { instructions: vNeckInstructions, notes: `A profundidade total do decote é de ${necklineDepthRows} carreiras.` },
                    technicalDetails: [
                        "**Base de Cálculo (Apenas Visualização)**", 
                        `**Total de Pontos a Reduzir (por lado):** ${ptsToDecV} pts`, 
                        `**Carreiras do Decote:** ${necklineDepthRows} carrs.`,
                        `**Início do Decote:** ${isDeepNeck ? `carr. ${neckStartRow} da barra (${armholeStartRow - neckStartRow} carrs. antes da cava)` : `carr. ${armholeRowsFront - necklineDepthRows} após cava (carr. ${neckStartRow} da barra)`}`
                    ]
                };
            } else if (!isDecoteV && effectiveNecklineFrontDepth > 0) {
                const centralPts = Math.max(2, Math.round(((necklineFrontSts / 3) - 6) / 2) * 2);
                const sidePtsTotal = (necklineFrontSts - centralPts) / 2;
                
                let halfTranspasse = isOpenPiece ? (transpasseSts / 2) : 0;
                let currentSideCentral = isOpenPiece ? (centralPts / 2) : centralPts;
                let currentSidePtsTotal = sidePtsTotal;

                const subFromCentral = Math.min(halfTranspasse, currentSideCentral);
                currentSideCentral -= subFromCentral;
                halfTranspasse -= subFromCentral;

                if (halfTranspasse > 0) {
                    const subFromSide = Math.min(halfTranspasse, currentSidePtsTotal);
                    currentSidePtsTotal -= subFromSide;
                    halfTranspasse -= subFromSide;
                }

                const numSteps = Math.max(1, Math.floor((necklineDepthRows - 2) / 2) + 1);
                const roundNecklineInstructions = [];
                
                if (currentSideCentral > 0 || !isOpenPiece) {
                    roundNecklineInstructions.push(`Suspenda **${currentSideCentral} pts.** ${isOpenPiece ? 'na borda frontal' : 'centrais'}.`);
                }

                if (numSteps > 0 && currentSidePtsTotal > 0) {
                    const basePts = Math.floor(currentSidePtsTotal / numSteps);
                    const extraPts = Math.round(currentSidePtsTotal % numSteps);
                    if (extraPts > 0) roundNecklineInstructions.push(`Suspenda **${basePts + 1} pts.** + 2 carrs. ${extraPts} x`);
                    if (numSteps - extraPts > 0) roundNecklineInstructions.push(`Suspenda **${basePts} pts.** + 2 carrs. ${numSteps - extraPts} x`);
                }

                decoteRaglanStep = {
                    title: "Decote Redondo (Agulhas em Suspenso)",
                    description: isDeepNeck 
                        ? `Como a profundidade do decote (${necklineDepthRows} carrs.) é maior que a altura da cava (${armholeRowsFront} carrs.), inicie a modelagem na carreira **${neckStartRow}** (a partir da barra), antes de iniciar a cava. Trabalhe um lado de cada vez.`
                        : `Na carreira **${armholeRowsFront - necklineDepthRows}** após a cava (carr. **${neckStartRow}** da barra), inicie a modelagem do decote utilizando a técnica de agulhas em suspenso (posição de repouso). Trabalhe um lado de cada vez.`,
                    shaping: { instructions: roundNecklineInstructions, notes: `A profundidade total do decote é de ${necklineDepthRows} carreiras.` },
                    technicalDetails: [
                        "**Base de Cálculo (Apenas Visualização)**", 
                        `**Largura do Decote:** ${targetNecklineFrontSts} pts`, 
                        `**Carreiras do Decote:** ${necklineDepthRows} carrs.`,
                        `**Início:** ${isDeepNeck ? `carr. ${neckStartRow} da barra (${armholeStartRow - neckStartRow} carrs. antes da cava)` : `carr. ${armholeRowsFront - necklineDepthRows} após cava (carr. ${neckStartRow} da barra)`}`
                    ]
                };
            }

            // Inserir os passos na ordem correta
            if (isDeepNeck) {
                if (decoteRaglanStep) {
                    decoteRaglanStep.title = `2. ${decoteRaglanStep.title}`;
                    frontSteps.push(decoteRaglanStep);
                }
                if (cavaRaglanStep) {
                    cavaRaglanStep.title = `3. ${cavaRaglanStep.title}`;
                    frontSteps.push(cavaRaglanStep);
                }
            } else {
                if (cavaRaglanStep) {
                    cavaRaglanStep.title = `2. ${cavaRaglanStep.title}`;
                    frontSteps.push(cavaRaglanStep);
                }
                if (decoteRaglanStep) {
                    decoteRaglanStep.title = `3. ${decoteRaglanStep.title}`;
                    frontSteps.push(decoteRaglanStep);
                }
            }

            if (isCavaRedonda && body.roundShoulderSlope > 0) {
                const slopeRows = roundToEven(body.roundShoulderSlope * rowsPerCm);
                const slopeSteps = Math.max(1, Math.floor(slopeRows / 2));
                const stsPerSlopeStep = Math.floor(shoulderSts / slopeSteps);
                const remSlopeSts = shoulderSts % slopeSteps;
                const slopeInstructions = [];
                if (slopeSteps > 0) {
                    if (remSlopeSts > 0) {
                        slopeInstructions.push(`Coloque em suspenso **${stsPerSlopeStep + 1} pts.** a cada 2 carreiras, **${remSlopeSts} x**`);
                    }
                    if (slopeSteps - remSlopeSts > 0) {
                        slopeInstructions.push(`Coloque em suspenso **${stsPerSlopeStep} pts.** a cada 2 carreiras, **${slopeSteps - remSlopeSts} x**`);
                    }
                }
                frontSteps.push({
                    title: "4. Inclinação do Ombro Frente",
                    description: `Na carreira **${armholeRowsFront - slopeRows}**, inicie a inclinação dos ombros colocando os pontos em suspenso na borda externa.`,
                    shaping: {
                        instructions: slopeInstructions,
                        notes: `Isso moldará a inclinação do ombro de forma suave.`
                    },
                    technicalDetails: ["**Base de Cálculo (Apenas Visualização)**", `**Largura do Ombro:** ${shoulderSts} pts`, `**Carreiras de Inclinação:** ${slopeRows} carrs.`]
                });
            }
        }

        recipeParts.push({ title: isOpenPiece ? "FRENTE (X2)" : "FRENTE", steps: frontSteps });

        const backSteps: RecipeStep[] = [];

        if (isCavaRedonda) {
            // 1. Barra e Corpo (Costas)
            backSteps.push({
                title: isFoldedRibbing ? "1. BARRA e CORPO" : "1. Barra e Corpo (até a cava)",
                description: isFoldedRibbing
                    ? `Selecione **${Math.round(bustSts / 2)}x${Math.round(bustSts / 2)} agulhas**, monte os pontos com o fio de outra col e teça **12 carreiras** em regulagem **${gauge}**. Ajuste a regulagem para **${ribbingGaugeValue}** e com o fio do trabalho teça **${calculatedRibbingRows}** carreiras. Dobre a barra e feche com uma carreira na regulagem **${closingGaugeValue}**. Mude para a regulagem **${gauge}** e teça por **${armholeStartRow}** carreiras. **ZERE O CONTADOR** e modele a cava no passo a seguir.`
                    : `Selecione **${Math.round(bustSts / 2)}x${Math.round(bustSts / 2)} agulhas**, faça a preparação para a barra **${barTypeSelection || '1x1'}** e teça **${calculatedRibbingRows}** carreiras na regulagem **${ribbingGaugeValue}**. Após finalizar a barra, **ZERE O CONTADOR**, passe os pontos da frontura para a máquina e teça em ponto meia por **${armholeStartRow}** carreiras. Antes de modelar a cava, zere o contador de carreiras.`,
                technicalDetails: ["**Base de Cálculo (Apenas Visualização)**", `Largura: ${bustSts} pts`, `Altura até Cava: ${armholeStartRow} carrs.`, `Carreiras Barra: ${calculatedRibbingRows}`]
            });

            // 2. Modelagem da Cava (Costas)
            const { initialBindoff, group1, group2, group3 } = getRoundArmholeShaping(ptsToDecBackBodyPerSide);
            const armholeInsts = [];
            if (initialBindoff > 0) armholeInsts.push(`Arr. ${initialBindoff} pts. + 2 carrs. 1x`);
            if (group1 > 0) armholeInsts.push(`Dim. 1 pt. + 1 carr. ${group1} x`);
            if (group2 > 0) armholeInsts.push(`Dim. 1 pt. + 2 carrs. ${group2} x`);
            if (group3 > 0) armholeInsts.push(`Dim. 1 pt. + 3 carrs. ${group3} x`);
            
            backSteps.push({
                title: "2. Modelagem da Cava",
                description: `Após tecer **${armholeStartRow} carreiras** em ponto meia na regulagem **${gauge}**, **ZERE O CONTADOR** e faça a cava utilizando arremates e diminuições em ponto meia. Ao final desta etapa, você terá **${Math.round(backCrossChestSts / 2)}x${Math.round(backCrossChestSts / 2)} agulhas** em sua máquina.`,
                shaping: {
                    instructions: armholeInsts,
                    notes: `Instruções para cada lado. Ao final, você terá ${backCrossChestSts} pts.`
                },
                technicalDetails: [
                    "**Base de Cálculo (Apenas Visualização)**",
                    `Início: ${bustSts} pts`,
                    `Alvo: ${backCrossChestSts} pts`,
                    `Redução Total: ${bustSts - backCrossChestSts} pts`
                ]
            });

            // 3. Ajuste da Cava (Costas)
            const targetTotalStsBack = 2 * shoulderSts + necklineBackSts;
            const diffCostasTeorico = targetTotalStsBack - backCrossChestSts;
            const ajustePorLadoBack = Math.round(diffCostasTeorico / 2);
            
            if (ajustePorLadoBack > 0) {
                const straightArmholeRowsBack = roundArmholeRows;
                const startRowBackAdjustment = Math.round(straightArmholeRowsBack / 2);
                const availableRowsBack = Math.max(ajustePorLadoBack, straightArmholeRowsBack - startRowBackAdjustment);
                const { instructions: adjustmentInsts, totalRowsUsed: adjustmentTotalRowsBack } = getAdjustmentInstructionsAndRows(ajustePorLadoBack, availableRowsBack);
                
                backSteps.push({
                    title: "3. Ajuste da Cava",
                    description: `Na carreira **${startRowBackAdjustment} após a cava**, realize os aumentos sempre do lado oposto do carro para obter uma borda mais uniforme e sem alças aparentes ou use aumentos internos.`,
                    shaping: {
                        instructions: adjustmentInsts,
                        notes: `Aumente ${ajustePorLadoBack} pts para ajustar a peça. Ao final, você terá ${targetTotalStsBack} pts.`
                    },
                    technicalDetails: [
                        "**Base de Cálculo (Apenas Visualização)**",
                        `Dif. Costas/Teórico: ${diffCostasTeorico} pts`,
                        `Ajuste por lado: ${ajustePorLadoBack} pts`,
                        `Carreiras: ${adjustmentTotalRowsBack}`,
                        `Início na carr. ${startRowBackAdjustment}`
                    ]
                });
            }

            // 4. Ombro (Costas)
            const slopeRowsBack = roundToEven(body.roundShoulderSlope * rowsPerCm);
            const necklineBackDepthRows = roundToEven(effectiveNecklineBackDepth * rowsPerCm);
            const carrDecoteCostas = armholeRowsBack - necklineBackDepthRows;
            
            if (body.roundShoulderSlope > 0) {
                const ombroInsts = getShoulderSlopeShaping(shoulderSts, slopeRowsBack);
                let ombroDesc = `Na carreira **${armholeRowsBack - slopeRowsBack - 1}**, inicie as suspensões do ombro. Ao finalizar, retire da máquina em fio de outra cor.`;
                if (necklineBackDepthRows > 0) {
                    ombroDesc += ` Atenção: Na carreira **${carrDecoteCostas}**, inicie o decote das costas simultaneamente.`;
                }
                
                backSteps.push({
                    title: "4. Ombro",
                    description: ombroDesc,
                    shaping: {
                        instructions: ombroInsts,
                        notes: `Ombro moldado com carreiras encurtadas. Inicie na carreira indicada. Retire com fio de outra cor.`
                    },
                    technicalDetails: [
                        "**Base de Cálculo (Apenas Visualização)**",
                        `Largura Ombro (Padrão): ${shoulderSts} pts`,
                        `Largura Ombro (Efetiva): ${shoulderSts} pts`,
                        `Altura Ombro: ${slopeRowsBack} carrs`,
                        `Início na carr. ${armholeRowsBack - slopeRowsBack - 1}`
                    ]
                });
            }

            // 5. Decote das Costas
            if (necklineBackDepthRows > 0) {
                const centralBackPts = Math.max(2, roundToEven(necklineBackSts / 3));
                const sideBackPts = (necklineBackSts - centralBackPts) / 2;
                
                const numBackSteps = Math.max(1, Math.floor(necklineBackDepthRows / 2));
                const backNecklineInstructions = [];
                backNecklineInstructions.push(`Suspenda ${centralBackPts} pts. centrais.`);
                
                if (numBackSteps > 0 && sideBackPts > 0) {
                    const basePts = Math.floor(sideBackPts / numBackSteps);
                    const remPts = sideBackPts % numBackSteps;
                    if (remPts > 0) {
                        backNecklineInstructions.push(`Suspenda ${basePts + 1} pts. + 2 carrs. ${remPts}x`);
                    }
                    if (numBackSteps - remPts > 0) {
                        backNecklineInstructions.push(`Suspenda ${basePts} pts. + 2 carrs. ${numBackSteps - remPts}x`);
                    }
                }
                
                backSteps.push({
                    title: "5. Decote das Costas",
                    description: `Na carreira **${carrDecoteCostas}**, inicie a modelagem do decote das costas utilizando agulhas em suspenso.`,
                    shaping: {
                        instructions: backNecklineInstructions
                    },
                    technicalDetails: [
                        "**Base de Cálculo (Apenas Visualização)**",
                        `Largura Decote: ${necklineBackSts} pts`,
                        `Profundidade: ${necklineBackDepthRows} carrs`,
                        `Início na carr. ${carrDecoteCostas}`
                    ]
                });
            }

        } else {
            // General Raglan logic for Costas
            backSteps.push({
                title: isFoldedRibbing ? "1. BARRA e CORPO" : "1. Barra e Corpo (até a cava)",
                description: isFoldedRibbing
                    ? `Selecione **${Math.round(bustSts / 2)}x${Math.round(bustSts / 2)} agulhas**, monte os pontos com o fio de outra col e teça **12 carreiras** em regulagem **${gauge}**. Ajuste a regulagem para **${ribbingGaugeValue}** e com o fio do trabalho teça **${calculatedRibbingRows}** carreiras. Dobre a barra e feche com uma carreira na regulagem **${closingGaugeValue}**. Mude para a regulagem **${gauge}** e teça por **${armholeStartRow}** carreiras. **ZERE O CONTADOR** e modele a cava no passo a seguir.`
                    : `Selecione **${Math.round(bustSts / 2)}x${Math.round(bustSts / 2)} agulhas**, faça a preparação para a barra **${barTypeSelection || '1x1'}** e teça **${calculatedRibbingRows}** carreiras na regulagem **${ribbingGaugeValue}**. Após finalizar a barra, **ZERE O CONTADOR**, passe os pontos da frontura para a máquina e teça em ponto meia por **${armholeStartRow}** carreiras. Antes de modelar a cava, zere o contador de carreiras.`,
                technicalDetails: ["**Base de Cálculo (Apenas Visualização)**", `**Início:** ${bustSts} pts`, `**Altura da Barra/Cava:** ${armholeStartRow} carrs.`]
            });

            if (numEventsBodyB > 0) {
                const decRows = getDecreaseRows(numEventsBodyB, armholeRowsBack - 2);
                backSteps.push({
                    title: "2. Modelagem da Cava",
                    description: `**Zere o contador** e faça a cava utilizando arremates e diminuições internas de **${ptsPerDec} em ${ptsPerDec} pontos**.`,
                    shaping: {
                        instructions: [`Arremate **${initialBindoffSts} pts** + 2 carreiras 1x`, ...formatBodyRaglanDecreases(ptsToDecBackBodyPerSide, numEventsBodyB, armholeRowsBack - 2, ptsPerDec), `**Carrs. de Diminuição:** ${decRows.map(r => r.toString().padStart(3, '0')).join(', ')}`],
                        notes: `Instruções para o lado da cava. Ao final, você terá ${necklineBackSts} pts.`
                    },
                    technicalDetails: ["**Base de Cálculo (Apenas Visualização)**", `**Início:** ${bustSts} pts`, `**Alvo:** ${necklineBackSts} pts`, `**Redução:** ${bustSts - necklineBackSts} pts`, `**Altura da cava Costas:** ${armholeRowsBack} carrs.`]
                });
            }

            if (effectiveNecklineBackDepth > 0) {
                const necklineBackDepthRows = roundToEven(effectiveNecklineBackDepth * rowsPerCm);
                const centralBackPts = Math.max(2, Math.round((necklineBackSts * 0.6) / 2) * 2);
                const sideBackPts = (necklineBackSts - centralBackPts) / 2;
                const numBackSteps = Math.max(1, Math.floor((necklineBackDepthRows - 2) / 2) + 1);
                const backNecklineInstructions = [];
                
                backNecklineInstructions.push(`Suspenda **${centralBackPts} pts** centrais.`);
                if (numBackSteps > 0 && sideBackPts > 0) {
                    const basePts = Math.floor(sideBackPts / numBackSteps);
                    const extraPts = Math.round(sideBackPts % numBackSteps);
                    if (extraPts > 0) backNecklineInstructions.push(`Suspenda **${basePts + 1} pts.** + 2 carrs. ${extraPts} x`);
                    if (numBackSteps - extraPts > 0) backNecklineInstructions.push(`Suspenda **${basePts} pts.** + 2 carrs. ${numBackSteps - extraPts} x`);
                }
                
                backSteps.push({
                    title: "3. Decote das Costas (Agulhas em Suspenso)",
                    description: `Na carreira **${armholeRowsBack - necklineBackDepthRows}**, inicie a modelagem do decote das costas.`,
                    shaping: { instructions: backNecklineInstructions, notes: `A profundidade total do decote é de ${necklineBackDepthRows} carreiras.` },
                    technicalDetails: ["**Base de Cálculo (Apenas Visualização)**", `**Largura do Decote:** ${necklineBackSts} pts`, `**Carreiras do Decote:** ${necklineBackDepthRows} carrs.`]
                });
            }

        }

        recipeParts.push({ title: "COSTAS", steps: backSteps });

        const wristSts = roundToEven((isCavaRedonda ? sleeve.roundSleeveWristWidth : sleeve.wristWidth) * stsPerCm);
        const sleeveMaxSts = roundToEven((isCavaRedonda ? sleeve.roundSleeveMaxWidth : sleeve.sleeveMaxWidth) * stsPerCm);
        const sleeveFinalSts = roundToEven((isCavaRedonda ? sleeve.roundSleeveFinalBindoff : sleeve.sleeveFinalWidth) * stsPerCm);
        const sleeveIncRows = roundToEven((isCavaRedonda ? sleeve.roundSleeveHemToArmholeHeight : sleeve.sleeveHemToArmholeHeight) * rowsPerCm);
        const sleeveRowsF = roundToEven((isCavaRedonda ? sleeve.roundSleeveCapHeight : sleeve.sleeveArmholeHeightFront) * rowsPerCm);
        const sleeveRowsB = roundToEven((isCavaRedonda ? sleeve.roundSleeveCapHeight : sleeve.sleeveArmholeHeightBack) * rowsPerCm);
        
        const totalDecSleevePerSide = (sleeveMaxSts - (initialBindoffSts * 2) - sleeveFinalSts) / 2;
        const totalIncPerSide = (sleeveMaxSts - wristSts) / 2;

        const calcQuarterEllipseArc = (a: number, b: number) => {
            if (a <= 0 && b <= 0) return 0;
            if (a <= 0) return b;
            if (b <= 0) return a;
            return (Math.PI / 4) * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
        };

        let armholeContourPeri: number | undefined;
        let sleeveCapContourPeri: number | undefined;
        let perimeterDifference: number | undefined;
        let perimeterWarning: string | null = null;

        if (isCavaRedonda && !isSleeveless && (projectType === 'Blusa' || projectType === 'Casaco')) {
            const wFront = Math.max(0, ((body.roundBustWidth || 0) - (body.roundFrontCrossChest || 0)) / 2);
            const hFront = (body.roundArmholeHeight || 0) + (body.roundShoulderSlope || 0);
            const wBack = Math.max(0, ((body.roundBustWidth || 0) - (body.roundBackCrossChest || 0)) / 2);
            const hBack = (body.roundArmholeHeight || 0) + (body.roundShoulderSlope || 0);

            const frontArmholeArc = calcQuarterEllipseArc(wFront, hFront);
            const backArmholeArc = calcQuarterEllipseArc(wBack, hBack);
            const armholeTotalArc = parseFloat((frontArmholeArc + backArmholeArc).toFixed(1));

            const wCap = Math.max(0, ((sleeve.roundSleeveMaxWidth || 0) - (sleeve.roundSleeveFinalBindoff || 0)) / 2);
            const hCap = sleeve.roundSleeveCapHeight || 0;
            const wFinalBindoff = sleeve.roundSleeveFinalBindoff || 0;

            const capSideArc = calcQuarterEllipseArc(wCap, hCap);
            const sleeveCapTotalArc = parseFloat((2 * capSideArc + wFinalBindoff).toFixed(1));

            const diff = parseFloat(Math.abs(sleeveCapTotalArc - armholeTotalArc).toFixed(1));

            armholeContourPeri = armholeTotalArc;
            sleeveCapContourPeri = sleeveCapTotalArc;
            perimeterDifference = diff;

            if (diff > 0.8) {
                perimeterWarning = `Atenção: Aferição de Perímetro — O perímetro do contorno da cabeça da manga (${sleeveCapTotalArc} cm) e o perímetro do contorno das cavas (${armholeTotalArc} cm) apresentam uma diferença de ${diff} cm (superior ao limite de 0,8 cm). Recomenda-se ajustar as medidas para compatibilizar os contornos.`;
            }
        }

        if (!isSleeveless) {
            let sleeveIncInstructions: string[] = [];
            if (totalIncPerSide > 0) {
                const baseInterval = Math.floor(sleeveIncRows / totalIncPerSide);
                const remainder = sleeveIncRows % totalIncPerSide;
                if (remainder > 0) {
                    sleeveIncInstructions.push(`Aumentar **1 pt.** + ${baseInterval + 1} carreiras ${Math.round(remainder)}x`);
                }
                if (totalIncPerSide - remainder > 0) {
                    sleeveIncInstructions.push(`Aumentar **1 pt.** + ${baseInterval} carreiras ${Math.round(totalIncPerSide - remainder)}x`);
                }
            } else {
                sleeveIncInstructions.push(`Teça reto sem aumentos.`);
            }

            const sleeveSteps: RecipeStep[] = [{
                title: isFoldedRibbing ? "1. BARRA e CORPO (Manga)" : "1. Punho e Aumentos",
                description: isFoldedRibbing
                    ? `Selecione **${Math.round(wristSts / 2)}x${Math.round(wristSts / 2)} agulhas**, monte os pontos com o fio de outra col e teça **12 carreiras** em regulagem **${gauge}**. Ajuste a regulagem para **${ribbingGaugeValue}** e com o fio do trabalho teça **${calculatedRibbingRows}** carreiras. Dobre a barra e feche com uma carreira na regulagem **${closingGaugeValue}**. Mude para a regulagem **${gauge}** e teça por **${sleeveIncRows}** carreiras. Fazendo os aumentos como segue:`
                    : `Selecione **${Math.round(wristSts / 2)}x${Math.round(wristSts / 2)} agulhas**, faça a preparação para a barra **${barTypeSelection || '1x1'}** e teça **${calculatedRibbingRows}** carreiras na regulagem **${ribbingGaugeValue}**. Após finalizar a barra, **ZERE O CONTADOR**, passe os pontos da frontura para a máquina e teça em ponto meia na regulagem **${gauge || '6'}** por **${sleeveIncRows}** carreiras. Fazendo os aumentos como segue:`,
                shaping: {
                   instructions: sleeveIncInstructions
                },
                technicalDetails: ["**Base de Cálculo (Apenas Visualização)**", `**Início:** ${wristSts} pts`, `**Alvo:** ${sleeveMaxSts} pts`, `**Aumento:** ${sleeveMaxSts - wristSts} pts`, `**Carreiras Barra/Cava:** ${sleeveIncRows}`]
            }];

            if (isCavaRedonda) {
                const ptsToDecSleeveCap = (sleeveMaxSts - (initialBindoffSts * 2) - sleeveFinalSts) / 2;
                const sleeveCapCurveInstructions = getSleeveCapCurve(ptsToDecSleeveCap, sleeveRowsF, initialBindoffSts);
                const instructions = [
                    `Arremate **${initialBindoffSts} pts** no início das próximas 2 carreiras (1x de cada lado)`,
                    ...sleeveCapCurveInstructions,
                    `Arremate os **${sleeveFinalSts} pts** restantes.`
                ];

                let sleeveCapDesc = `**Zere o contador** e faça a modelagem da cabeça da manga (sleeve cap) para se ajustar perfeitamente à cava redonda do corpo.`;
                if (perimeterWarning) {
                    sleeveCapDesc += `\n\n⚠️ **${perimeterWarning}**`;
                }

                const technicalDetails = [
                    "**Base de Cálculo (Apenas Visualização)**", 
                    `**Início:** ${sleeveMaxSts} pts`, 
                    `**Alvo:** ${sleeveFinalSts} pts`, 
                    `**Redução:** ${sleeveMaxSts - sleeveFinalSts} pts`, 
                    `**Altura da Cabeça:** ${sleeveRowsF} carrs.`
                ];

                if (armholeContourPeri !== undefined && sleeveCapContourPeri !== undefined && perimeterDifference !== undefined) {
                    technicalDetails.push(
                        `**Perímetro Contorno Cavas:** ${armholeContourPeri} cm`,
                        `**Perímetro Contorno Cabeça Manga:** ${sleeveCapContourPeri} cm`,
                        `**Diferença Contornos:** ${perimeterDifference} cm ${perimeterDifference > 0.8 ? '(⚠️ Superior a 0,8 cm)' : '(✓ Compatível ≤ 0,8 cm)'}`
                    );
                }

                sleeveSteps.push({
                    title: "2. Modelagem da Cabeça da Manga (Cava Redonda)",
                    description: sleeveCapDesc,
                    shaping: {
                        instructions,
                        notes: perimeterWarning ? `⚠️ ${perimeterWarning}` : `Isso formará uma cabeça de manga arredondada clássica.`
                    },
                    technicalDetails
                });
            } else {
                const decRowsF_Sleeve = getDecreaseRows(numEventsBodyF, sleeveRowsF - 2);
                const decRowsB_Sleeve = getDecreaseRows(numEventsBodyB, sleeveRowsB - 2);
                const diffRows = armholeRowsBack - armholeRowsFront;
                const firstSusp = roundToEven(sleeveFinalSts / 3);
                const remStsForSusp = sleeveFinalSts - firstSusp;
                const numRemSuspSteps = Math.floor(diffRows / 2) + 1;
                const suspInstructions: string[] = [];
                if (diffRows > 0) {
                    suspInstructions.push(`Na carr. **${armholeRowsFront.toString().padStart(3, '0')}** que finaliza a cava da frente, suspenda a partir do lado da frente:`);
                    suspInstructions.push(`Suspenda **${firstSusp} pontos** + 2 carrs. 1 x`);
                    if (numRemSuspSteps > 1) {
                        const ptsPerNextSusp = Math.floor(remStsForSusp / (numRemSuspSteps - 1));
                        const remPtsAfterDist = remStsForSusp % (numRemSuspSteps - 1);
                        if (remPtsAfterDist > 0) suspInstructions.push(`Suspenda **${ptsPerNextSusp + 1} pts** + 2 carrs. ${remPtsAfterDist} x`);
                        if (numRemSuspSteps - 1 - remPtsAfterDist > 0) suspInstructions.push(`Suspenda **${ptsPerNextSusp} pts** + 2 carrs. ${numRemSuspSteps - 1 - remPtsAfterDist} x`);
                    }
                    suspInstructions.push(`Os pontos finais podem ser arrematados ou retirados em fio de outra cor da máquina.`);
                }

                sleeveSteps.push({
                    title: "2. Modelagem da Cava (Manga)",
                    description: `**Zere o contador** e faça a cava utilizando arremates e diminuições internas.`,
                    shaping: {
                        instructions: [
                            `Arremate **${initialBindoffSts} pts** + 2 carreiras 1x`, 
                            ``,
                            `**Lado Frente:**`, 
                            ...formatSleeveDecreases(totalDecSleevePerSide, numEventsBodyF, sleeveRowsF - 2), 
                            ``,
                            `**Carrs. de Diminuição FRENTE:**`, 
                            `${decRowsF_Sleeve.map(r => r.toString().padStart(3, '0')).join(', ')}`, 
                            ``, 
                            `**Lado Costas:**`, 
                            ...formatSleeveDecreases(totalDecSleevePerSide, numEventsBodyB, sleeveRowsB - 2), 
                            ``,
                            `**Carrs. de Diminuição COSTAS:**`, 
                            `${decRowsB_Sleeve.map(r => r.toString().padStart(3, '0')).join(', ')}`, 
                            ``, 
                            ...(suspInstructions.length > 0 ? [``, `**Final da Manga:**`, ...suspInstructions] : [])
                        ],
                        notes: `Instruções para o lado da cava. Ao final, você terá ${sleeveFinalSts} pts.`
                    },
                    technicalDetails: ["**Base de Cálculo (Apenas Visualização)**", `**Início:** ${sleeveMaxSts} pts`, `**Alvo:** ${sleeveFinalSts} pts`, `**Redução:** ${sleeveMaxSts - sleeveFinalSts} pts`]
                });
            }
            recipeParts.push({ title: "MANGA (X2)", steps: sleeveSteps });
        }

        // Cálculos de Perímetro (em cm)
        const necklineFrontWidthValue = isCavaRedonda 
            ? (body.roundBackNecklineWidth || 0) 
            : (body.necklineFrontWidth || 0);
        const necklineBackWidthValue = isCavaRedonda ? (body.roundBackNecklineWidth || 0) : (body.necklineBackWidth || 0);
        const sleeveFinalWidthValue = isCavaRedonda ? (sleeve.roundSleeveFinalBindoff || 0) : (sleeve.sleeveFinalWidth || 0);

        let neckFrontPeri = necklineFrontWidthValue;
        if (isDecoteV && effectiveNecklineFrontDepth > 0) {
            const halfWidth = necklineFrontWidthValue / 2;
            const depth = effectiveNecklineFrontDepth;
            neckFrontPeri = 2 * Math.sqrt(Math.pow(halfWidth, 2) + Math.pow(depth, 2));
        }
        
        const neckBackPeri = necklineBackWidthValue;
        const slvTopPeri = sleeveFinalWidthValue;
        const totalPeri = parseFloat((neckFrontPeri + neckBackPeri + ((isSleeveless || isCavaRedonda) ? 0 : 2 * slvTopPeri)).toFixed(1));

        // Adição da Parte de Acabamentos se configurada
        const finishingSteps: RecipeStep[] = [];
        const fStsPer10cm = finishing.type === 'folded_bias' 
            ? (parseFloat(finishing.swatchStitches) || numSwatchStitches)
            : (parseFloat(finishing.swatchStitches) || 0);
        const fRowsPer10cm = finishing.type === 'folded_bias'
            ? (parseFloat(finishing.swatchRows) || numSwatchRows)
            : (parseFloat(finishing.swatchRows) || 0);

        if (fStsPer10cm > 0 || fRowsPer10cm > 0) {
            const multiplier = barTypeSelection === '2x1' ? 1.5 : (barTypeSelection === '3x2' ? 2.5 : 1.0);
            const neckPts = Math.round((totalPeri * fStsPer10cm / 10) * multiplier);
            const neckRows = finishing.type === 'folded_bias'
                ? Math.round((parseFloat(finishing.width || '0') * (fRowsPer10cm / 10)) * 2)
                : Math.round(totalPeri * fRowsPer10cm / 10);
            
            let neckDesc = "";
            if (finishing.type === 'horizontal') {
                const halfNeedles = Math.round(neckPts / 2);
                const suggestedRows = recipeDetails.ribbingRows ? (Math.floor(parseInt(recipeDetails.ribbingRows) / 2) + 4) : 'XX';
                const rowsValue = finishing.neckRibRows || suggestedRows;
                const gaugeValue = recipeDetails.ribbingGauge || 'X';
                
                neckDesc = `Para a tira de acabamento do decote, selecione **${halfNeedles}x${halfNeedles} agulhas**, faça a preparação para a barra 2x1 e teça **${rowsValue}** carreiras na regulagem **${gaugeValue}**. Retire com fio de outra cor.\n\n**Sugestão:** Após a última carreira, transfira os pontos da frontura para a máquina, com o fio bem solto, teça 1 carreira na regulagem 10 e retire com fio de outra cor. Anote o total de pontos do acabamento.`;
            } else if (finishing.type === 'vertical') {
                neckDesc = `Teça uma tira vertical de **${neckRows} carreiras** para contornar todo o perímetro do decote (${totalPeri} cm).`;
            } else if (finishing.type === 'folded_bias') {
                neckDesc = `Para o acabamento em Ponto Meia Viés Dobrado, monte **${neckPts} agulhas** e teça **${neckRows} carreiras** (dobro da largura de ${finishing.width} cm) para cobrir o perímetro de ${totalPeri} cm.`;
            }
            
            finishingSteps.push({
                title: "Acabamento do Decote (Gola)",
                description: neckDesc,
                technicalDetails: [`**Perímetro Total:** ${totalPeri} cm`, `**Conversão:** ${finishing.type === 'horizontal' ? neckPts + ' agulhas' : neckRows + ' carrs.'}`]
            });

            if (isOpenPiece) {
                const bodyTotalHeight = isCavaRedonda
                    ? ((body.roundHemToArmholeHeight || 0) + (body.roundArmholeHeight || 0) + (body.roundShoulderSlope || 0))
                    : (body.hemToArmholeHeight + body.armholeHeightFront);
                const bandPts = Math.round((bodyTotalHeight * fStsPer10cm / 10) * multiplier);
                const bandRows = finishing.type === 'folded_bias'
                    ? Math.round((parseFloat(finishing.width || '0') * (fRowsPer10cm / 10)) * 2)
                    : Math.round(bodyTotalHeight * fRowsPer10cm / 10);
                
                let bandDesc = "";
                if (finishing.type === 'horizontal') {
                    bandDesc = `Monte **${bandPts} agulhas** para cada uma das tiras frontais para cobrir a altura de ${bodyTotalHeight.toFixed(1)} cm.`;
                } else if (finishing.type === 'folded_bias') {
                    bandDesc = `Para as tiras frontais dobradas, monte **${bandPts} agulhas** e teça **${bandRows} carreiras** (dobro da largura de ${finishing.width} cm) para cada uma das tiras frontais para cobrir a altura de ${bodyTotalHeight.toFixed(1)} cm.`;
                } else {
                    bandDesc = `Teça **${bandRows} carreiras** para cada uma das tiras frontais para cobrir a altura de ${bodyTotalHeight.toFixed(1)} cm.`;
                }

                finishingSteps.push({
                    title: "Tiras Frontais (Abotoamento)",
                    description: bandDesc,
                    technicalDetails: [`**Altura Total da Peça:** ${bodyTotalHeight.toFixed(1)} cm`, `**Conversão:** ${finishing.type === 'horizontal' || finishing.type === 'folded_bias' ? bandPts + ' agulhas' : bandRows + ' carrs.'}`]
                });
            }
        }

        if (finishingSteps.length > 0) {
            recipeParts.push({ title: "ACABAMENTOS / GOLAS", steps: finishingSteps });
        }

        const bodyFrontDecRows = numEventsBodyF > 0 ? getDecreaseRows(numEventsBodyF, armholeRowsFront - 2) : [];
        const bodyBackDecRows = numEventsBodyB > 0 ? getDecreaseRows(numEventsBodyB, armholeRowsBack - 2) : [];
        const sleeveFrontDecRows = !isSleeveless && numEventsBodyF > 0 ? getDecreaseRows(numEventsBodyF, sleeveRowsF - 2) : [];
        const sleeveBackDecRows = !isSleeveless && numEventsBodyB > 0 ? getDecreaseRows(numEventsBodyB, sleeveRowsB - 2) : [];
        const sleeveIncreaseRowsList = !isSleeveless && totalIncPerSide > 0 ? getDecreaseRows(totalIncPerSide, sleeveIncRows) : [];

        const bodyFrontShaping = getBodyShaping(ptsToDecFrontBodyPerSide, numEventsBodyF, armholeRowsFront - 2, ptsPerDec);
        const bodyBackShaping = getBodyShaping(ptsToDecBackBodyPerSide, numEventsBodyB, armholeRowsBack - 2, ptsPerDec);
        const sleeveFrontShaping = !isSleeveless && !isCavaRedonda ? getSleeveShaping(totalDecSleevePerSide, numEventsBodyF, sleeveRowsF - 2) : [];
        const sleeveBackShaping = !isSleeveless && !isCavaRedonda ? getSleeveShaping(totalDecSleevePerSide, numEventsBodyB, sleeveRowsB - 2) : [];
        const sleeveIncShaping = !isSleeveless ? getSleeveIncShaping(totalIncPerSide, sleeveIncRows) : [];
        const sleeveTopShaping = !isSleeveless && !isCavaRedonda ? getSleeveTopShaping(sleeveFinalSts, armholeRowsBack - armholeRowsFront) : [];

        let necklineFrontShaping: { pts: number; gap: number; times: number }[] = [];
        if (effectiveNecklineFrontDepth > 0) {
            const necklineDepthRows = roundToEven(effectiveNecklineFrontDepth * rowsPerCm);
            if (!isDecoteV) {
                const centralPts = Math.max(2, Math.round(((necklineFrontSts / 3) - 6) / 2) * 2);
                const sidePtsTotal = (necklineFrontSts - centralPts) / 2;
                
                let halfTranspasse = isOpenPiece ? (transpasseSts / 2) : 0;
                let currentSideCentral = isOpenPiece ? (centralPts / 2) : centralPts;
                let currentSidePtsTotal = sidePtsTotal;

                const subFromCentral = Math.min(halfTranspasse, currentSideCentral);
                currentSideCentral -= subFromCentral;
                halfTranspasse -= subFromCentral;

                if (halfTranspasse > 0) {
                    const subFromSide = Math.min(halfTranspasse, currentSidePtsTotal);
                    currentSidePtsTotal -= subFromSide;
                }
                necklineFrontShaping = getNecklineShaping(currentSideCentral, currentSidePtsTotal, necklineDepthRows);
            } else {
                const ptsToDecV = isOpenPiece ? targetNecklineFrontSts : (targetNecklineFrontSts / 2);
                const numPointsPerEvent = parseInt(recipeDetails.vNeckDecreaseType) || 1;
                necklineFrontShaping = getNecklineVShaping(ptsToDecV, necklineDepthRows, numPointsPerEvent);
            }
        }

        let necklineBackShaping: { pts: number; gap: number; times: number }[] = [];
        if (effectiveNecklineBackDepth > 0) {
            const necklineBackDepthRows = roundToEven(effectiveNecklineBackDepth * rowsPerCm);
            const centralBackPts = Math.max(2, Math.round((necklineBackSts * 0.6) / 2) * 2);
            const sideBackPts = (necklineBackSts - centralBackPts) / 2;
            necklineBackShaping = getNecklineShaping(centralBackPts, sideBackPts, necklineBackDepthRows);
        }

        let barSwatchText = '';
        if (['Blusa', 'Casaco', 'Colete', 'Colete Aberto', 'Regata', 'Regata Aberta'].includes(projectType)) {
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
            if (barSwatchGauge) {
                parts.push(`Regulagem da Barra: ${barSwatchGauge}`);
            }
            if (parts.length > 0) {
                barSwatchText = parts.join(', ');
            }
        }

        let buttonBandSwatchText = '';
        if ((projectType === 'Casaco' || projectType === 'Colete Aberto' || projectType === 'Regata Aberta') && buttonBandTypeSelection !== 'Igual a Barra') {
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
        if ((projectType === 'Colete' || projectType === 'Colete Aberto' || projectType === 'Regata' || projectType === 'Regata Aberta') && necklineArmholeFinishing === 'Ponto Meia Dobrado') {
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

        const compactInstructions = (instructions: string[]): string[] => {
            const compacted: string[] = [];
            const regex = /^(.*?)\s+(\d+)\s*x\s*$/i;
            for (let i = 0; i < instructions.length; i++) {
                const current = instructions[i];
                if (compacted.length > 0) {
                    const last = compacted[compacted.length - 1];
                    const matchCurrent = current.trim().match(regex);
                    const matchLast = last.trim().match(regex);
                    
                    if (matchCurrent && matchLast && matchCurrent[1].trim() === matchLast[1].trim()) {
                        const countLast = parseInt(matchLast[2]);
                        const countCurrent = parseInt(matchCurrent[2]);
                        compacted[compacted.length - 1] = `${matchLast[1].trim()} ${countLast + countCurrent}x`;
                    } else if (current.trim() === last.trim()) {
                        compacted[compacted.length - 1] = `${current.trim()} 2x`;
                    } else {
                        compacted.push(current);
                    }
                } else {
                    compacted.push(current);
                }
            }
            return compacted;
        };

        const compactedRecipeParts = recipeParts.map(part => ({
            ...part,
            steps: part.steps.map(step => {
                if (step.shaping && step.shaping.instructions) {
                    return {
                        ...step,
                        shaping: {
                            ...step.shaping,
                            instructions: compactInstructions(step.shaping.instructions)
                        }
                    };
                }
                return step;
            })
        }));

        allResults[size] = { 
            context: { 
                pieceName: formData.pieceName, 
                swatch: `${targetStitches} pts = ${swatchStitches} cm, ${targetRows} carrs = ${swatchRows} cm (${(stsPerCm * 10).toFixed(1)} pts/10 cm, ${(rowsPerCm * 10).toFixed(1)} carrs/10 cm)`, 
                yarn: formData.yarn, 
                gauge: formData.gauge,
                barSwatch: barSwatchText || undefined,
                buttonBandSwatch: buttonBandSwatchText || undefined,
                finishingSwatch: finishingSwatchText || undefined
            }, 
            recipeParts: compactedRecipeParts,
            summary: {
                bustSts, armholeStartRow, armholeRowsFront, armholeRowsBack,
                isSleeveless: formData.isSleeveless,
                necklineFrontRows: roundToEven(effectiveNecklineFrontDepth * rowsPerCm),
                necklineBackRows: roundToEven(effectiveNecklineBackDepth * rowsPerCm),
                initialArmholeBindoffSts: initialBindoffSts, necklineFrontSts, necklineBackSts,
                wristSts, sleeveMaxSts, sleeveFinalSts,
                sleeveIncreaseRows: sleeveIncRows,
                sleeveArmholeRowsFront: sleeveRowsF,
                sleeveArmholeRowsBack: sleeveRowsB,
                totalBodyRows: armholeStartRow + armholeRowsBack,
                necklineFrontPeri: neckFrontPeri,
                necklineBackPeri: neckBackPeri,
                sleeveTopPeri: slvTopPeri,
                totalNecklinePeri: totalPeri,
                armholeContourPeri,
                sleeveCapContourPeri,
                perimeterDifference,
                transpasseSts: transpasseSts,
                armholeType,
                shoulderSts,
                frontCrossChestSts,
                backCrossChestSts,
                ptsToDecFrontBodyPerSide,
                ptsToDecBackBodyPerSide,
                shoulderSlopeRows,
                frontBustSts: isOpenPiece ? (bustSts / 2 - transpasseSts / 2) : bustSts,
                necklineType: formData.necklineType,
                necklineSelection,
                isOpenPiece: formData.isOpenPiece,
                swatchStitches: stsPerCm * 10,
                swatchRows: rowsPerCm * 10,
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
                sleeveTopShaping
            }
        };
    }
    setResult(allResults);
    setError(null);
  };

  const handleSaveData = () => {
    const exportData = { 
      formData, 
      gradingValues, 
      sizeCategory, 
      mode, 
      selectedSize, 
      projectType,
      armholeType,
      necklineSelection,
      machineGauge,
      barTypeSelection,
      buttonBandTypeSelection,
      necklineArmholeFinishing,
      barSwatchValue,
      barSwatchOrlaLength,
      barSwatchGauge,
      buttonBandSwatchStitches,
      buttonBandSwatchRows,
      buttonBandSwatchGauge,
      finishingSwatchStitches,
      finishingSwatchRows,
      finishingSwatchGauge,
      version: "1.4" 
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formData.pieceName || 'esquema-facil-medidas'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateTXT = (size: string) => {
    if (!result || !result[size]) return;
    const res = result[size];
    
    let text = `RECEITA RAGLAN - ${formData.pieceName || 'SEM NOME'}\n`;
    text += `Tamanho: ${size}\n`;
    text += `--------------------------------------------------\n\n`;
    
    text += `CONFIGURAÇÕES DA AMOSTRA\n`;
    text += `Amostra: ${res.context.swatch}\n`;
    if (res.context.barSwatch) {
      text += `Amostra da Barra: ${res.context.barSwatch}\n`;
    }
    if (res.context.buttonBandSwatch) {
      text += `Amostra da Tira de Abotoamento: ${res.context.buttonBandSwatch}\n`;
    }
    if (res.context.finishingSwatch) {
      text += `Amostra do Acabamento: ${res.context.finishingSwatch}\n`;
    }
    text += `Regulagem Principal: ${res.context.gauge || 'N/A'}\n`;
    text += `Fio Utilizado: ${res.context.yarn || 'N/A'}\n`;
    text += `Máquina: ${formData.machineBrand || ''} ${formData.machineModel || 'N/A'}\n`;
    text += `--------------------------------------------------\n\n`;

    res.recipeParts.forEach(part => {
      text += `${part.title.toUpperCase()}\n`;
      text += `==================================================\n`;
      part.steps.forEach(step => {
        text += `\n[ ${step.title} ]\n`;
        text += `${step.description.replace(/\*\*/g, '')}\n`;
        if (step.shaping) {
          text += `\nInstruções:\n`;
          step.shaping.instructions.forEach(inst => {
            text += `- ${inst.replace(/\*\*/g, '')}\n`;
          });
          if (step.shaping.notes) {
            text += `Nota: ${step.shaping.notes}\n`;
          }
        }
        if (step.technicalDetails && step.technicalDetails.length > 0) {
          text += `\nDetalhes Técnicos:\n`;
          step.technicalDetails.forEach(detail => {
            text += `- ${detail.replace(/\*\*/g, '')}\n`;
          });
        }
      });
      text += `\n\n`;
    });

    if (res.summary) {
      text += `RESUMO DE CARREIRAS, PONTOS E PERÍMETROS\n`;
      text += `==================================================\n`;
      getVisibleSummaryEntries(res.summary).forEach(({ label, value }) => {
        text += `${label}: ${value}\n`;
      });
    }

    text += `\n\n--------------------------------------------------\n`;
    text += `Gerado por Tricotando com o Zé — Tecnologia Esquema Fácil\n`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formData.pieceName || 'receita'}-${size}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.formData) {
            setFormData(safeMerge(initialFormData, json.formData));
            if (json.gradingValues) setGradingValues(json.gradingValues);
            if (json.sizeCategory) setSizeCategory(json.sizeCategory);
            if (json.mode) setMode(json.mode);
            if (json.selectedSize) setSelectedSize(json.selectedSize);
            if (json.projectType) setProjectType(json.projectType);
            if (json.armholeType) setArmholeType(json.armholeType);
            if (json.necklineSelection) setNecklineSelection(json.necklineSelection);
            if (json.machineGauge) setMachineGauge(json.machineGauge);
            if (json.barTypeSelection) setBarTypeSelection(json.barTypeSelection);
            if (json.buttonBandTypeSelection) setButtonBandTypeSelection(json.buttonBandTypeSelection);
            if (json.necklineArmholeFinishing) setNecklineArmholeFinishing(json.necklineArmholeFinishing);
            if (json.barSwatchValue !== undefined) setBarSwatchValue(json.barSwatchValue);
            if (json.barSwatchOrlaLength !== undefined) setBarSwatchOrlaLength(json.barSwatchOrlaLength);
            if (json.barSwatchGauge !== undefined) setBarSwatchGauge(json.barSwatchGauge);
            if (json.buttonBandSwatchStitches !== undefined) setButtonBandSwatchStitches(json.buttonBandSwatchStitches);
            if (json.buttonBandSwatchRows !== undefined) setButtonBandSwatchRows(json.buttonBandSwatchRows);
            if (json.buttonBandSwatchGauge !== undefined) setButtonBandSwatchGauge(json.buttonBandSwatchGauge);
            if (json.finishingSwatchStitches !== undefined) setFinishingSwatchStitches(json.finishingSwatchStitches);
            if (json.finishingSwatchRows !== undefined) setFinishingSwatchRows(json.finishingSwatchRows);
            if (json.finishingSwatchGauge !== undefined) setFinishingSwatchGauge(json.finishingSwatchGauge);
        } else {
            setFormData(safeMerge(initialFormData, json));
        }
        setError(null);
      } catch (err) {
        setError('O arquivo selecionado não está no formato correto de receita.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadCloudProject = (saved: SavedRecipe) => {
    if (saved.formData) {
        setFormData(safeMerge(initialFormData, saved.formData));
    }
    if (saved.gradingValues) setGradingValues(saved.gradingValues);
    if (saved.sizeCategory) setSizeCategory(saved.sizeCategory as any);
    if (saved.mode) setMode(saved.mode as any);
    if (saved.selectedSize) setSelectedSize(saved.selectedSize as any);
    if (saved.projectType) setProjectType(saved.projectType);
    if (saved.armholeType) setArmholeType(saved.armholeType);
    if (saved.necklineSelection) setNecklineSelection(saved.necklineSelection);
    if (saved.machineGauge) setMachineGauge(saved.machineGauge);
    if (saved.barTypeSelection) setBarTypeSelection(saved.barTypeSelection);
    if (saved.buttonBandTypeSelection) setButtonBandTypeSelection(saved.buttonBandTypeSelection);
    if (saved.necklineArmholeFinishing) setNecklineArmholeFinishing(saved.necklineArmholeFinishing);
    if (saved.barSwatchValue !== undefined) setBarSwatchValue(saved.barSwatchValue);
    if (saved.barSwatchOrlaLength !== undefined) setBarSwatchOrlaLength(saved.barSwatchOrlaLength);
    if (saved.barSwatchGauge !== undefined) setBarSwatchGauge(saved.barSwatchGauge);
    if (saved.buttonBandSwatchStitches !== undefined) setButtonBandSwatchStitches(saved.buttonBandSwatchStitches);
    if (saved.buttonBandSwatchRows !== undefined) setButtonBandSwatchRows(saved.buttonBandSwatchRows);
    if (saved.buttonBandSwatchGauge !== undefined) setButtonBandSwatchGauge(saved.buttonBandSwatchGauge);
    if (saved.finishingSwatchStitches !== undefined) setFinishingSwatchStitches(saved.finishingSwatchStitches);
    if (saved.finishingSwatchRows !== undefined) setFinishingSwatchRows(saved.finishingSwatchRows);
    if (saved.finishingSwatchGauge !== undefined) setFinishingSwatchGauge(saved.finishingSwatchGauge);
    if (saved.baseGradationSize) setBaseGradationSize(saved.baseGradationSize as any);
    setError(null);
  };

  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen selection:bg-amber-100 selection:text-vintage-moss">
      <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 no-print">
        <header className="text-center mb-10 max-w-4xl mx-auto">
          {authorizedUser && (
            <div className="flex items-center justify-between bg-white border border-slate-200/60 shadow-sm rounded-2xl px-5 py-2.5 mb-6 max-w-xl mx-auto text-xs text-slate-600">
              <div className="flex items-center gap-2.5 text-left">
                {authorizedUser.photoURL ? (
                  <img src={authorizedUser.photoURL} alt="Foto" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-slate-200 shadow-sm" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold font-display">
                    {authorizedUser.displayName ? authorizedUser.displayName[0].toUpperCase() : (authorizedUser.email ? authorizedUser.email[0].toUpperCase() : 'U')}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>{authorizedUser.displayName || authorizedUser.email}</span>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 text-[10px] font-bold">
                      {authorizedUserData?.membershipType === 'youtube_member' ? '🔴 YouTube Membro' : '💳 Assinante MP'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">Acesso Premium Ativo</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-amber-700 hover:text-red-700 font-bold hover:underline transition duration-150 flex items-center gap-1"
              >
                <span>Sair</span>
                <span>🚪</span>
              </button>
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl font-black text-emerald-900 tracking-tight font-display mb-3">
            Esquema Fácil Tricotando com o Zé
          </h1>
          <p className="text-emerald-800/80 font-medium text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Seu atalho inteligente para criar receitas perfeitas instantaneamente!
          </p>
        </header>
        <main className="w-full max-w-[1600px] mx-auto flex flex-col gap-8 relative items-center">
            {isGeneratingPDF && (
              <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-emerald-950/80 backdrop-blur-md no-print">
                <div className="text-center bg-white/10 p-8 rounded-2xl border border-white/20 shadow-2xl">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
                  <p className="text-white font-black text-xl font-display">Gerando seu PDF...</p>
                  <p className="text-emerald-200 text-sm mt-2 font-semibold">Isso pode levar alguns segundos.</p>
                </div>
              </div>
            )}
            <div className="w-full space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(31,63,36,0.05)] transition-all hover:shadow-[0_4px_25px_-2px_rgba(31,63,36,0.08)]">
              <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/40">
                <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-3 mb-4 font-display">
                  <PieceIcon className="text-emerald-700 w-6 h-6" />
                  O que você vai fazer?
                </h2>
                <div className="space-y-4">
                  <div>
                    <select
                      id="projectType"
                      name="projectType"
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 font-medium cursor-pointer"
                    >
                      <option value="Blusa">Blusa</option>
                      <option value="Casaco">Casaco</option>
                      <option value="Colete">Colete</option>
                      <option value="Colete Aberto">Colete Aberto</option>
                      <option value="Regata">Regata</option>
                      <option value="Regata Aberta">Regata Aberta</option>
                      <option value="Meia (Em Breve)" disabled>Meia (Em Breve)</option>
                      <option value="Cachecóis e Pashminas (Em Breve)" disabled>Cachecóis e Pashminas (Em Breve)</option>
                      <option value="Mantas (Em Breve)" disabled>Mantas (Em Breve)</option>
                      <option value="Formas Geométricas (Em Breve)" disabled>Formas Geométricas (Em Breve)</option>
                      <option value="Calça (Em Breve)" disabled>Calça (Em Breve)</option>
                      <option value="Saia Reta (Em Breve)" disabled>Saia Reta (Em Breve)</option>
                      <option value="Bermuda (Em Breve)" disabled>Bermuda (Em Breve)</option>
                      <option value="Shorts (Em Breve)" disabled>Shorts (Em Breve)</option>
                    </select>
                  </div>

                  {(projectType === 'Blusa' || projectType === 'Casaco') && (
                    <div className="pt-2">
                      <label htmlFor="armholeType" className="block mb-2 text-base font-bold text-slate-700">
                        Tipo de Cava
                      </label>
                      <select
                        id="armholeType"
                        name="armholeType"
                        value={armholeType}
                        onChange={(e) => setArmholeType(e.target.value)}
                        className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 font-medium cursor-pointer"
                      >
                        <option value="Cava Redonda">Cava Redonda</option>
                        <option value="Cava Raglan">Cava Raglan</option>
                      </select>
                    </div>
                  )}

                  {(['Blusa', 'Casaco', 'Colete', 'Colete Aberto', 'Regata', 'Regata Aberta'].includes(projectType)) && (
                    <>
                      <div className="pt-2">
                        <label htmlFor="necklineSelection" className="block mb-2 text-base font-bold text-slate-700">
                          Tipo de Decote
                        </label>
                        <select
                          id="necklineSelection"
                          name="necklineSelection"
                          value={necklineSelection}
                          onChange={(e) => setNecklineSelection(e.target.value)}
                          className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 font-medium cursor-pointer"
                        >
                          <option value="Decote Redondo">Decote Redondo</option>
                          <option value="Decote em V">Decote em V</option>
                          <option value="Decote Canoa">Decote Canoa</option>
                          <option value="Decote em U">Decote em U</option>
                          <option value="Decote Quadrado">Decote Quadrado</option>
                        </select>
                      </div>

                      <div className="pt-2">
                        <label htmlFor="barTypeSelection" className="block mb-2 text-base font-bold text-slate-700">
                          Tipo de Barra
                        </label>
                        <select
                          id="barTypeSelection"
                          name="barTypeSelection"
                          value={barTypeSelection}
                          onChange={(e) => setBarTypeSelection(e.target.value)}
                          className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 font-medium cursor-pointer"
                        >
                          <option value="1x1">1x1</option>
                          <option value="2x2">2x2</option>
                          <option value="3x3">3x3</option>
                          <option value="2x1">2x1</option>
                          <option value="3x2">3x2</option>
                          <option value="Barra dobrada em Ponto Meia">Barra dobrada em Ponto Meia</option>
                        </select>
                      </div>

                      {(projectType === 'Casaco' || projectType === 'Colete Aberto' || projectType === 'Regata Aberta') && (
                        <div className="pt-2">
                          <label htmlFor="buttonBandTypeSelection" className="block mb-2 text-base font-bold text-slate-700">
                            Tipo de Tira de Abotoamento
                          </label>
                          <select
                            id="buttonBandTypeSelection"
                            name="buttonBandTypeSelection"
                            value={buttonBandTypeSelection}
                            onChange={(e) => setButtonBandTypeSelection(e.target.value)}
                            className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 font-medium cursor-pointer"
                          >
                            <option value="Igual a Barra">Igual a Barra</option>
                            <option value="Em Malha Cheia">Em Malha Cheia</option>
                            <option value="Ponto Meia Dobrado">Ponto Meia Dobrado</option>
                          </select>
                        </div>
                      )}

                      {(projectType === 'Colete' || projectType === 'Colete Aberto' || projectType === 'Regata' || projectType === 'Regata Aberta') && (
                        <div className="pt-2">
                          <label htmlFor="necklineArmholeFinishing" className="block mb-2 text-base font-bold text-slate-700">
                            Acabamento do Decote e das Cavas
                          </label>
                          <select
                            id="necklineArmholeFinishing"
                            name="necklineArmholeFinishing"
                            value={necklineArmholeFinishing}
                            onChange={(e) => setNecklineArmholeFinishing(e.target.value)}
                            className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 font-medium cursor-pointer"
                          >
                            <option value="Igual à Barra">Igual à Barra</option>
                            <option value="Ponto Meia Dobrado">Ponto Meia Dobrado</option>
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/40">
                <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-3 mb-4 font-display"><SwatchIcon className="text-emerald-700" />Amostra</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="machineGauge" className="block mb-2 text-base font-bold text-slate-700">
                      Tipo / Medida da Máquina
                    </label>
                    <select
                      id="machineGauge"
                      name="machineGauge"
                      value={machineGauge}
                      onChange={(e) => setMachineGauge(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 font-medium cursor-pointer"
                    >
                      <option value="3,6mm">Máquina de Fios Muito Finos/Finos (3,6mm)</option>
                      <option value="4,5mm">Máquina de Fios Finos/Médios (4,5mm)</option>
                      <option value="6,5mm">Máquina de Fios Médios/Grossos (6,5mm)</option>
                      <option value="9,0mm">Máquina de Fios Grossos/Muito Grossos (9,0mm)</option>
                    </select>
                  </div>
                  <InputGroup label="Marca da Máquina" name="machineBrand" value={formData.machineBrand} onChange={handleInputChange} placeholder="Ex: Elgin" labelClassName="block mb-2 text-base font-bold text-slate-700" />
                  <InputGroup label="Modelo da Máquina" name="machineModel" value={formData.machineModel} onChange={handleInputChange} placeholder="Ex: 840" />
                  <InputGroup label={`Medida de ${targetStitches} pontos`} name="swatchStitches" value={formData.swatchStitches} onChange={handleInputChange} placeholder="Ex: 12.9" />
                  <InputGroup label={`Medida de ${targetRows} Carreiras (em Cm)`} name="swatchRows" value={formData.swatchRows} onChange={handleInputChange} placeholder="Ex: 13.0" />
                  <InputGroup label="Regulagem da Amostra" name="gauge" value={formData.gauge} onChange={handleInputChange} placeholder="7" />
                  <InputGroup label="Tipo de Ponto" name="stitchType" value={formData.stitchType} onChange={handleInputChange} placeholder="Jersey" />
                  <div className="sm:col-span-2">
                      <InputGroup label="Fio Utilizado" name="yarn" value={formData.yarn} onChange={handleInputChange} placeholder="Lã Industrial 2/28" labelClassName="block mb-2 text-base font-bold text-slate-700" />
                  </div>
                </div>

                {['Blusa', 'Casaco', 'Colete', 'Colete Aberto', 'Regata', 'Regata Aberta'].includes(projectType) && (
                  <div className="mt-5 pt-5 border-t border-slate-200">
                    <h3 className="text-sm font-extrabold text-emerald-800 uppercase tracking-widest mb-1 font-display">Amostra da Barra</h3>
                    <div className="text-xs text-slate-600 mb-4 bg-slate-100/60 border border-slate-200/40 rounded-lg p-2.5">
                      <strong>Amostra padrão para cálculo:</strong> 5 carreiras da orla + 30 carreiras na regulagem da barra.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {['1x1', '2x2', '3x3'].includes(barTypeSelection) && (
                        <InputGroup 
                          label="Pontos em 10 cm" 
                          name="barSwatchStitches" 
                          value={barSwatchValue} 
                          onChange={(e) => setBarSwatchValue(e.target.value)} 
                          placeholder="Ex: 28" 
                        />
                      )}
                      {['2x1', '3x2'].includes(barTypeSelection) && (
                        <InputGroup 
                          label="Canaletas em 10 cm" 
                          name="barSwatchCanaletas" 
                          value={barSwatchValue} 
                          onChange={(e) => setBarSwatchValue(e.target.value)} 
                          placeholder="Ex: 14" 
                        />
                      )}
                      {barTypeSelection === 'Barra dobrada em Ponto Meia' && (
                        <InputGroup 
                          label="Medida de 40 carreiras em Ponto Meia" 
                          name="barSwatchFolded" 
                          value={barSwatchValue} 
                          onChange={(e) => setBarSwatchValue(e.target.value)} 
                          placeholder="Ex: 11.5" 
                        />
                      )}
                      <InputGroup 
                        label="Carreiras da Amostra em Cm." 
                        name="barSwatchOrlaLength" 
                        value={barSwatchOrlaLength} 
                        onChange={(e) => setBarSwatchOrlaLength(e.target.value)} 
                        placeholder="Ex: 8.5" 
                      />
                      <InputGroup 
                        label="Regulagem da Barra" 
                        name="barSwatchGauge" 
                        value={barSwatchGauge} 
                        onChange={(e) => setBarSwatchGauge(e.target.value)} 
                        placeholder="Ex: 4" 
                      />
                    </div>
                  </div>
                )}

                {(projectType === 'Casaco' || projectType === 'Colete Aberto' || projectType === 'Regata Aberta') && buttonBandTypeSelection !== 'Igual a Barra' && (
                  <div className="mt-5 pt-5 border-t border-slate-200">
                    <h3 className="text-sm font-extrabold text-emerald-800 uppercase tracking-widest mb-1 font-display">Amostra da Tira de Abotoamento</h3>
                    <div className="text-xs text-slate-600 mb-4 bg-slate-100/60 border border-slate-200/40 rounded-lg p-2.5">
                      <strong>Amostra padrão para cálculo:</strong><br />
                      {buttonBandTypeSelection === 'Em Malha Cheia' ? (
                        <span>Amostra Padrão para malha cheia: 40 pontos e 40 carreiras</span>
                      ) : (
                        <span>Amostra padrão para Ponto Meia: 40 pontos e 40 carreiras</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputGroup 
                        label="Medida de 40 pontos" 
                        name="buttonBandSwatchStitches" 
                        value={buttonBandSwatchStitches} 
                        onChange={(e) => setButtonBandSwatchStitches(e.target.value)} 
                        placeholder="Ex: 12.9" 
                      />
                      <InputGroup 
                        label="Medida de 40 carreiras" 
                        name="buttonBandSwatchRows" 
                        value={buttonBandSwatchRows} 
                        onChange={(e) => setButtonBandSwatchRows(e.target.value)} 
                        placeholder="Ex: 13.0" 
                      />
                      <div className="sm:col-span-2">
                        <InputGroup 
                          label={buttonBandTypeSelection === 'Em Malha Cheia' ? 'Regulagem da Amostra em Malha Cheia' : 'Regulagem da Amostra em Ponto Meia'} 
                          name="buttonBandSwatchGauge" 
                          value={buttonBandSwatchGauge} 
                          onChange={(e) => setButtonBandSwatchGauge(e.target.value)} 
                          placeholder="Ex: 5 ou 4/4" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(projectType === 'Colete' || projectType === 'Colete Aberto' || projectType === 'Regata' || projectType === 'Regata Aberta') && necklineArmholeFinishing === 'Ponto Meia Dobrado' && (
                  <div className="mt-5 pt-5 border-t border-slate-200">
                    <h3 className="text-sm font-extrabold text-emerald-800 uppercase tracking-widest mb-3 font-display">Amostra do Acabamento</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputGroup 
                        label="Medida de 40 pontos" 
                        name="finishingSwatchStitches" 
                        value={finishingSwatchStitches} 
                        onChange={(e) => setFinishingSwatchStitches(e.target.value)} 
                        placeholder="Ex: 12.9" 
                      />
                      <InputGroup 
                        label="Medida de 40 carreiras" 
                        name="finishingSwatchRows" 
                        value={finishingSwatchRows} 
                        onChange={(e) => setFinishingSwatchRows(e.target.value)} 
                        placeholder="Ex: 13.0" 
                      />
                      <div className="sm:col-span-2">
                        <InputGroup 
                          label="Regulagem da Amostra em Ponto Meia" 
                          name="finishingSwatchGauge" 
                          value={finishingSwatchGauge} 
                          onChange={(e) => setFinishingSwatchGauge(e.target.value)} 
                          placeholder="Ex: 5" 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <RecipeDetailsCard 
                details={formData.recipeDetails} 
                onChange={handleRecipeDetailsChange} 
                isOpenPiece={formData.isOpenPiece} 
                isSleeveless={formData.isSleeveless} 
                buttonBandWidth={formData.buttonBandWidth} 
                isRaglan={armholeType === 'Cava Raglan'}
                isVNeck={necklineSelection === 'Decote em V' || necklineSelection === 'Decote V'}
                projectType={projectType}
                onStructuralChange={handleInputChange} 
              />

              <div className="flex justify-center gap-2 pb-4 border-b border-slate-100 flex-wrap">
                  {['child', 'teen', 'adult'].map(cat => (
                      <button key={cat} onClick={() => setSizeCategory(cat as any)} className={`px-5 py-2 text-xs font-black uppercase rounded-full transition-all tracking-wider ${sizeCategory === cat ? 'bg-emerald-900 text-white shadow-md scale-105' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                          {cat === 'child' ? 'Infantil' : cat === 'teen' ? 'Infanto-Juvenil' : 'Adulto'}
                      </button>
                  ))}
              </div>
              <div className="flex justify-center gap-3 -mt-2">
                <button 
                  onClick={() => setShowCloudModal(true)} 
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-black text-white bg-emerald-800 rounded-full hover:bg-emerald-900 transition-all shadow-sm uppercase tracking-wider"
                >
                  <span>☁️</span>
                  Projetos na Nuvem
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-all shadow-sm uppercase tracking-wider"
                >
                  <UploadIcon className="w-3.5 h-3.5 text-emerald-700" />
                  Carregar TXT
                </button>
              </div>
              <InputGroup label="Nome da Peça" name="pieceName" value={formData.pieceName} onChange={handleInputChange} disabled={true} />
              <div className="flex justify-center p-1 bg-slate-100 rounded-xl">
                  <button onClick={() => setMode('single')} className={`w-full py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'single' ? 'bg-white text-emerald-900 shadow font-extrabold' : 'text-slate-600 hover:text-slate-800'}`}>Tamanho Único</button>
                  <button onClick={() => setMode('grid')} className={`w-full py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'grid' ? 'bg-white text-emerald-900 shadow font-extrabold' : 'text-slate-600 hover:text-slate-800'}`}>Grade de Tamanhos</button>
              </div>
              <BodyMeasurementsCard measurements={formData.bodyMeasurements} onChange={handleMeasurementChange} mode={mode} selectedSize={selectedSize} onSelectedSizeChange={setSelectedSize} gradingValues={gradingValues} onGradingChange={handleGradingChange} onAutoGrade={handleAutoGrade} baseGradationSize={baseGradationSize} onBaseGradationSizeChange={setBaseGradationSize} sizes={currentSizes} projectType={projectType} armholeType={armholeType} necklineSelection={necklineSelection} />
              {!formData.isSleeveless && <SleeveCard measurements={formData.sleeveMeasurements} onChange={handleMeasurementChange} mode={mode} selectedSize={selectedSize} gradingValues={gradingValues} onGradingChange={handleGradingChange} onAutoGrade={handleAutoGrade} baseGradationSize={baseGradationSize} onBaseGradationSizeChange={setBaseGradationSize} sizes={currentSizes} projectType={projectType} armholeType={armholeType} />}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button onClick={handleCalculate} className="w-full text-white bg-emerald-700 hover:bg-emerald-800 font-bold rounded-xl px-5 py-3.5 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 duration-200 uppercase tracking-wider text-xs font-display">Gerar Receita</button>
                <button onClick={() => setShowClearConfirm(true)} className="w-full text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl px-5 py-3.5 transition-colors font-bold uppercase tracking-wider text-xs font-display">Limpar</button>
              </div>
              <hr className="border-slate-200 my-6" />
              <div className="space-y-4">
                  <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest font-display border-l-4 border-amber-500 pl-2">GESTÃO DE TABELA DE MEDIDAS E PROJETOS</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button 
                        onClick={() => setShowCloudModal(true)} 
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 text-xs font-black uppercase tracking-wider text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-all shadow-sm transform hover:-translate-y-0.5"
                      >
                        <span>☁️</span>
                        Banco de Dados (Nuvem)
                      </button>
                      <button onClick={handleSaveData} className="flex items-center justify-center gap-2 w-full px-4 py-3 text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"><DownloadIcon className="w-4 h-4 text-emerald-700" />Salvar Tabela (TXT)</button>
                      <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 w-full px-4 py-3 text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"><UploadIcon className="w-4 h-4 text-emerald-700" />Carregar Tabela (TXT)</button>
                      <input type="file" ref={fileInputRef} onChange={handleLoadData} accept=".txt" className="hidden" />
                  </div>
              </div>
            </div>
            <div className="w-full">
              <ResultCard 
                result={result} 
                error={error} 
                formData={formData} 
                sizes={currentSizes} 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                onPrint={setPrintMode} 
                onSaveTXT={generateTXT}
                armholeType={armholeType}
              />
            </div>
        </main>

        <footer className="w-full max-w-7xl mt-12 mb-8 py-8 border-t border-slate-200 text-center">
          <p className="text-slate-700 font-bold text-lg mb-4">Uma ferramenta por José Lancellotti / Tricotando com o Zé</p>
          <div className="flex flex-wrap justify-center gap-8">
            <a 
              href="https://www.youtube.com/c/TricotandocomoZé" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 text-slate-800 hover:text-red-600 transition-colors font-extrabold"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              YouTube
            </a>
            <a 
              href="https://www.instagram.com/jose.lancellotti" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 text-slate-800 hover:text-pink-600 transition-colors font-extrabold"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              Instagram
            </a>
          </div>
        </footer>
      </div>

      <div id="print-container" className="hidden print-only bg-white fixed inset-0 z-[9999] overflow-y-auto">
         {printMode === 'current' && result && activeTab && <PrintableRecipe result={result[activeTab]} size={activeTab} armholeType={armholeType} />}
         {printMode === 'all' && result && <div>{Object.entries(result).map(([size, res]) => <div key={size} style={{ pageBreakAfter: 'always' }}><PrintableRecipe result={res} size={size} armholeType={armholeType} /></div>)}</div>}
         {printMode === 'table' && (
           <PrintableMeasurements 
             formData={formData} 
             sizes={currentSizes} 
             barTypeSelection={barTypeSelection} 
             barSwatchValue={barSwatchValue} 
             barSwatchOrlaLength={barSwatchOrlaLength}
             projectType={projectType}
             armholeType={armholeType}
             buttonBandTypeSelection={buttonBandTypeSelection}
             buttonBandSwatchStitches={buttonBandSwatchStitches}
             buttonBandSwatchRows={buttonBandSwatchRows}
             buttonBandSwatchGauge={buttonBandSwatchGauge}
             necklineArmholeFinishing={necklineArmholeFinishing}
             finishingSwatchStitches={finishingSwatchStitches}
             finishingSwatchRows={finishingSwatchRows}
             finishingSwatchGauge={finishingSwatchGauge}
             necklineSelection={necklineSelection}
             machineGauge={machineGauge}
           />
         )}
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 no-print">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Limpar todos os dados?</h3>
            <p className="text-slate-700 mb-6 font-medium">Esta ação irá apagar todas as medidas e configurações preenchidas. Deseja continuar?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setFormData(initialFormData);
                  setShowClearConfirm(false);
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-200"
              >
                Sim, Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      <FirestoreProjectsModal
        isOpen={showCloudModal}
        onClose={() => setShowCloudModal(false)}
        userId={authorizedUser?.uid || auth.currentUser?.uid || "usuario_local"}
        currentProjectData={{
          pieceName: formData.pieceName,
          projectType,
          armholeType,
          necklineSelection,
          sizeCategory,
          mode,
          selectedSize,
          machineGauge,
          barTypeSelection,
          barSwatchValue,
          barSwatchOrlaLength,
          barSwatchGauge,
          buttonBandTypeSelection,
          buttonBandSwatchStitches,
          buttonBandSwatchRows,
          buttonBandSwatchGauge,
          necklineArmholeFinishing,
          finishingSwatchStitches,
          finishingSwatchRows,
          finishingSwatchGauge,
          baseGradationSize,
          formData,
          gradingValues,
        }}
        onLoadProject={handleLoadCloudProject}
      />
    </div>
  );
};
export default App;