/**
 * Tech parser functions for handling tech-related data
 */

const fs = require("node:fs");
const dataParser = require("../../dataParsers");
const translator = require("../../translator");
const utilityFunctions = require("../utilityFunctions");

/**
 * Parse tech data from a file
 * @param {string} filePath - The file path to parse
 */
const parseTechData = (filePath) => {
	const SHOW_DEV_ITEMS = process.env.SHOW_DEV_ITEMS === "true";

	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);

	if (jsonData?.[1]?.Type) {
		const item = utilityFunctions.extractItemByType(jsonData[1].Type);

		// Extract parent data
		if (jsonData?.[1]?.Properties?.Requirements?.[0]?.ObjectName) {
			// Use specialized tech tree parent translation to ensure consistent parent-child relationships
			item.parent = translator.translateTechTreeParent(
				dataParser.parseName(
					translator,
					jsonData[1].Properties.Requirements[0].ObjectName,
				),
			);
		}

		if (jsonData[1]?.Properties?.Cost !== undefined) {
			const itemCost = { ...require("../../../templates/cost") };
			if (
				jsonData[1].Properties.TechTreeTier &&
				(jsonData[1].Properties.TechTreeTier.includes("Tier4") ||
					jsonData[1].Properties.TechTreeTier.includes("Tier5") ||
					jsonData[1].Properties.TechTreeTier.includes("Tier6"))
			) {
				itemCost.name = "Tablet";
			} else {
				itemCost.name = "Fragment";
			}
			itemCost.count = jsonData[1].Properties.Cost;

			// Ensure cost data is properly set
			item.cost = itemCost;
		}

		if (jsonData[1]?.Properties?.bHidden) {
			item.onlyDevs = true;
		}

		if (jsonData[1]?.Properties?.bHidden && !SHOW_DEV_ITEMS) {
			item.parent = undefined;
		}
		if (item.name) {
			if (item.name.includes("Upgrades")) {
				item.category = "Upgrades";
			} else if (item.name.includes("Hook")) {
				item.category = "Grappling Hooks";
			}
		}

		utilityFunctions.getAllItems().push(item);
	}
};

module.exports = {
	parseTechData,
};
