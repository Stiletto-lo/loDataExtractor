/**
 * Tech Tree Name Normalizer
 *
 * This module provides a comprehensive mapping system to normalize tech tree item names
 * and ensure consistent parent-child relationships in the tech tree visualization.
 * It resolves naming inconsistencies between internal names and display names.
 */

const techTreeNameNormalizer = {};

// Basic mappings from internal names to canonical display names
techTreeNameNormalizer.internalToCanonical = {
	// Basic tech categories
	BasicCrafting: "Basic Crafting",
	BasicTools: "Basic Tools",
	BasicWeapons: "Basic Weapons",
	BasicWalkerEquipment: "Steering Levers",
	BasicWalkerUpgrades: "Basic Walker Upgrades",
	BasicStructures: "Basic Structures",
	AdvancedCrafting: "Advanced Crafting",
	AdvancedTools: "Advanced Tools",
	AdvancedWeapons: "Advanced Weapons",
	AdvancedWalkerEquipment: "Advanced Walker Equipment",
	AdvancedWalkerUpgrades: "Advanced Walker Upgrades",
	AdvancedStructures: "Advanced Structures",

	// Backpacks
	SimpleBackpacks: "Light Backpack",
	ImprovedBackpacks: "Medium Backpack",
	AdvancedBackpacks: "Heavy Backpack",

	// Water and resources
	WaterFiltration: "Purification Station",
	SimpleWaterPurification: "Purified Water",
	SulfurWaterPurification: "Liquid Fuel",
	ClayExtraction: "Clay",
	BoneGlueProduction: "Bone Glue",
	Resin: "Earth Wax",

	// Walkers
	SpiderWalker: "Spider Walker",
	FireflyWalker: "Firefly Walker",
	TobogganWalker: "Toboggan Walker",
	StilettWalker: "Stiletto Walker",
	FalcoWalker: "Falco Walker",
	SchmettWalker: "Schmetterling Walker",
	BirdWalker: "Raptor Sky Walker",
	HornetWalker: "Hornet Walker",
	TitanWalker: "Titan Walker",

	// Projectiles and weapons
	BoneProjectiles: "Bone Bolt",
	CeramicProjectiles: "Ceramic-Tipped Bolt",
	MetalProjectiles: "Iron-Tipped Bolt",
	ExplosiveBolt: "Explosive Bolt",
	ExplosiveDart: "Explosive Dart",
	FloatingMine: "Floating Mine",
	Flare: "Flare - White",

	// Structures
	WoodenWallsLight: "Light Wood Structures",
	WoodenWallsMedium: "Medium Wood Structures",
	WoodenWallsHeavy: "Heavy Wood Structures",
	StoneStructures: "Stone Structures",
	ClayStructures: "Clay Structures",
	CementFoundation: "Cement Structures",

	// Decorations
	Flags: "Flag 1",
	Baskets: "Basket Tall",
	Carpets: "Carpet Light",
	LampsHanging: "Lamp Double Hanging",
	LampsOverhanging: "Lamp Overhanging",
	LampsStanding: "Lamp Standing",
	GiantWalls: "Giant Wall",

	// Additional mappings for common inconsistencies
	EquipmentRoot: "Equipment",
	CraftingRoot: "Crafting",
	WalkersRoot: "Walkers",
	ConstructionRoot: "Construction",
	VitaminsRoot: "Vitamins",
	WalkerBarriers: "Barrier Base",
	SpiderWalkerNomad: "Nomad Spider Walker",
	SpiderWalkerBallista: "Spider Walker With Ballista",
};

// Reverse mapping from canonical names to internal names
techTreeNameNormalizer.canonicalToInternal = {};

// Build the reverse mapping
for (const [internal, canonical] of Object.entries(
	techTreeNameNormalizer.internalToCanonical,
)) {
	techTreeNameNormalizer.canonicalToInternal[canonical] = internal;
}

/**
 * Normalizes a tech tree item name to its canonical form
 * @param {string} name - The name to normalize
 * @returns {string} - The normalized name
 */
techTreeNameNormalizer.normalize = function (name) {
	if (!name) return "";

	// If the name is an internal name, convert to canonical
	if (this.internalToCanonical[name]) {
		return this.internalToCanonical[name];
	}

	// If the name is already canonical, return it
	if (Object.values(this.internalToCanonical).includes(name)) {
		return name;
	}

	// Otherwise, return the original name
	return name;
};

/**
 * Gets the internal name for a canonical name
 * @param {string} canonicalName - The canonical name
 * @returns {string|null} - The internal name or null if not found
 */
techTreeNameNormalizer.getInternalName = function (canonicalName) {
	return this.canonicalToInternal[canonicalName] || null;
};

module.exports = techTreeNameNormalizer;
