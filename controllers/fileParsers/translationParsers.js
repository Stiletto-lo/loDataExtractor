/**
 * Translation parsers for handling translation-related data
 */

const fs = require("node:fs");
const translator = require("../translator");

/**
 * Extracts and processes key-value pairs from translation data
 * @param {string} key - The translation key
 * @param {string} value - The translation value
 * @param {string|null} language - Optional language code
 */
const processTranslationEntry = (key, value, language = null) => {
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
 * Safely reads and parses a JSON file
 * @param {string} filePath - The file path to read
 * @returns {Object|null} - Parsed JSON data or null if error occurs
 */
const readJsonFile = (filePath) => {
	try {
		const rawData = fs.readFileSync(filePath, "utf8");
		return JSON.parse(rawData);
	} catch (error) {
		console.error(`Error reading or parsing file ${filePath}:`, error.message);
		return null;
	}
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

	if (jsonData[0]?.StringTable?.KeysToMetaData) {
		const translationData = jsonData[0].StringTable.KeysToMetaData;

		for (const key in translationData) {
			processTranslationEntry(key, translationData[key]);
		}

		return true;
	}

	return false;
};

/**
 * Parse other translations data from a file
 * @param {string} filePath - The file path to parse
 * @returns {boolean} - Whether parsing was successful
 */
const parseOtherTranslations = (filePath) => {
	const GAME_PATH_REGEX = /\/Game\/(.+)\/Game\.json/;

	if (!GAME_PATH_REGEX.test(filePath)) {
		return false;
	}

	const match = filePath.match(GAME_PATH_REGEX);
	if (!match || !match[1]) {
		return false;
	}

	const language = match[1];
	const jsonData = readJsonFile(filePath);

	if (!jsonData) {
		return false;
	}

	for (const translationGroup in jsonData) {
		const groupData = jsonData[translationGroup];

		for (const key in groupData) {
			processTranslationEntry(key, groupData[key], language);
		}
	}

	return true;
};

module.exports = {
	parseTranslations,
	parseOtherTranslations,
};
