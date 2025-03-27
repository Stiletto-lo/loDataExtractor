/**
 * Translation parsers for handling translation-related data
 * This module provides functions to parse translation files in different formats
 * and extract key-value pairs for use in the application.
 */

const fs = require("node:fs");
const path = require("node:path");
const translator = require("../translator");

// Constants
const GAME_PATH_REGEX = /[\\\/]Game[\\\/](.+)[\\\/]Game\.json/; // Works with both forward and backslashes

/**
 * Safely reads and parses a JSON file
 * @param {string} filePath - The file path to read
 * @returns {Object|null} - Parsed JSON data or null if error occurs
 */
const readJsonFile = (filePath) => {
	try {
		if (!filePath || typeof filePath !== "string") {
			console.error("Invalid file path provided");
			return null;
		}

		const rawData = fs.readFileSync(filePath, "utf8");
		return JSON.parse(rawData);
	} catch (error) {
		console.error(`Error reading or parsing file ${filePath}:`, error.message);
		return null;
	}
};

/**
 * Extracts and processes key-value pairs from translation data
 * @param {string} key - The translation key
 * @param {string} value - The translation value
 * @param {string|null} language - Optional language code
 * @returns {void}
 */
const processTranslationEntry = (key, value, language = null) => {
	if (!key || typeof key !== "string") {
		return;
	}

	const cleanKey = key.trim();

	if (cleanKey.includes(".Description")) {
		translator.addDescription(
			cleanKey.replace(".Description", "").trim(),
			value,
			language,
		);
	} else {
		translator.addTranslation(
			cleanKey.replace(".Name", "").trim(),
			value,
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
		if (Object.prototype.hasOwnProperty.call(translationData, key)) {
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
	if (jsonData[0]?.StringTable?.KeysToMetaData) {
		return processTranslationData(jsonData[0].StringTable.KeysToMetaData);
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

	for (const translationGroup in jsonData) {
		if (Object.prototype.hasOwnProperty.call(jsonData, translationGroup)) {
			const groupData = jsonData[translationGroup];

			// Process each translation group
			if (processTranslationData(groupData, language)) {
				success = true;
			}
		}
	}

	return success;
};

module.exports = {
	parseTranslations,
	parseOtherTranslations,
	// Export for testing purposes
	_internal: {
		readJsonFile,
		processTranslationEntry,
		processTranslationData,
		extractLanguageFromPath,
	},
};
