/**
 * Item Name Glossary Module
 *
 * This module creates and maintains a glossary mapping between internal item names (from file names)
 * and their actual in-game display names (from the SourceString field).
 */

const path = require("node:path");
const fs = require("node:fs");

// Store the mapping between internal names and display names
const itemNameGlossary = {};

/**
 * Extract the internal name from a file path
 * @param {string} filePath - The full file path
 * @returns {string} - The extracted internal name
 */
const extractInternalNameFromPath = (filePath) => {
	// Get the file name without extension
	const fileName = path.basename(filePath, path.extname(filePath));
	return fileName;
};

/**
 * Process an item JSON file to extract the display name and create a mapping
 * @param {string} filePath - The file path to process
 * @returns {Object|null} - The mapping entry or null if no valid mapping could be created
 */
const processItemFile = (filePath) => {
	try {
		const rawdata = fs.readFileSync(filePath);
		const jsonData = JSON.parse(rawdata);

		// Find the item data in the JSON
		const itemData = jsonData.find(
			(item) =>
				item.Properties?.Name?.SourceString ||
				item.Properties?.TechtreeName?.SourceString,
		);

		if (!itemData) return null;

		const internalName = extractInternalNameFromPath(filePath);

		// First try to get the display name from TechtreeName if available
		let displayName = itemData.Properties?.TechtreeName?.SourceString?.trim();

		// If TechtreeName is not available, fall back to Name
		if (!displayName && itemData.Properties?.Name?.SourceString) {
			displayName = itemData.Properties.Name.SourceString.trim();
		}

		if (internalName && displayName && internalName !== displayName) {
			return { internalName, displayName };
		}

		return null;
	} catch (error) {
		console.warn(
			`Error processing file for glossary: ${filePath}`,
			error.message,
		);
		return null;
	}
};

/**
 * Build the item name glossary by processing all item JSON files
 * @param {string} baseDir - The base directory containing item JSON files
 */
const buildItemNameGlossary = (baseDir) => {
	// Clear existing glossary
	for (const key of Object.keys(itemNameGlossary)) {
		delete itemNameGlossary[key];
	}

	// Process all JSON files recursively
	const processDirectory = (dir) => {
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				processDirectory(fullPath);
			} else if (entry.isFile() && entry.name.endsWith(".json")) {
				// Process the file to extract display name mapping
				const mapping = processItemFile(fullPath);
				if (mapping) {
					itemNameGlossary[mapping.internalName] = mapping.displayName;
				}

				// Special handling for Crafting Categories which contain TechtreeName fields
				if (
					fullPath.includes("Crafting/Categories") ||
					fullPath.includes("Crafting\\Categories")
				) {
					try {
						const rawdata = fs.readFileSync(fullPath);
						const jsonData = JSON.parse(rawdata);

						// Find items with TechtreeName
						const categoryData = jsonData.find(
							(item) =>
								item.Properties?.TechtreeName?.SourceString &&
								item.Properties?.TechtreeName?.Key,
						);

						if (categoryData) {
							// Extract the internal name from the Key field (e.g., "FiberworkingStation.Name" -> "FiberworkingStation")
							const keyParts =
								categoryData.Properties.TechtreeName.Key.split(".");
							if (keyParts.length > 0) {
								const internalName = keyParts[0];
								const displayName =
									categoryData.Properties.TechtreeName.SourceString.trim();

								if (
									internalName &&
									displayName &&
									internalName !== displayName
								) {
									itemNameGlossary[internalName] = displayName;
									console.log(
										`Added TechtreeName mapping: ${internalName} -> ${displayName}`,
									);
								}
							}
						}
					} catch (error) {
						console.warn(
							`Error processing TechtreeName in file: ${fullPath}`,
							error.message,
						);
					}
				}
			}
		}
	};

	try {
		processDirectory(baseDir);
		console.log(
			`Built item name glossary with ${Object.keys(itemNameGlossary).length} entries`,
		);
	} catch (error) {
		console.error("Error building item name glossary:", error);
	}
};

/**
 * Get the display name for an internal name
 * @param {string} internalName - The internal name to look up
 * @returns {string|undefined} - The display name or undefined if not found
 */
const getDisplayName = (internalName) => {
	return itemNameGlossary[internalName];
};

/**
 * Export the entire glossary as a JSON object
 * @returns {Object} - The complete glossary mapping
 */
const getGlossary = () => {
	return { ...itemNameGlossary };
};

/**
 * Save the glossary to a JSON file
 * @param {string} outputPath - The path to save the glossary to
 */
const saveGlossary = (outputPath) => {
	try {
		fs.writeFileSync(
			outputPath,
			JSON.stringify(itemNameGlossary, null, 2),
			"utf8",
		);
		console.log(`Saved item name glossary to ${outputPath}`);
	} catch (error) {
		console.error("Error saving item name glossary:", error);
	}
};

module.exports = {
	buildItemNameGlossary,
	getDisplayName,
	getGlossary,
	saveGlossary,
};
