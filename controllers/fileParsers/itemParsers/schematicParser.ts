/**
 * Schematic parser functions for handling schematic-related data
 */

import * as dataParser from "../../dataParsers";
import * as translator from "../../translator";
import * as utilityFunctions from "../utilityFunctions";
import { readJsonFile } from "../../utils/read-json-file";

/**
 * Parse schematic item data from a file
 * @param {string} filePath - The file path to parse
 */
export const parseSchematicItemData = (filePath: string) => {
	const jsonData = readJsonFile(filePath);

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

			const itemsSchematic: string[] = [];

			if (jsonData[1].Properties?.MaxStackSize) {
				item.stackSize = jsonData[1].Properties.MaxStackSize;
			}
			if (jsonData[1].Properties?.Items) {
				const allCraftingItems = jsonData[1].Properties.Items;
				for (const schematicItem of allCraftingItems) {
					if (schematicItem.AssetPathName) {
						const itemFound = utilityFunctions.getItemByType(
							dataParser.parseType(schematicItem.AssetPathName),
						);
						if (itemFound) {
							itemsSchematic.push(itemFound.name ?? itemFound.translation);
						} else {
							const schematicItemName = dataParser.parseName(
								translator,
								schematicItem.AssetPathName,
							);
							itemsSchematic.push(schematicItemName);
						}
					}
				}
			}
			if (jsonData[1].Properties?.Placeables) {
				const allCraftingPlaceables = jsonData[1].Properties.Placeables;
				for (const schematicPlaceable of allCraftingPlaceables) {
					if (schematicPlaceable.AssetPathName) {
						const itemFound = utilityFunctions.getItemByType(
							dataParser.parseType(schematicPlaceable.AssetPathName),
						);

						if (itemFound) {
							if (itemFound.name || itemFound.translation) {
								itemsSchematic.push(itemFound.name ?? itemFound.translation);
							}
						} else {
							const schematicPlaceableName = dataParser.parseName(
								translator,
								schematicPlaceable.AssetPathName,
							);
							if (schematicPlaceableName) {
								itemsSchematic.push(schematicPlaceableName);
							}
						}
					}
				}
			}
			if (itemsSchematic.length > 0) {
				item.learn = itemsSchematic;
			}
			utilityFunctions.addItem(item);
		}
	}
};
