/**
 * Translation parsers for handling translation-related data
 * This module provides functions to parse translation files in different formats
 * and extract key-value pairs for use in the application.
 */

const translator = require("../translator");
const { readJsonFile } = require("../utils/read-json-file");

// Constants
const GAME_PATH_REGEX = /[\\\/]Game[\\\/](.+)[\\\/]Game\.json/; // Works with both forward and backslashes

/**
 * Extracts and processes key-value pairs from translation data
 * @param {string} key - The translation key
 * @param {string} value - The translation value
 * @param {string|null} language - Optional language code
 * @returns {void}
 */
const processTranslationEntry = (key, value, language = null) => {
	if (!key || typeof key !== "string" || !value || typeof value !== "string") {
		return;
	}

	const cleanKey = key.trim();
	// Clean up the value by replacing multiple newlines with a single space
	const cleanValue = value
		.replace(/\r\n|\n\r|\n|\r/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	// Handle different key patterns
	if (cleanKey.includes(".Description")) {
		// Process as a description
		translator.addDescription(
			cleanKey.replace(".Description", "").trim(),
			cleanValue,
			language,
		);
	} else if (cleanKey.includes(".Name")) {
		// Process as a name
		translator.addTranslation(
			cleanKey.replace(".Name", "").trim(),
			cleanValue,
			language,
		);
	}
};

/**
 * Process a translation data object by iterating through its key-value pairs
 * @param {Object} translationData - The translation data object
 * @param {string|null} language - Optional language code
 * @returns {boolean} - Whether processing was successful
 */
const processTranslationData = (translationData, language = null) => {
	if (!translationData || typeof translationData !== "object") {
		return false;
	}

	for (const key in translationData) {
		if (Object.hasOwn(translationData, key)) {
			processTranslationEntry(key, translationData[key], language);
		}
	}

	return true;
};

/**
 * Parse translations data from a file
 * @param {string} filePath - The file path to parse
 * @returns {boolean} - Whether parsing was successful
 */
const parseTranslations = (filePath) => {
	const jsonData = readJsonFile(filePath);

	if (!jsonData) {
		return false;
	}

	// Check for expected structure in the JSON data
	if (jsonData?.Items) {
		return processTranslationData(jsonData.Items);
	}

	return false;
};

const parseStringTables = (filePath) => {
	const jsonData = readJsonFile(filePath);

	if (!jsonData) {
		return false;
	}

	if (jsonData?.[0]?.StringTable?.KeysToEntries) {
		return processTranslationData(jsonData?.[0]?.StringTable?.KeysToEntries);
	}

	return false;
};

/**
 * Extract language code from file path
 * @param {string} filePath - The file path to extract language from
 * @returns {string|null} - The language code or null if not found
 */
const extractLanguageFromPath = (filePath) => {
	if (!filePath || typeof filePath !== "string") {
		return null;
	}

	// Normalize path to handle both forward and backslashes
	const normalizedPath = filePath.replace(/\\/g, "/");
	const match = RegExp(GAME_PATH_REGEX).exec(normalizedPath);

	return match?.[1] ? match[1] : null;
};

/**
 * Parse other translations data from a file
 * @param {string} filePath - The file path to parse
 * @returns {boolean} - Whether parsing was successful
 */
const parseOtherTranslations = (filePath) => {
	const language = extractLanguageFromPath(filePath);

	if (!language) {
		return false;
	}

	const jsonData = readJsonFile(filePath);

	if (!jsonData) {
		return false;
	}

	let success = false;

	// Special handling for Game.json which has a different structure
	// Game.json has an empty string as the first key and contains item descriptions
	for (const translationGroup in jsonData) {
		if (Object.hasOwn(jsonData, translationGroup)) {
			const groupData = jsonData[translationGroup];

			// Handle the special case of empty string key in Game.json
			if (translationGroup === "" && typeof groupData === "object") {
				// Process each entry in the empty string group
				for (const key in groupData) {
					if (Object.hasOwn(groupData, key)) {
						const value = groupData[key];
						// Check if the value contains a description pattern
						if (value && typeof value === "string") {
							// If the key ends with .Description, process it as a description
							if (key.endsWith(".Description")) {
								const itemName = key.replace(".Description", "").trim();
								translator.addDescription(itemName, value, language);
								success = true;
							} else if (key.endsWith(".Name")) {
								// If the key ends with .Name, process it as a name
								const itemName = key.replace(".Name", "").trim();
								translator.addTranslation(itemName, value, language);
								success = true;
							} else {
								// For other entries, try to determine if it's a name or description
								translator.addTranslation(key, value, language);
								success = true;
							}
						}
					}
				}
			} else {
				// Process regular translation groups
				if (processTranslationData(groupData, language)) {
					success = true;
				}
			}
		}
	}

	return success;
};

module.exports = {
	parseTranslations,
	parseOtherTranslations,
	processTranslationEntry,
	parseStringTables,
	// Export for testing purposes
	_internal: {
		readJsonFile,
		processTranslationData,
		extractLanguageFromPath,
	},
};
