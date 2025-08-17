// src/helpers/recipeHelpers.ts
export type MinimalRecipe = {
  id: string;
  localId?: string;       // uuid from public.recipes (when known)
  externalId?: string;    // MealDB id (for API items)
  source?: 'discovery' | 'saved' | 'my-recipes' | 'plus' | 'for-you' | 'all';
  isSaved?: boolean;
};

export function logicalKey(r: MinimalRecipe) {
  return r.localId ? `local:${r.localId}` : r.externalId ? `mealdb:${r.externalId}` : `id:${r.id}`;
}

export function dedupeByLogicalIdentity<T extends MinimalRecipe>(list: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of list) {
    const key = logicalKey(r);
    if (!seen.has(key)) { seen.add(key); out.push(r); }
  }
  return out;
}

export function buildSavedSet(saved: MinimalRecipe[]) {
  return new Set(saved.map(r => r.localId).filter(Boolean) as string[]);
}

export function applySavedFlags<T extends MinimalRecipe>(list: T[], savedSet: Set<string>): T[] {
  return list.map(r => ({
    ...r,
    isSaved: r.localId ? savedSet.has(r.localId) : Boolean(r.isSaved),
  })) as T[];
}

export function sameLogical(a: MinimalRecipe, b: MinimalRecipe) {
  if (a.localId && b.localId && a.localId === b.localId) return true;
  if (a.externalId && b.externalId && a.externalId === b.externalId) return true;
  return false;
}
