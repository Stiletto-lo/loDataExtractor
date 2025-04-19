/**
 * Parser System
 *
 * This module provides a class-based parser system for the data extractor.
 * It implements a more maintainable and modular approach to parsing game data.
 */

const BaseParser = require("./BaseParser");
const ItemParser = require("./ItemParser");
const LootParser = require("./LootParser");
const dataParser = require("../dataParsers");
const translator = require("../translator");

/**
 * ParserManager Class
 *
 * This class manages all parser instances and provides a unified interface
 * for the application to interact with the parsers.
 */
class ParserManager {
	/**
	 * Constructor for the ParserManager class
	 * @param {Object} options - Configuration options for the parser manager
	 */
	constructor(options = {}) {
		this.options = options;
		this.parsers = {};
		this.data = {
			items: [],
			lootTables: {},
			creatures: [],
			techData: [],
			upgrades: [],
			translations: {},
		};

		// Initialize parsers
		this.initializeParsers();
	}

	/**
	 * Initialize all parser instances
	 */
	initializeParsers() {
		// Create item parser
		this.parsers.item = new ItemParser(
			this.options.item || {},
			translator,
			dataParser,
		);

		// Create loot parser (depends on item parser)
		this.parsers.loot = new LootParser(
			this.options.loot || {},
			translator,
			dataParser,
			this.parsers.item,
		);

		// Additional parsers can be initialized here
	}

	/**
	 * Parse a file with the appropriate parser based on file type
	 * @param {string} filePath - Path to the file to parse
	 * @param {string} fileType - Type of file to parse (e.g., 'item', 'loot')
	 * @returns {Object|null} - Parsed data or null if parsing failed
	 */
	parseFile(filePath, fileType) {
		if (!this.parsers[fileType]) {
			console.error(`No parser found for file type: ${fileType}`);
			return null;
		}

		return this.parsers[fileType].parse(filePath);
	}

	/**
	 * Get all items
	 * @returns {Array} - All parsed items
	 */
	getAllItems() {
		return this.parsers.item.getAllItems();
	}

	/**
	 * Get all loot tables
	 * @returns {Object} - All parsed loot tables
	 */
	getAllLootTables() {
		return this.parsers.loot.getAllLootTables();
	}

	/**
	 * Get all creatures
	 * @returns {Array} - All parsed creatures
	 */
	getCreatures() {
		return this.parsers.loot.getCreatures();
	}

	/**
	 * Get translator instance
	 * @returns {Object} - Translator instance
	 */
	getTranslator() {
		return translator;
	}
}

// Create a singleton instance of the parser manager
const parserManager = new ParserManager();

/**
 * Legacy compatibility layer
 *
 * This provides backward compatibility with the existing codebase
 * while the migration to the new parser system is in progress.
 */
module.exports = {
	// New API
	ParserManager,
	BaseParser,
	ItemParser,
	LootParser,
	getParserManager: () => parserManager,

	// Legacy API - these functions delegate to the appropriate parser methods
	parseItemData: (filePath) => parserManager.parseFile(filePath, "item"),
	parseLootTable: (filePath) => parserManager.parseFile(filePath, "loot"),
	parseLootSites: (filePath) =>
		parserManager.parsers.loot.parseLootSites(filePath),
	getAllItems: () => parserManager.getAllItems(),
	getAllLootTables: () => parserManager.getAllLootTables(),
	getCreatures: () => parserManager.getCreatures(),
	getTranslator: () => parserManager.getTranslator(),

	// Additional legacy methods can be added here as needed
};
