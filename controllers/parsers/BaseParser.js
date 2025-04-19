/**
 * Base Parser Class
 *
 * This abstract class provides the foundation for all parser implementations.
 * It defines common functionality and interfaces that all parsers should implement.
 */

class BaseParser {
	/**
	 * Constructor for the BaseParser class
	 * @param {Object} options - Configuration options for the parser
	 */
	constructor(options = {}) {
		this.options = options;
	}

	/**
	 * Parse data from a file
	 * @param {string} filePath - Path to the file to parse
	 * @returns {Object|Array|null} - Parsed data or null if parsing failed
	 */
	parse(filePath) {
		throw new Error("Method parse() must be implemented by derived classes");
	}

	/**
	 * Safely reads and parses a JSON file
	 * @param {string} filePath - The file path to read
	 * @returns {Object|null} - Parsed JSON data or null if error occurs
	 */
	readJsonFile(filePath) {
		if (!filePath || typeof filePath !== "string") {
			console.error("Invalid file path provided to readJsonFile");
			return null;
		}

		try {
			const fs = require("node:fs");
			const rawData = fs.readFileSync(filePath);
			return JSON.parse(rawData);
		} catch (error) {
			console.error(
				`Error reading or parsing file ${filePath}:`,
				error.message,
			);
			return null;
		}
	}

	/**
	 * Clean empty properties from an object
	 * @param {Object} obj - The object to clean
	 * @returns {Object} - The cleaned object
	 */
	cleanEmptyProperties(obj) {
		if (!obj || typeof obj !== "object") return obj;

		const cleaned = { ...obj };

		for (const key of Object.keys(cleaned)) {
			if (cleaned[key] === undefined || cleaned[key] === null) {
				delete cleaned[key];
			}

			if (Array.isArray(cleaned[key]) && cleaned[key].length === 0) {
				delete cleaned[key];
			}
		}

		return cleaned;
	}
}

module.exports = BaseParser;
