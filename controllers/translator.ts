/**
 * Translation Controller
 *
 * This module provides translation functionality for the data extractor.
 * It handles translation of names, descriptions, and other text elements.
 */
import "dotenv/config";

// Import translation dictionaries
import * as additionalTranslations from "../translations/aditionalTranslations";
import * as unifiedTechTreeNames from "../translations/unifiedTechTreeNames";
import * as itemNameGlossary from "./fileParsers/itemNameGlossary";
import { Item } from "./types";

// Translation storage objects
const translationStore: {
	allTranslations: { [key: string]: string };
	allDescriptions: { [key: string]: string };
	translationsFromOtherLanguages: { [key: string]: { [key: string]: string } };
	descriptionsFromOtherLanguages: { [key: string]: { [key: string]: string } };
	translationsInUse: { [key: string]: string };
} = {
	allTranslations: {},
	allDescriptions: {},
	translationsFromOtherLanguages: {},
	descriptionsFromOtherLanguages: {},
	translationsInUse: {},
};

/**
 * Trims a string if it exists
 * @param {string} text - The text to trim
 * @returns {string} - Trimmed text or empty string
 */
const trimIfExists = (text?: string) => {
	return text ? text.trim() : "";
};

/**
 * Checks if a value is null or empty
 * @param {*} value - The value to check
 * @returns {boolean} - True if value is null or empty
 */
const isNullOrEmpty = (value: any) => {
	return value === null || value === undefined || value === "";
};

/**
 * Translates each part of a name separated by underscores
 * @param {string} name - The name to translate
 * @returns {string} - The translated name
 */
export const translateEachPart = (name: string) => {
	if (isNullOrEmpty(name)) {
		return "";
	}

	const words = name.split("_");

	return words
		.reduce((accumulator, word) => {
			const translatedWord = searchName(word);
			if (translatedWord) {
				return `${accumulator} ${translatedWord}`;
			}
			return `${accumulator} ${word}`;
		}, "")
		.trim();
};

/**
 * Translates a name
 * @param {string} name - The name to translate
 * @returns {string} - The translated name
 */
export const translateName = (name: string) => {
	if (isNullOrEmpty(name)) {
		return "";
	}

	// First check if this name exists in the item name glossary
	const glossaryName = itemNameGlossary.getDisplayName(name);
	if (glossaryName) {
		addTranslationInUse(name, glossaryName);
		return glossaryName;
	}

	const translatedName = searchName(name);

	if (translatedName) {
		return translatedName;
	}

	// Check if this is a tech tree name that needs normalization using the unified module
	const normalizedName = unifiedTechTreeNames.normalize(name);
	if (normalizedName !== name) {
		addTranslationInUse(name, normalizedName);
		return normalizedName;
	}

	return trimIfExists(name);
};

/**
 * Translates a tech tree parent reference
 * This specialized function ensures consistent parent-child relationships
 * in the tech tree by normalizing parent references
 * @param {string} name - The name to translate
 * @returns {string} - The normalized and translated parent name
 */
export const translateTechTreeName = (name: string) => {
	if (isNullOrEmpty(name)) {
		return "";
	}

	// First try to normalize using the unified tech tree names module
	const normalizedName = unifiedTechTreeNames.normalize(name);
	if (normalizedName !== name) {
		// Add to translations in use to ensure it's included in exports
		addTranslationInUse(name, normalizedName);
		return normalizedName;
	}

	// If not found in normalizer, try regular translation
	return translateName(name);
};

export const searchName = (name: string) => {
	if (isNullOrEmpty(name)) {
		return null;
	}

	// First check in the item name glossary
	const glossaryName = itemNameGlossary.getDisplayName(name);
	if (glossaryName) {
		const translation = trimIfExists(glossaryName);
		if (translation) {
			addTranslationInUse(name, translation);
		}
		return translation;
	}

	// Check in additional translations
	if (additionalTranslations[name as keyof typeof additionalTranslations]) {
		const translation = trimIfExists(
			additionalTranslations[name as keyof typeof additionalTranslations],
		);
		if (translation) {
			addTranslationInUse(name, translation);
		}
		return translation;
	}

	// Check in all translations
	if (
		translationStore.allTranslations?.[
			name as keyof typeof translationStore.allTranslations
		]
	) {
		const translation = trimIfExists(
			translationStore.allTranslations?.[
				name as keyof typeof translationStore.allTranslations
			],
		);
		if (translation) {
			addTranslationInUse(name, translation);
		}
		return translation;
	}

	if (
		translationStore.translationsInUse[
			name as keyof typeof translationStore.translationsInUse
		]
	) {
		return translationStore.translationsInUse[
			name as keyof typeof translationStore.translationsInUse
		];
	}

	return null;
};

/**
 * Translates an array of items
 * @param {Array} allItems - The items to translate
 * @returns {Array} - The translated items
 */
export const translateItems = (allItems: Item[]) => {
	if (!Array.isArray(allItems)) {
		return [];
	}

	return allItems.map((item) => translateItem(item));
};

/**
 * Translates a single item
 * @param {Object} item - The item to translate
 * @returns {Object} - The translated item
 */
export const translateItem = (item: Item) => {
	if (!item) {
		return {} as Item;
	}

	let name = item.name || "";

	// Use translation if available
	if (item.translation) {
		name = item.translation;
	}

	// First check if this item has a name in the glossary
	const glossaryName = item.translation
		? itemNameGlossary.getDisplayName(item.translation)
		: null;
	if (glossaryName) {
		if (item.name) {
			addTranslation(item.name, glossaryName);
		}
		name = glossaryName;
	} else {
		// Fall back to regular translation if not in glossary
		const translatedName = searchName(item.translation);
		if (translatedName) {
			if (item.name) {
				addTranslation(item.name, translatedName);
			}
			name = translatedName;
		}
	}

	if (name) {
		item.name = trimIfExists(name);
	}

	// Translate category if available
	if (item.category) {
		const translatedCategory = searchName(item.category);
		if (translatedCategory) {
			item.category = trimIfExists(translatedCategory);
		}
	}

	// Translate learn array if available
	if (item.learn && item.learn.length > 0) {
		item.learn = item.learn
			.filter(Boolean)
			.map((value: any) => translateItemPart(value));
	}

	return item;
};

/**
 * Translates a part of an item (used for learn array)
 * @param {string} value - The value to translate
 * @returns {string} - The translated value
 */
export const translateItemPart = (value: string) => {
	if (!value) {
		return "";
	}

	let newValue = value;

	const translatedValue = searchName(newValue);
	if (translatedValue) {
		newValue = translatedValue;
	}

	return trimIfExists(newValue);
};

/**
 * Adds descriptions to items
 * @param {Array} allItems - The items to add descriptions to
 * @returns {Array} - The items with descriptions
 */
export const addDescriptions = (allItems: Item[]) => {
	if (!Array.isArray(allItems)) {
		return [];
	}

	return allItems.map((item) => {
		if (!item) return item;

		let name = item.name || "";
		if (item.translation) {
			name = item.translation;
		}

		if (
			translationStore.allDescriptions[
				name as keyof typeof translationStore.allDescriptions
			]
		) {
			item.description = trimIfExists(
				translationStore.allDescriptions[
					name as keyof typeof translationStore.allDescriptions
				],
			);
		}

		return item;
	});
};

/**
 * Adds a translation
 * @param {string} key - The key to add
 * @param {string} translation - The translation to add
 * @param {string|null} language - The language of the translation
 */
export const addTranslation = (
	key: string,
	translation: string,
	language: string | null = null,
) => {
	if (isNullOrEmpty(key) || isNullOrEmpty(translation)) {
		return;
	}

	if (language === null) {
		if (
			!translationStore.allTranslations[
				key as keyof typeof translationStore.allTranslations
			]
		) {
			translationStore.allTranslations[
				key as keyof typeof translationStore.allTranslations
			] = translation;

			addTranslationInUse(key, translation);
		}
	} else {
		if (
			!translationStore.translationsFromOtherLanguages[
				language as keyof typeof translationStore.translationsFromOtherLanguages
			]
		) {
			translationStore.translationsFromOtherLanguages[
				language as keyof typeof translationStore.translationsFromOtherLanguages
			] = {} as any;
		}

		//@ts-expect-error fix later
		translationStore.translationsFromOtherLanguages[
			language as keyof typeof translationStore.translationsFromOtherLanguages
		][key] = translation;
	}
};

/**
 * Adds a description
 * @param {string} key - The key to add
 * @param {string} description - The description to add
 * @param {string|null} language - The language of the description
 */
export const addDescription = (
	key: string,
	description: string,
	language: string | null = null,
) => {
	if (isNullOrEmpty(key) || isNullOrEmpty(description)) {
		return;
	}

	if (language === null) {
		translationStore.allDescriptions[
			key as keyof typeof translationStore.allDescriptions
		] = description;
	} else {
		if (
			!translationStore.descriptionsFromOtherLanguages[
				language as keyof typeof translationStore.descriptionsFromOtherLanguages
			]
		) {
			translationStore.descriptionsFromOtherLanguages[
				language as keyof typeof translationStore.descriptionsFromOtherLanguages
			] = {} as any;
		}

		//@ts-expect-error fix later
		translationStore.descriptionsFromOtherLanguages[
			language as keyof typeof translationStore.descriptionsFromOtherLanguages
		][key] = description;
	}
};

/**
 * Checks if a key translation is in use
 * @param {string} key - The key to check
 * @returns {boolean} - True if the key is in use
 */
export const isKeyTranslationInUse = (key: string) => {
	return !isNullOrEmpty(
		translationStore.translationsInUse[
			key as keyof typeof translationStore.translationsInUse
		],
	);
};

/**
 * Adds a translation if it does not already exist
 * @param {string} key - The key to add
 * @param {string} translation - The translation to add
 */
export const addTranslationInUse = (key: string, translation: string) => {
	if (isNullOrEmpty(key) || isNullOrEmpty(translation)) {
		return;
	}

	if (!isKeyTranslationInUse(key)) {
		translationStore.translationsInUse[
			key as keyof typeof translationStore.translationsInUse
		] = translation;
	}
};

/**
 * Gets the translation files
 * @returns {Object} - The translation files
 */
export const getTranslateFiles = () => {
	const translationsFiltered: { [key: string]: any } = {};

	// First, collect all the English item names that are actually in use
	const usedItemNames = new Set();

	for (const key in translationStore.allTranslations) {
		const englishName =
			translationStore.allTranslations[
				key as keyof typeof translationStore.allTranslations
			];
		if (englishName) {
			usedItemNames.add(englishName);
		}
	}

	for (const key in translationStore.translationsInUse) {
		const englishName =
			translationStore.translationsInUse[
				key as keyof typeof translationStore.translationsInUse
			];
		// Much less restrictive filtering to include more valid translations
		// Only filter out completely empty strings or extremely long entries
		if (englishName) {
			usedItemNames.add(englishName);
		}
	}

	// Now process translations for each language
	for (const language in translationStore.translationsFromOtherLanguages) {
		if (!translationsFiltered[language]) {
			translationsFiltered[language] = {};
		}

		// Create a map to track duplicate keys and their values
		const processedKeys = new Map();

		// Process translations
		for (const key in translationStore.translationsFromOtherLanguages[
			language as keyof typeof translationStore.translationsFromOtherLanguages
		]) {
			if (isKeyTranslationInUse(key)) {
				// Get the English name which will be used as the key
				const englishName =
					translationStore.translationsInUse[
						key as keyof typeof translationStore.translationsInUse
					];
				// Get the translated text in the target language
				const translatedText =
					translationStore.translationsFromOtherLanguages?.[
						language as keyof typeof translationStore.translationsFromOtherLanguages
					]?.[key];

				// Skip invalid entries
				if (
					!englishName ||
					!translatedText ||
					typeof translatedText !== "string" ||
					!usedItemNames.has(englishName)
				) {
					continue;
				}

				// Skip if the cleaned translation is empty
				if (!translatedText) {
					continue;
				}

				// Handle duplicate keys - keep the longer translation as it's likely more complete
				if (!processedKeys.has(englishName)) {
					processedKeys.set(englishName, translatedText);
				}
			}
		}

		// Add all processed translations to the filtered result
		processedKeys.forEach((value, key) => {
			translationsFiltered[language][key] = value;
		});
	}

	return translationsFiltered;
};
