/**
 * Schematic parser functions for handling schematic-related data
 */

const fs = require("node:fs");
const dataParser = require("../../dataParsers");
const translator = require("../../translator");
const utilityFunctions = require("../utilityFunctions");

/**
 * Parse schematic item data from a file
 * @param {string} filePath - The file path to parse
 */
const parseSchematicItemData = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);

	if (jsonData?.[1]?.Type) {
		const item = utilityFunctions.extractItemByType(jsonData[1].Type);
		let name;
		if (jsonData[1].Properties?.Name?.Key) {
			name = jsonData[1].Properties.Name.Key;
			name = name.replaceAll(".Name", "").trim();
			name = translator.searchName(name);
		}
		if (name == null) {
			if (jsonData[1].Type.includes("Rig")) {
				name = dataParser.parseName(translator, jsonData[1].Type);
			} else if (
				jsonData[1].Properties?.Name?.SourceString &&
				jsonData[1].Properties.Name.SourceString.length > 0
			) {
				name = jsonData[1].Properties.Name.SourceString;
				name = name.trim();
			} else {
				name = dataParser.parseType(jsonData[1].Type);

				const foundItem = utilityFunctions.getItemByType(name);
				if (foundItem?.name) {
					name = foundItem.name;
				}
			}
		}
		if (name) {
			if (!name.includes("Schematic")) {
				name = `${name} Schematic`;
			}
			item.name = name;
		}

		if (jsonData[1].Properties) {
			item.category = "Schematics";

			const itemsSchematic = [];

			if (jsonData[1].Properties?.MaxStackSize) {
				item.stackSize = jsonData[1].Properties.MaxStackSize;
			}
			if (jsonData[1].Properties?.Items) {
				const allCraftingItems = jsonData[1].Properties.Items;
				allCraftingItems.forEach((schematicItem) => {
					if (schematicItem.AssetPathName) {
						const itemFound = utilityFunctions.getItemByType(
							dataParser.parseType(schematicItem.AssetPathName),
						);
						if (itemFound) {
							itemsSchematic.push(itemFound.name);
						} else {
							const schematicItemName = dataParser.parseName(
								translator,
								schematicItem.AssetPathName,
							);
							itemsSchematic.push(schematicItemName);
						}
					}
				});
			}
			if (jsonData[1].Properties?.Placeables) {
				const allCraftingPlaceables = jsonData[1].Properties.Placeables;
				allCraftingPlaceables.forEach((schematicPlaceable) => {
					if (schematicPlaceable.AssetPathName) {
						const itemFound = utilityFunctions.getItemByType(
							dataParser.parseType(schematicPlaceable.AssetPathName),
						);
						if (itemFound) {
							itemsSchematic.push(itemFound.name);
						} else {
							const schematicPlaceableName = dataParser.parseName(
								translator,
								schematicPlaceable.AssetPathName,
							);
							itemsSchematic.push(schematicPlaceableName);
						}
					}
				});
			}
			if (itemsSchematic.length > 0) {
				item.learn = itemsSchematic;
				utilityFunctions.getAllItems().push(item);
			}
		}
	}
};

module.exports = {
	parseSchematicItemData,
};
