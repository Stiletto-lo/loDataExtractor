/**
 * Data Parser Module
 * Provides utility functions for parsing and transforming various data formats
 * related to game items, categories, and object paths.
 *
 * @module dataParsers
 */

const dataParser = {};

/**
 * Constants for common string patterns used in parsing
 */
const PATTERNS = {
	TRIM_CHARS: ["'", "_C", "_Q", ".Name", "DataTable", ".0"],
	BLUEPRINT_CLASS: "BlueprintGeneratedClass",
	CATEGORY_PREFIX: "Mist/Content/Mist/Data/Items/Categories/",
	WALKER_CATEGORY: "EMistWalkerCategory::",
};

/**
 * Parses and formats a name string using translation services
 *
 * @param {Object} translator - Translation service object
 * @param {string|null} name - The name to parse
 * @returns {string|undefined} - The parsed and formatted name or undefined if input is null
 */
dataParser.parseName = (translator, name) => {
	if (name == null) {
		return undefined;
	}

	// Convert to string and clean up common patterns
	let nameStr = String(name);
	nameStr = nameStr.replaceAll("'", "").trim();
	nameStr = nameStr.replaceAll(".Name", "").trim();
	nameStr = dataParser.parseType(nameStr);
	nameStr = nameStr.replaceAll("_C", "").trim();
	nameStr = nameStr.replaceAll("_Q", "").trim();
	nameStr = nameStr.replaceAll("DataTable", "").trim();

	// Apply translation if available
	const translateName = translator.translateName(nameStr);
	if (translateName != null) {
		nameStr = translateName;
	}

	// Special case handling for different item types
	if (!nameStr.includes("Schematic")) {
		nameStr = dataParser.parseSpecialItemName(translator, nameStr);
	}

	// Parse rig name if applicable
	nameStr = dataParser.parseRigName(translator, nameStr);

	return nameStr.trim();
};

/**
 * Parses special item names like legs, wings, and upgrades
 *
 * @param {Object} translator - Translation service object
 * @param {string} name - The name to parse
 * @returns {string} - The parsed special item name
 * @private
 */
dataParser.parseSpecialItemName = (translator, name) => {
	if (/(.+)Legs/.test(name)) {
		return dataParser.parseLegsName(translator, name);
	}

	if (/(.+)Wings/.test(name)) {
		return dataParser.parseWingsName(translator, name);
	}

	if (name.includes("Upgrades")) {
		return dataParser.parseUpgradesName(translator, name);
	}

	return name;
};

/**
 * Parses legs item names
 *
 * @param {Object} translator - Translation service object
 * @param {string} name - The name to parse
 * @returns {string} - The parsed legs name
 * @private
 */
dataParser.parseLegsName = (translator, name) => {
	const match = RegExp(/(.+)Legs/).exec(name);
	if (match?.[1]) {
		const walkerName = translator.translateName(`${match[1].trim()} Walker`);
		let legType = "";

		if (name.includes("_T2")) {
			legType = "Armored";
		} else if (name.includes("_T3")) {
			legType = "Heavy";
		}

		const legsName = `${walkerName.trim()} Legs ${legType}`.trim();

		return `${legsName} (1 of 2)`;
	}
	return name;
};

/**
 * Parses wings item names
 *
 * @param {Object} translator - Translation service object
 * @param {string} name - The name to parse
 * @returns {string} - The parsed wings name
 * @private
 */
dataParser.parseWingsName = (translator, name) => {
	const match = RegExp(/(.+)Wings/).exec(name);
	if (match?.[1]) {
		const walkerName = translator.translateName(`${match[1].trim()} Walker`);

		const wingsType = dataParser.determineWingsType(name);
		const wingsName = `${walkerName.trim()} ${wingsType}`.trim();

		return `${wingsName} (1 of 2)`;
	}
	return name;
};

/**
 * Determines the type of wings based on name patterns
 *
 * @param {string} name - The name containing wing type information
 * @returns {string} - The determined wings type
 * @private
 */
dataParser.determineWingsType = (name) => {
	if (name.includes("_T2_Small")) {
		return "Wings Small";
	}
	if (name.includes("_T3_Medium")) {
		return "Wings Medium";
	}
	if (name.includes("_T4")) {
		return "Wings Large";
	}
	if (name.includes("_T2_Heavy")) {
		return "Wings Heavy";
	}
	if (name.includes("_T3_Rugged")) {
		return "Wings Rugged";
	}
	if (name.includes("_T2_Skirmish")) {
		return "Wings Skirmish";
	}
	if (name.includes("_T3_Raider")) {
		return "Wings Raider";
	}
	return "Wings";
};

/**
 * Parses upgrades item names
 *
 * @param {Object} translator - Translation service object
 * @param {string} name - The name to parse
 * @returns {string} - The parsed upgrades name
 * @private
 */
dataParser.parseUpgradesName = (translator, name) => {
	const upgradePatterns = [
		{ pattern: /(.+)BoneUpgrades/, tier: "Tier 2" },
		{ pattern: /(.+)CeramicUpgrades/, tier: "Tier 3" },
		{ pattern: /(.+)IronUpgrades/, tier: "Tier 4" },
		{ pattern: /(.+)WoodUpgrades/, tier: "" },
	];

	for (const { pattern, tier } of upgradePatterns) {
		const match = RegExp(pattern).exec(name);
		if (match?.[1]) {
			const walkerName = translator.translateName(`${match[1].trim()} Walker`);
			return tier ? `${walkerName} Upgrades - ${tier}` : walkerName;
		}
	}

	return name;
};

/**
 * Parses and cleans a type string
 *
 * @param {string} name - The type string to parse
 * @returns {string} - The parsed type
 */
dataParser.parseType = (name) => {
	let nameStr = name.replace(PATTERNS.BLUEPRINT_CLASS, "").trim();
	nameStr = nameStr.replace(".0", "").trim();

	const dot = nameStr.indexOf(".");
	if (dot > 0) {
		nameStr = nameStr.slice(dot + 1);
	}

	return nameStr;
};

/**
 * Parses and formats a category string
 *
 * @param {string|null} category - The category string to parse
 * @returns {string|null} - The parsed category or null if input is null
 */
dataParser.parseCategory = (category) => {
	if (!category) {
		return category;
	}

	let categoryStr = category.replace(PATTERNS.CATEGORY_PREFIX, "").trim();
	categoryStr = categoryStr.replace(PATTERNS.WALKER_CATEGORY, "").trim();
	categoryStr = categoryStr.replace(".0", "").trim();

	return categoryStr;
};

/**
 * Extracts the last part of an object path
 *
 * @param {string|null} objectName - The object path to parse
 * @returns {string|null} - The extracted object name or null if input is null
 */
dataParser.parseObjectPath = (objectName) => {
	if (!objectName) {
		return objectName;
	}

	const objectNameArray = objectName.split("/");
	const last = objectNameArray[objectNameArray.length - 1];
	return last.replace(".0", "").trim();
};

/**
 * Parses and formats a rig name
 *
 * @param {Object} translator - Translation service object
 * @param {string} name - The name to parse
 * @returns {string} - The parsed rig name
 */
dataParser.parseRigName = (translator, name) => {
	let nameStr = name;

	if (nameStr.includes("Rig") && /(.+)Rig_/.test(nameStr)) {
		const rig = dataParser.determineRigTier(nameStr);

		if (nameStr.includes("Default")) {
			nameStr = nameStr.replaceAll("Default", "").trim();
		}

		const match = RegExp(/(.+)Rig_/).exec(nameStr);
		if (match?.[1]) {
			const walkerName = translator.translateName(`${match[1]} Walker`);
			return `${walkerName} Rig ${rig}`;
		}
	}

	return nameStr.trim();
};

/**
 * Determines the tier of a rig based on name patterns
 *
 * @param {string} name - The name containing rig tier information
 * @returns {string} - The determined rig tier
 * @private
 */
dataParser.determineRigTier = (name) => {
	if (name.includes("2")) {
		return "T2";
	}

	if (name.includes("T1")) {
		return "T1";
	}

	if (name.includes("T3")) {
		return "T3";
	}

	return "";
};

/**
 * Parses and formats a structure name based on its category
 *
 * @param {string} category - The structure category
 * @param {string} name - The structure name
 * @returns {string} - The parsed structure name
 */
dataParser.parseStructureName = (category, name) => {
	const structureTypes = {
		Sand: "Sand",
		Concrete: "Cement",
		WoodLight: "Light Wood",
		Ceramic: "Clay",
		Clay: "Clay",
		StoneNew: "Stone",
		WoodHeavy: "Heavy Wood",
		WoodMedium: "Medium Wood",
	};

	let type = "";
	for (const [key, value] of Object.entries(structureTypes)) {
		if (category.includes(key)) {
			type = value;
			break;
		}
	}

	return `${type} ${name}`.trim();
};

/**
 * Parses and formats an upgrade name
 *
 * @param {string|null} name - The upgrade name
 * @param {string|null} profile - The upgrade profile
 * @returns {string} - The parsed upgrade name
 */
dataParser.parseUpgradeName = (name, profile) => {
	if (profile == null) {
		return "";
	}

	const sparePartsProfiles = [
		"BaseSparePartsProfile",
		"MediumSparePartsProfile",
		"LargeSparePartsProfile",
		"SmallSparePartsProfile",
	];

	// Return profile as is for special spare parts profiles
	for (const profileType of sparePartsProfiles) {
		if (profile.includes(profileType)) {
			return profile;
		}
	}

	const walkerName = profile.replaceAll("SparePartsProfile", "").trim();
	let tier = 1;
	let type = "Water";

	if (name != null) {
		// Determine tier based on material
		tier = dataParser.determineUpgradeTier(name);
		// Determine type based on functionality
		type = dataParser.determineUpgradeType(name);
	}

	return `${walkerName} Walker Upgrade - ${type} - Tier ${tier}`;
};

/**
 * Determines the tier of an upgrade based on name patterns
 *
 * @param {string} name - The name containing upgrade tier information
 * @returns {number} - The determined upgrade tier
 * @private
 */
dataParser.determineUpgradeTier = (name) => {
	if (name.includes("Wood")) {
		return 1;
	}
	if (name.includes("Bone")) {
		return 2;
	}
	if (name.includes("Ceramic")) {
		return 3;
	}
	if (name.includes("Iron")) {
		return 4;
	}
	return 1; // Default to tier 1
};

/**
 * Determines the type of an upgrade based on name patterns
 *
 * @param {string} name - The name containing upgrade type information
 * @returns {string} - The determined upgrade type
 * @private
 */
dataParser.determineUpgradeType = (name) => {
	const upgradeTypes = {
		Cargo: "Cargo",
		Hatch: "Gear",
		Water: "Water",
		Torque: "Torque",
		Gears: "Mobility",
		Armor: "Durability",
		Packing: "Packing",
	};

	for (const [key, value] of Object.entries(upgradeTypes)) {
		if (name.includes(key)) {
			return value;
		}
	}

	return "Water"; // Default to Water type
};

/**
 * Merges two items from an array based on their names
 *
 * @param {Array} allItems - Array of items
 * @param {string} mainItemName - Name of the main item
 * @param {string} otherItemName - Name of the other item to merge
 * @returns {Array} - Array with merged items
 */
dataParser.itemMerger = (allItems, mainItemName, otherItemName) => {
	const mainItem = allItems.find(
		(item) => item.name && item.name === mainItemName,
	);
	const otherItem = allItems.find(
		(item) => item.name && item.name === otherItemName,
	);

	const allItemsFiltered = allItems.filter(
		(item) =>
			item.name && item.name !== otherItemName && item.name !== mainItemName,
	);

	if (mainItem && otherItem) {
		const newItem = { ...mainItem };

		for (const key in otherItem) {
			if (otherItem[key] && !mainItem[key]) {
				newItem[key] = otherItem[key];
			}
		}

		allItemsFiltered.push(newItem);
	} else if (mainItem) {
		allItemsFiltered.push(mainItem);
	} else if (otherItem) {
		allItemsFiltered.push(otherItem);
	}

	return allItemsFiltered;
};

/**
 * Removes null and undefined properties from an object
 *
 * @param {Object|null} obj - The object to clean
 * @returns {Object|null} - The cleaned object or null if empty
 */
dataParser.cleanEmptyObject = (obj) => {
	if (!obj) {
		return null;
	}

	for (const key of Object.keys(obj)) {
		if (obj[key] === undefined || obj[key] === null) {
			delete obj[key];
		}
	}

	return Object.keys(obj).length > 0 ? obj : null;
};

module.exports = dataParser;
