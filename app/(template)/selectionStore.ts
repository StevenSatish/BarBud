export type TemplateSelectionItem = {
  id: string;
  name: string;
  category: string;
};

let cachedSelection: TemplateSelectionItem[] | null = null;

export const setTemplateSelection = (items: TemplateSelectionItem[]) => {
  cachedSelection = items;
};

export const consumeTemplateSelection = (): TemplateSelectionItem[] | null => {
  const out = cachedSelection;
  cachedSelection = null;
  return out;
};

export default {
  setTemplateSelection,
  consumeTemplateSelection,
};

