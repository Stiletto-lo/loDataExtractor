export interface Translator {
  translateName: (name: string) => string;
  translateEachPart: (name: string) => string;
  translateTechTreeName: (name: string) => string;
  searchName: (name: string) => string | null;
  translateItems: (allItems: Item[]) => Item[];
  translateItem: (item: Item) => Item;
  translateItemPart: (value: string) => string;
  addDescriptions: (allItems: Item[]) => Item[];
  addTranslation: (key: string, translation: string, language?: string | null) => void;
  addDescription: (key: string, description: string, language?: string | null) => void;
  isKeyTranslationInUse: (key: string) => boolean;
  addTranslationInUse: (key: string, translation: string) => void;
  getTranslateFiles: () => { [key: string]: any };
}

export interface Item {
  name: string;
  translation?: string;
  category?: string;
  learn?: string[];
  description?: string;
  [key: string]: any;
}
