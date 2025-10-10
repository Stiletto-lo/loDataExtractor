/**
 * Perk parser for handling perk-related data
 * 
 * This module provides functions for parsing and extracting perk information
 * from game data files, specifically focusing on perk abilities, costs, and descriptions.
 */

const { readJsonFile } = require("../utils/read-json-file");

// Store all parsed perks
let allPerks = [];

/**
 * Extracts perk information from a single JSON file
 * @param {string} filePath - Path to the JSON file containing perk data
 * @returns {Object|null} - Extracted perk information or null if no valid data found
 */
const extractPerkInfo = (filePath) => {
	const data = readJsonFile(filePath);

	if (!data) {
		return null;
	}

	let perkName = "N/A";
	let perkDescription = "N/A";
	let perkAbility = "N/A";
	let perkPointsCost = "N/A";

	// Assuming the relevant information is in the second object of the JSON array
	if (Array.isArray(data) && data.length > 1 && data[1]?.Properties) {
		const properties = data[1].Properties;
		
		if (properties.Name?.LocalizedString) {
			perkName = properties.Name.LocalizedString.trim();
			if (!perkName) { // If LocalizedString is empty, try SourceString
				perkName = properties.Name.SourceString?.trim() ?? "N/A";
			}
		}
		
		if (properties.Description?.LocalizedString) {
			perkDescription = properties.Description.LocalizedString.trim();
			if (!perkDescription) { // If LocalizedString is empty, try SourceString
				perkDescription = properties.Description.SourceString?.trim() ?? "N/A";
			}
		}
		
		if (properties.Perk?.Ability) {
			perkAbility = properties.Perk.Ability.replace("EMistPerkAbility::", "");
		}
		
		if (properties.PointsCost !== undefined) {
			perkPointsCost = String(properties.PointsCost);
		}
	}

	// Fallback for root perks where name and description might be in the first object
	if (perkName === "N/A" && Array.isArray(data) && data.length > 0 && data[0]?.Properties) {
		const properties = data[0].Properties;
		
		if (properties.Name?.LocalizedString) {
			perkName = properties.Name.LocalizedString.trim();
			if (!perkName) {
				perkName = properties.Name.SourceString?.trim() ?? "N/A";
			}
		}
		
		if (properties.Description?.LocalizedString) {
			perkDescription = properties.Description.LocalizedString.trim();
			if (!perkDescription) {
				perkDescription = properties.Description.SourceString?.trim() ?? "N/A";
			}
		}
	}

	// Only return perk data if we found a meaningful name
	if (perkName && perkName !== "N/A" && perkName.trim() !== "") {
		return {
			name: perkName,
			description: perkDescription,
			ability: perkAbility,
			pointsCost: perkPointsCost
		};
	}

	return null;
};

/**
 * Parses perk data from a JSON file and adds it to the collection
 * @param {string} filePath - Path to the JSON file to parse
 */
const parsePerkData = (filePath) => {
	const perkInfo = extractPerkInfo(filePath);
	
	if (perkInfo) {
		// Check if perk already exists to avoid duplicates
		const existingPerk = allPerks.find(perk => perk.name === perkInfo.name);
		if (!existingPerk) {
			allPerks.push(perkInfo);
		}
	}
};

/**
 * Gets all parsed perks
 * @returns {Array} - Array of all parsed perk objects
 */
const getAllPerks = () => {
	return allPerks;
};

/**
 * Sets the perks data (used for initialization or testing)
 * @param {Array} perks - Array of perk objects to set
 */
const setAllPerks = (perks) => {
	allPerks = perks ?? [];
};

/**
 * Gets a specific perk by name
 * @param {string} name - Name of the perk to find
 * @returns {Object|null} - Perk object or null if not found
 */
const getPerkByName = (name) => {
	return allPerks.find(perk => perk.name === name) ?? null;
};

/**
 * Gets perks by ability type
 * @param {string} ability - Ability type to filter by
 * @returns {Array} - Array of perks with the specified ability
 */
const getPerksByAbility = (ability) => {
	return allPerks.filter(perk => perk.ability === ability);
};

/**
 * Clears all stored perk data
 */
const clearPerks = () => {
	allPerks = [];
};

module.exports = {
	extractPerkInfo,
	parsePerkData,
	getAllPerks,
	setAllPerks,
	getPerkByName,
	getPerksByAbility,
	clearPerks
};