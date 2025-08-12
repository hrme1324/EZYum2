export function normalizeIngredients(input: any): { name: string; measure: string }[] {
  // If input is an array of objects with name, measure → return as-is (fill missing measure with '')
  if (Array.isArray(input) && input.length > 0) {
    if (typeof input[0] === 'object' && input[0] !== null && 'name' in input[0]) {
      return input.map((ingredient: any) => ({
        name: ingredient.name || '',
        measure: ingredient.measure || '',
      }));
    }

    // If input is an array of strings → map to { name: str, measure: '' }
    if (typeof input[0] === 'string') {
      return input.map((ingredient: string) => ({
        name: ingredient,
        measure: '',
      }));
    }
  }

  // Otherwise return empty array
  return [];
}
