/**
 * Perk parser for handling perk-related data
 *
 * This module provides functions for parsing and extracting perk information
 * from game data files, specifically focusing on perk abilities, costs, and descriptions.
 */

import { readJsonFile } from "../utils/read-json-file";
import type { PerkInfo } from "../../templates/perkInfo";
import * as utilityFunctions from "../fileParsers/utilityFunctions";

/**
 * Extracts perk information from a single JSON file
 * @param {string} filePath - Path to the JSON file containing perk data
 * @param {string} section - The section this perk belongs to
 * @returns {Object|null} - Extracted perk information or null if no valid data found
 */
export const extractPerkInfo = (filePath: string, section?: string) => {
	const data = readJsonFile(filePath);

	if (!data) {
		return undefined;
	}

	const perkInfo: PerkInfo = { section };

	// Extract type from first object
	if (Array.isArray(data) && data.length > 0 && data[0].Name) {
		perkInfo.type = data[0].Name;
	}

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
			perkInfo.cost = Number(properties.PointsCost);
		}

		// Extract requirement
		const requirement = properties.Requirements?.[0]?.ObjectName || properties.CachedDependency?.ObjectName;
		if (requirement) {
			const match = requirement.match(/([a-zA-Z0-9_]+_C)/);
			if (match) {
				perkInfo.requirementType = match[1];
			}
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

	if (!perkInfo?.name || perkInfo.name === " ") {
		// Even if name is empty, we might need it for type mapping if it has a type
		if (perkInfo.type) {
			return perkInfo;
		}
		return undefined;
	}

	return perkInfo;
};

/**
 * Parses perk data from a JSON file and adds it to the collection
 * @param {string} filePath - Path to the JSON file to parse
 */
export const parsePerkData = (filePath: string) => {
	// Extract section from folder name
	const pathParts = filePath.split(/[\\/]/);
	const section = pathParts[pathParts.length - 2];

	const perkInfo = extractPerkInfo(filePath, section);

	if (perkInfo) {
		// Check if perk already exists to avoid duplicates
		const existingPerk = utilityFunctions.getPerkByName(perkInfo?.name ?? "");
		if (!existingPerk) {
			utilityFunctions.addPerk(perkInfo);
		}
	}
};

/**
 * Resolves parent perk names based on requirements
 */
export const resolvePerkParents = () => {
	const perks = utilityFunctions.getAllPerks() as PerkInfo[];
	const typeToName = new Map<string, string>();

	// First pass: build type to name map
	for (const perk of perks) {
		if (perk.type && perk.name && perk.name !== " ") {
			typeToName.set(perk.type, perk.name);
		}
	}

	// Second pass: resolve parents
	for (const perk of perks) {
		if (perk.requirementType) {
			const parentName = typeToName.get(perk.requirementType);
			if (parentName) {
				perk.parent = parentName;
			} else if (perk.requirementType.toLowerCase().includes("root") || !parentName) {
				// If parent name not found or is a root, use section name
				perk.parent = perk.section;
			}
		} else if (!perk.parent && perk.section && perk.name && perk.name !== " ") {
			// Fallback for perks without requirementType but in a section
			// Actually, if it has no requirementType it might be the first one
			// but usually they all have ArtilleristRoot_C as requirement
		}
	}

	// Clean up internal fields and filter out "root" perks
	const filteredPerks = perks
		.filter(p => p.name && p.name !== " ")
		.map(p => {
			const { type, requirementType, ...rest } = p;
			return rest;
		});

	utilityFunctions.setPerks(filteredPerks);
};
