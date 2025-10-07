/**
 * Perk parser for handling perk-related data
 * This module provides functions to parse perk files and extract perk information
 * including name, description, ability, and points cost.
 */

const { readJsonFile } = require("../utils/read-json-file");
const utilityFunctions = require("./utilityFunctions");

/**
 * Extracts perk information from a single JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Object|null} Perk information object or null if no valid data found
 */
const extractPerkInfo = (filePath) => {
	try {
		const data = readJsonFile(filePath);
		
		if (!data || !Array.isArray(data)) {
			return null;
		}

		let perkName = null;
		let perkDescription = null;
		let perkAbility = null;
		let perkPointsCost = null;

		// Check the second object first (main perk data)
		if (data.length > 1 && data[1]?.Properties) {
			const properties = data[1].Properties;
			
			// Extract name
			if (properties.Name?.LocalizedString) {
				perkName = properties.Name.LocalizedString.trim();
			} else if (properties.Name?.SourceString) {
				perkName = properties.Name.SourceString.trim();
			}
			
			// Extract description
			if (properties.Description?.LocalizedString) {
				perkDescription = properties.Description.LocalizedString.trim();
			} else if (properties.Description?.SourceString) {
				perkDescription = properties.Description.SourceString.trim();
			}
			
			// Extract ability
			if (properties.Perk?.Ability) {
				perkAbility = properties.Perk.Ability.replace("EMistPerkAbility::", "");
			}
			
			// Extract points cost
			if (properties.PointsCost !== undefined) {
				perkPointsCost = properties.PointsCost;
			}
		}

		// Fallback for root perks where name and description might be in the first object
		if (!perkName && data.length > 0 && data[0]?.Properties) {
			const properties = data[0].Properties;
			
			if (properties.Name?.LocalizedString) {
				perkName = properties.Name.LocalizedString.trim();
			} else if (properties.Name?.SourceString) {
				perkName = properties.Name.SourceString.trim();
			}
			
			if (properties.Description?.LocalizedString) {
				perkDescription = properties.Description.LocalizedString.trim();
			} else if (properties.Description?.SourceString) {
				perkDescription = properties.Description.SourceString.trim();
			}
		}

		// Only return perk data if we have a meaningful name
		if (!perkName || perkName === "N/A" || perkName.trim() === "") {
			return null;
		}

		return {
			name: perkName,
			description: perkDescription ?? "N/A",
			ability: perkAbility ?? "N/A",
			pointsCost: perkPointsCost ?? "N/A"
		};

	} catch (error) {
		console.error(`Error parsing perk file ${filePath}:`, error.message);
		return null;
	}
};

/**
 * Parses a perk data file and adds it to the data store
 * @param {string} filePath - Path to the perk JSON file
 */
const parsePerkData = (filePath) => {
	const perkInfo = extractPerkInfo(filePath);
	
	if (perkInfo) {
		utilityFunctions.addPerk(perkInfo);
	}
};

module.exports = {
	extractPerkInfo,
	parsePerkData
};