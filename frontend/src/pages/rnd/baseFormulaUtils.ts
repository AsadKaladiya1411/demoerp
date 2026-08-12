export type BaseFormulaIngredientDraft = {
  id: string;
  materialName: string;
  quantityPer100g: string;
  proteinPercent: string;
  proteinContribution: string;
  costPerKg: string;
  remarks: string;
};

export type BaseFormulaSummary = {
  totalQtyPer100g: number;
  totalQtyPerServing: number;
  totalQtyPerBatch: number;
  totalProtein: number;
  proteinPerServing: number;
  totalCost: number;
  rmCostPerServing: number;
  basePercentage: number;
};

export const todayString = () => new Date().toISOString().slice(0, 10);

export const createIngredientDraft = (id: string): BaseFormulaIngredientDraft => ({
  id,
  materialName: '',
  quantityPer100g: '',
  proteinPercent: '',
  proteinContribution: '',
  costPerKg: '',
  remarks: '',
});

const toNumber = (value: string) => Number(value || 0);

export const calculateBaseFormulaSummary = (
  ingredients: BaseFormulaIngredientDraft[],
  batchSize: number,
  servingSize: number,
): BaseFormulaSummary => {
  const totalQtyPer100g = ingredients.reduce((sum, ingredient) => sum + toNumber(ingredient.quantityPer100g), 0);
  const totalQtyPerServing = ingredients.reduce((sum, ingredient) => {
    const quantityPer100g = toNumber(ingredient.quantityPer100g);
    return sum + (quantityPer100g / 100) * servingSize;
  }, 0);
  const totalQtyPerBatch = ingredients.reduce((sum, ingredient) => {
    const quantityPer100g = toNumber(ingredient.quantityPer100g);
    return sum + (quantityPer100g / 100) * batchSize;
  }, 0);
  const totalProtein = ingredients.reduce((sum, ingredient) => {
    const quantityPer100g = toNumber(ingredient.quantityPer100g);
    const proteinPercent = toNumber(ingredient.proteinPercent);
    return sum + (proteinPercent / 100) * quantityPer100g;
  }, 0);
  const proteinPerServing = (totalProtein / 100) * servingSize;
  const totalCost = ingredients.reduce((sum, ingredient) => {
    const quantityPer100g = toNumber(ingredient.quantityPer100g);
    const quantityPerServing = (quantityPer100g / 100) * servingSize;
    const costPerGram = toNumber(ingredient.costPerKg) / 1000;
    return sum + quantityPerServing * costPerGram;
  }, 0);
  const rmCostPerServing = totalCost;
  const basePercentage = totalQtyPer100g;

  return {
    totalQtyPer100g,
    totalQtyPerServing,
    totalQtyPerBatch,
    totalProtein,
    proteinPerServing,
    totalCost,
    rmCostPerServing,
    basePercentage,
  };
};