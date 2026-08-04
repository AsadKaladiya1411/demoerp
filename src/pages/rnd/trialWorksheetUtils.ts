import type { SavedBaseFormulaRecord, TrialIngredientRecord } from './rndStore';

export const todayString = () => new Date().toISOString().slice(0, 10);

const toNumber = (value: string | number | undefined) => Number(value || 0);

export const createTrialIngredientsFromBaseFormula = (baseFormula: SavedBaseFormulaRecord): TrialIngredientRecord[] => {
  return baseFormula.ingredients.map((ingredient, index) => {
    const baseQuantity = toNumber(ingredient.quantityPer100g);
    return {
      id: `${baseFormula.id}-trial-ingredient-${index + 1}`,
      ingredientName: ingredient.rawMaterialName,
      rawMaterialId: ingredient.materialId,
      manufacturer: ingredient.manufacturer,
      uom: ingredient.uom,
      baseQuantity,
      trialQuantity: baseQuantity,
      difference: 0,
      remarks: ingredient.remarks,
    };
  });
};

export const calculateTrialSummary = (ingredients: TrialIngredientRecord[], batchSize: number) => {
  const totalWeight = ingredients.reduce((sum, ingredient) => sum + toNumber(ingredient.trialQuantity), 0);
  const remainingSpace = batchSize - totalWeight;
  const milkNeeded = ingredients.reduce((sum, ingredient) => {
    if (!ingredient.ingredientName.toLowerCase().includes('milk')) return sum;
    return sum + toNumber(ingredient.trialQuantity);
  }, 0);

  return {
    totalWeight,
    remainingSpace,
    milkNeeded,
  };
};
