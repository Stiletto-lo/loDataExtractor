/**
 * Tech Parser Class
 *
 * This class is responsible for parsing tech tree data from game files.
 * It extends the BaseParser class and implements specific tech parsing logic.
 */

const BaseParser = require("./BaseParser");
const fs = require("node:fs");

class TechParser extends BaseParser {
	/**
	 * Constructor for the TechParser class
	 * @param {Object} options - Configuration options for the parser
	 * @param {Object} translator - Translator instance for handling translations
	 * @param {Object} dataParser - Data parser for handling common data parsing tasks
	 */
	constructor(options, translator, dataParser) {
		super(options);
		this.translator = translator;
		this.dataParser = dataParser;
		this.techData = [];
		this.templates = {
			tech: require("../../templates/tech"),
		};
	}

	/**
	 * Parse tech data from a file
	 * @param {string} filePath - Path to the file to parse
	 * @returns {Object|null} - Parsed tech data or null if parsing failed
	 */
	parse(filePath) {
		return this.parseTechData(filePath);
	}

	/**
	 * Parse tech data from a file
	 * @param {string} filePath - Path to the file to parse
	 * @returns {Object|null} - Parsed tech data or null if parsing failed
	 */
	parseTechData(filePath) {
		const jsonData = this.readJsonFile(filePath);
		if (!jsonData) return null;

		// Check if this is a tech tree file
		if (!jsonData[1]?.Properties?.TechTreeName) {
			return null;
		}

		const techData = jsonData[1];
		const tech = { ...this.templates.tech };

		// Extract basic tech properties
		tech.name = this.dataParser.parseName(
			this.translator,
			techData.Properties.TechTreeName,
		);
		tech.type = this.dataParser.parseType(techData.Type);

		// Extract additional properties if they exist
		if (techData.Properties.TechTreeDescription) {
			tech.description = this.dataParser.parseName(
				this.translator,
				techData.Properties.TechTreeDescription,
			);
		}

		if (techData.Properties.TechTreeCategory) {
			tech.category = techData.Properties.TechTreeCategory;
		}

		if (techData.Properties.TechTreeCost) {
			tech.cost = techData.Properties.TechTreeCost;
		}

		if (
			techData.Properties.TechTreeUnlocks &&
			techData.Properties.TechTreeUnlocks.length > 0
		) {
			tech.unlocks = techData.Properties.TechTreeUnlocks.map((unlock) => {
				return this.dataParser.parseType(unlock.AssetPathName);
			});
		}

		// Clean up the tech object
		const cleanedTech = this.cleanEmptyProperties(tech);

		if (cleanedTech && Object.keys(cleanedTech).length > 0) {
			this.techData.push(cleanedTech);
			return cleanedTech;
		}

		return null;
	}

	/**
	 * Get all tech data
	 * @returns {Array} - Array of all parsed tech data
	 */
	getTechData() {
		return this.techData;
	}

	/**
	 * Extract tech by type
	 * @param {string} type - The type to extract
	 * @returns {Object|null} - The extracted tech or null if not found
	 */
	extractTechByType(type) {
		return this.techData.find((tech) => tech.type === type) || null;
	}
}

module.exports = TechParser;
