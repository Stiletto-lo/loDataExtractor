/**
 * Translation Controller
 *
 * This module provides translation functionality for the data extractor.
 * It handles translation of names, descriptions, and other text elements.
 */
require("dotenv").config();

/**
 * Translation controller object
 * @type {Object}
 */
const controller = {};

// Import translation dictionaries
const additionalTranslations = require("../translations/aditionalTranslations");
const unifiedTechTreeNames = require("../translations/unifiedTechTreeNames");
const itemNameGlossary = require("./fileParsers/itemNameGlossary");

// Translation storage objects
const translationStore = {
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
const trimIfExists = (text) => {
	return text ? text.trim() : "";
};

/**
 * Checks if a value is null or empty
 * @param {*} value - The value to check
 * @returns {boolean} - True if value is null or empty
 */
const isNullOrEmpty = (value) => {
	return value === null || value === undefined || value === "";
};

/**
 * Translates each part of a name separated by underscores
 * @param {string} name - The name to translate
 * @returns {string} - The translated name
 */
controller.translateEachPart = (name) => {
	if (isNullOrEmpty(name)) {
		return "";
	}

	const words = name.split("_");

	return words
		.reduce((accumulator, word) => {
			const translatedWord = controller.searchName(word);
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
controller.translateName = (name) => {
	if (isNullOrEmpty(name)) {
		return "";
	}

	// First check if this name exists in the item name glossary
	const glossaryName = itemNameGlossary.getDisplayName(name);
	if (glossaryName) {
		controller.addTranslationInUse(name, glossaryName);
		return glossaryName;
	}

	// Check if this is a tech tree name that needs normalization using the unified module
	const normalizedName = unifiedTechTreeNames.normalize(name);
	if (normalizedName !== name) {
		controller.addTranslationInUse(name, normalizedName);
		return normalizedName;
	}

	const translatedName = controller.searchName(name);

	if (translatedName) {
		return translatedName;
	}

	return trimIfExists(name);
};

/**
 * Translates a tech tree parent reference
 * This specialized function ensures consistent parent-child relationships
 * in the tech tree by normalizing parent references
 * @param {string} parentName - The parent name to translate
 * @returns {string} - The normalized and translated parent name
 */
controller.translateTechTreeParent = (parentName) => {
	if (isNullOrEmpty(parentName)) {
		return "";
	}

	// First try to normalize using the unified tech tree names module
	const normalizedName = unifiedTechTreeNames.normalize(parentName);
	if (normalizedName !== parentName) {
		// Add to translations in use to ensure it's included in exports
		controller.addTranslationInUse(parentName, normalizedName);
		return normalizedName;
	}

	// If not found in normalizer, try regular translation
	return controller.translateName(parentName);
};

controller.searchName = (name) => {
	if (isNullOrEmpty(name)) {
		return null;
	}

	// First check in the item name glossary
	const glossaryName = itemNameGlossary.getDisplayName(name);
	if (glossaryName) {
		const translation = trimIfExists(glossaryName);
		controller.addTranslationInUse(name, translation);
		return translation;
	}

	// Check in additional translations
	if (additionalTranslations[name]) {
		const translation = trimIfExists(additionalTranslations[name]);
		controller.addTranslationInUse(name, translation);
		return translation;
	}

	// Check in all translations
	if (translationStore.allTranslations[name]) {
		const translation = trimIfExists(translationStore.allTranslations[name]);
		controller.addTranslationInUse(name, translation);
		return translation;
	}

	if (controller.translationsInUse?.[name]) {
		return controller.translationsInUse[name];
	}

	return null;
};

/**
 * Translates an array of items
 * @param {Array} allItems - The items to translate
 * @returns {Array} - The translated items
 */
controller.translateItems = (allItems) => {
	if (!Array.isArray(allItems)) {
		return [];
	}

	return allItems.map((item) => controller.translateItem(item));
};

/**
 * Adds "(1 of 2)" suffix to item names that need it
 * @param {string} name - The name to process
 * @returns {string} - The processed name
 */
const processSpecialItemName = (name) => {
	if (!name) return "";

	if (
		(name.includes(" Legs") || name.includes(" Wings")) &&
		!name.includes("(1 of 2)") &&
		!name.includes("Schematic")
	) {
		return `${name} (1 of 2)`;
	}

	return name;
};

/**
 * Translates a single item
 * @param {Object} item - The item to translate
 * @returns {Object} - The translated item
 */
controller.translateItem = (item) => {
	if (!item) {
		return {};
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
			controller.addTranslation(item.name, glossaryName);
		}
		name = glossaryName;
	} else {
		// Fall back to regular translation if not in glossary
		const translatedName = controller.searchName(item.translation);
		if (translatedName) {
			if (item.name) {
				controller.addTranslation(item.name, translatedName);
			}
			name = translatedName;
		}
	}

	if (name) {
		name = processSpecialItemName(name);
		item.name = trimIfExists(name);
	}

	// Translate category if available
	if (item.category) {
		const translatedCategory = controller.searchName(item.category);
		if (translatedCategory) {
			item.category = trimIfExists(translatedCategory);
		}
	}

	// Translate learn array if available
	if (item.learn && item.learn.length > 0) {
		item.learn = item.learn
			.filter(Boolean)
			.map((value) => controller.translateItemPart(value));
	}

	return item;
};

/**
 * Translates a part of an item (used for learn array)
 * @param {string} value - The value to translate
 * @returns {string} - The translated value
 */
controller.translateItemPart = (value) => {
	if (!value) {
		return "";
	}

	let newValue = value;

	const translatedValue = controller.searchName(newValue);
	if (translatedValue) {
		newValue = translatedValue;
	}

	newValue = processSpecialItemName(newValue);

	return trimIfExists(newValue);
};

/**
 * Adds descriptions to items
 * @param {Array} allItems - The items to add descriptions to
 * @returns {Array} - The items with descriptions
 */
controller.addDescriptions = (allItems) => {
	if (!Array.isArray(allItems)) {
		return [];
	}

	return allItems.map((item) => {
		if (!item) return item;

		let name = item.name || "";
		if (item.translation) {
			name = item.translation;
		}

		if (translationStore.allDescriptions[name]) {
			item.description = trimIfExists(translationStore.allDescriptions[name]);
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
controller.addTranslation = (key, translation, language = null) => {
	if (isNullOrEmpty(key) || isNullOrEmpty(translation)) {
		return;
	}

	if (language === null) {
		if (!translationStore.allTranslations[key]) {
			translationStore.allTranslations[key] = translation;
		}
	} else if (translationStore.translationsFromOtherLanguages[language]) {
		translationStore.translationsFromOtherLanguages[language][key] =
			translation;
	} else {
		translationStore.translationsFromOtherLanguages[language] = {};
		translationStore.translationsFromOtherLanguages[language][key] =
			translation;
	}
};

/**
 * Adds a description
 * @param {string} key - The key to add
 * @param {string} description - The description to add
 * @param {string|null} language - The language of the description
 */
controller.addDescription = (key, description, language = null) => {
	if (isNullOrEmpty(key) || isNullOrEmpty(description)) {
		return;
	}

	if (language === null) {
		translationStore.allDescriptions[key] = description;
	} else if (translationStore.descriptionsFromOtherLanguages[language]) {
		translationStore.descriptionsFromOtherLanguages[language][key] =
			description;
	} else {
		translationStore.descriptionsFromOtherLanguages[language] = {};
		translationStore.descriptionsFromOtherLanguages[language][key] =
			description;
	}
};


/**
 * Checks if a key translation is in use
 * @param {string} key - The key to check
 * @returns {boolean} - True if the key is in use
 */
controller.isKeyTranslationInUse = (key) => {
	return !isNullOrEmpty(translationStore.translationsInUse[key]);
};

/**
 * Adds a translation if it does not already exist
 * @param {string} key - The key to add
 * @param {string} translation - The translation to add
 */
controller.addTranslationInUse = (key, translation) => {
	if (isNullOrEmpty(key) || isNullOrEmpty(translation)) {
		return;
	}

	if (!controller.isKeyTranslationInUse(key)) {
		translationStore.translationsInUse[key] = translation;
	}
};

/**
 * Gets the translation files
 * @returns {Object} - The translation files
 */
controller.getTranslateFiles = () => {
	const translationsFiltered = {};

	// First, collect all the English item names that are actually in use
	const usedItemNames = new Set();

	for (const key in translationStore.allTranslations) {
		const englishName = translationStore.allTranslations[key];
		if (englishName) {
			usedItemNames.add(englishName);
		}
	}

	for (const key in translationStore.translationsInUse) {
		const englishName = translationStore.translationsInUse[key];
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
			language
		]) {
			if (controller.isKeyTranslationInUse(key)) {
				// Get the English name which will be used as the key
				const englishName = translationStore.translationsInUse[key];
				// Get the translated text in the target language
				const translatedText =
					translationStore.translationsFromOtherLanguages[language][key];

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

module.exports = controller;
