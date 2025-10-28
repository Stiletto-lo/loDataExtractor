//@ts-nocheck
/**
 * Perk parser for handling perk-related data
 *
 * This module provides functions for parsing and extracting perk information
 * from game data files, specifically focusing on perk abilities, costs, and descriptions.
 */

import { readJsonFile } from "../utils/read-json-file";
import { perkInfoTemplate } from "../../templates/perkInfo";
import * as utilityFunctions from "../fileParsers/utilityFunctions";

/**
 * Extracts perk information from a single JSON file
 * @param {string} filePath - Path to the JSON file containing perk data
 * @returns {Object|null} - Extracted perk information or null if no valid data found
 */
export const extractPerkInfo = (filePath: string) => {
	const data = readJsonFile(filePath);

	if (!data) {
		return undefined;
	}

	const perkInfo = { ...perkInfoTemplate };

	// Assuming the relevant information is in the second object of the JSON array
	if (Array.isArray(data) && data.length > 1 && data[1]?.Properties) {
		const properties = data[1].Properties;

		if (properties.Name?.LocalizedString) {
			perkInfo.name = properties.Name.LocalizedString.trim();
			if (!perkInfo.name) {
				perkInfo.name = properties.Name.SourceString?.trim() ?? undefined;
			}
		}

		if (properties.Description?.LocalizedString) {
			perkInfo.description = properties.Description.LocalizedString.trim();
			if (!perkInfo.description) {
				perkInfo.description =
					properties.Description.SourceString?.trim() ?? undefined;
			}
		}

		if (properties.PointsCost !== undefined) {
			perkInfo.cost = String(properties.PointsCost);
		}
	}

	// Fallback for root perks where name and description might be in the first object
	if (
		!perkInfo.name &&
		Array.isArray(data) &&
		data.length > 0 &&
		data[0]?.Properties
	) {
		const properties = data[0].Properties;

		if (properties.Name?.LocalizedString) {
			perkInfo.name = properties.Name.LocalizedString.trim();
			if (!perkInfo.name) {
				perkInfo.name = properties.Name.SourceString?.trim() ?? undefined;
			}
		}

		if (properties.Description?.LocalizedString) {
			perkInfo.description = properties.Description.LocalizedString.trim();
			if (!perkInfo.description) {
				perkInfo.description =
					properties.Description.SourceString?.trim() ?? undefined;
			}
		}
	}

	if (!perkInfo?.name) {
		return undefined;
	}

	return perkInfo;
};

/**
 * Parses perk data from a JSON file and adds it to the collection
 * @param {string} filePath - Path to the JSON file to parse
 */
export const parsePerkData = (filePath: string) => {
	const perkInfo = extractPerkInfo(filePath);

	if (perkInfo) {
		// Check if perk already exists to avoid duplicates
		const existingPerk = utilityFunctions.getPerkByName(perkInfo?.name ?? "");
		if (!existingPerk) {
			utilityFunctions.addPerk(perkInfo);
		}
	}
};
