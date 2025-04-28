/**
 * Unified Tech Tree Names
 *
 * This module provides a comprehensive system for handling tech tree item name variants
 * and normalization to ensure consistent parent-child relationships in the tech tree visualization.
 *
 * It combines the functionality of both techTreeNameVariants.js and techTreeNameNormalizer.js
 * into a single, more maintainable solution that handles all name mapping needs.
 */

const unifiedTechTreeNames = {};

// Main mapping object for all tech tree name variants
unifiedTechTreeNames.nameMap = {
	// Basic tech categories with _C suffix variants
	BasicCrafting: "Basic Crafting",
	BasicCrafting_C: "Basic Crafting",
	BasicTools: "Basic Tools",
	BasicTools_C: "Basic Tools",
	BasicWeapons: "Basic Weapons",
	BasicWeapons_C: "Basic Weapons",
	BasicWalkerEquipment: "Steering Levers",
	BasicWalkerEquipment_C: "Steering Levers",
	BasicWalkerUpgrades: "Basic Walker Upgrades",
	BasicWalkerUpgrades_C: "Basic Walker Upgrades",
	BasicStructures: "Basic Structures",
	BasicStructures_C: "Basic Structures",
	AdvancedCrafting: "Advanced Crafting",
	AdvancedCrafting_C: "Advanced Crafting",
	AdvancedTools: "Advanced Tools",
	AdvancedTools_C: "Advanced Tools",
	AdvancedWeapons: "Advanced Weapons",
	AdvancedWeapons_C: "Advanced Weapons",
	AdvancedWalkerEquipment: "Advanced Walker Equipment",
	AdvancedWalkerEquipment_C: "Advanced Walker Equipment",
	AdvancedWalkerUpgrades: "Advanced Walker Upgrades",
	AdvancedWalkerUpgrades_C: "Advanced Walker Upgrades",
	AdvancedStructures: "Advanced Structures",
	AdvancedStructures_C: "Advanced Structures",

	// Backpacks
	SimpleBackpacks: "Light Backpack",
	SimpleBackpacks_C: "Light Backpack",
	ImprovedBackpacks: "Medium Backpack",
	ImprovedBackpacks_C: "Medium Backpack",
	AdvancedBackpacks: "Heavy Backpack",
	AdvancedBackpacks_C: "Heavy Backpack",
	SmallBackpack: "Light Backpack",

	// Water and resources
	WaterFiltration: "Purification Station",
	WaterFiltration_C: "Purification Station",
	PurificationStation: "Purification Station",
	SimpleWaterPurification: "Purified Water",
	SimpleWaterPurification_C: "Purified Water",
	Water_T1: "Purified Water",
	SulfurWaterPurification: "Liquid Fuel",
	SulfurWaterPurification_C: "Liquid Fuel",
	ClayExtraction: "Clay",
	ClayExtraction_C: "Clay",
	ClayLump: "Clay",
	BoneGlueProduction: "Bone Glue",
	BoneGlueProduction_C: "Bone Glue",
	BoneGlue: "Bone Glue",
	Resin: "Earth Wax",
	Resin_C: "Earth Wax",
	EarthWax: "Earth Wax",

	// Walkers
	SpiderWalker: "Spider Walker",
	SpiderWalker_C: "Spider Walker",
	FireflyWalker: "Firefly Walker",
	FireflyWalker_C: "Firefly Walker",
	TobogganWalker: "Toboggan Walker",
	TobogganWalker_C: "Toboggan Walker",
	StilettWalker: "Stiletto Walker",
	StilettWalker_C: "Stiletto Walker",
	FalcoWalker: "Falco Walker",
	FalcoWalker_C: "Falco Walker",
	SchmettWalker: "Schmetterling Walker",
	SchmettWalker_C: "Schmetterling Walker",
	BirdWalker: "Raptor Sky Walker",
	BirdWalker_C: "Raptor Sky Walker",
	HornetWalker: "Hornet Walker",
	HornetWalker_C: "Hornet Walker",
	TitanWalker: "Titan Walker",
	TitanWalker_C: "Titan Walker",
	SpiderWalkerNomad: "Nomad Spider Walker",
	SpiderWalkerNomad_C: "Nomad Spider Walker",
	SpiderWalkerBallista: "Spider Walker With Ballista",
	SpiderWalkerBallista_C: "Spider Walker With Ballista",
	DesertMule: "Desert Mule",

	// Projectiles and weapons
	BoneProjectiles: "Bone Bolt",
	BoneProjectiles_C: "Bone Bolt",
	BoneBolt: "Bone Bolt",
	CeramicProjectiles: "Ceramic-Tipped Bolt",
	CeramicProjectiles_C: "Ceramic-Tipped Bolt",
	CeramicBolt: "Ceramic Bolt",
	MetalProjectiles: "Iron-Tipped Bolt",
	MetalProjectiles_C: "Iron-Tipped Bolt",
	ExplosiveBolt: "Explosive Bolt",
	ExplosiveBolt_C: "Explosive Bolt",
	ExplosiveDart: "Explosive Dart",
	ExplosiveDart_C: "Explosive Dart",
	FloatingMine: "Floating Mine",
	FloatingMine_C: "Floating Mine",
	Flare: "Flare - White",
	Flare_C: "Flare - White",
	Balista: "Ballista",
	ScattershotGun: "Scattershot Gun",
	FiberHeadwrap: "Fiber Headwrap",

	WoodenClub: "Beat Stick",
	OneHandedStoneClub: "Jaggertooth Club",
	TwoHandedStoneMace: "Jaggertooth Maul",
	TwoHandedBoneMace: "Rawbone Maul",
	TwoHandedBonespikedClub: "Rawbone Maul (Spiked)",
	TwoHandedZirconiumMace: "Long Ceramic Hoofmace",
	TwoHandedIronMaul2: "Wyndan Warhammer",
	TwoHandedRareMetalMace2: "Nibirian Warhammer",
	BoneClub: "Nurrfang Toothclub",
	BoneMace: "Rawbone Club",
	OneHandedZirconiumMace: "Short Ceramic Hoofmace",
	LavaQuarterstaffBlunt: "Firestone Hammerstaff",
	OneHandedLavaMace: "Firestone Bludgeon",
	TwoHandedLavaMace: "Firestone Bozdogan",
	OneHandedIronMace2: "Wyndan Hammer",
	OneHandedTitaniumMace2: "Nibirian Hammer",

	// Melee weapons - Staves and Axes
	ShortQuarterstaff: "Blunt Quarterstaff",
	TravellersStaff: "Traveller's Quarterstaff",
	TwoHandedBoneAxe: "Rawbone Battle Axe",
	TwoHandedLavaAxe: "Firestone Battle Axe",
	TwoHandedIronAxe2: "Wyndan Battle Axe",
	TwoHandedRareMetalAxe2: "Nibirian Battle Axe",
	OneHandedBoneSword: "Bonespike Sword",
	TwoHandedBoneSword: "Long Bonespike Swordstaff",

	// Throwable weapons
	Javelin: "Light Javelin",
	HeavyJavelin: "Heavy Javelin",
	BombJavelin: "Bomb Javelin",
	ThrowableSmokeBomb: "Throwable Smoke Bomb (Gas)",
	ThrowableAloeBomb: "Throwable Aloe Bomb",
	ThrowableInsectBomb: "Throwable Insect Bomb",
	ThrowingLavaBomb: "Fire Bomb",

	// Structures
	WoodenWallsLight: "Light Wood Structures",
	WoodenWallsLight_C: "Light Wood Structures",
	WoodenWallsMedium: "Medium Wood Structures",
	WoodenWallsMedium_C: "Medium Wood Structures",
	ReinforcedWalls: "Medium Wood Walls",
	WoodenWallsHeavy: "Heavy Wood Structures",
	WoodenWallsHeavy_C: "Heavy Wood Structures",
	StoneStructures: "Stone Structures",
	StoneStructures_C: "Stone Structures",
	ClayStructures: "Clay Structures",
	ClayStructures_C: "Clay Structures",
	CementFoundation: "Cement Structures",
	CementFoundation_C: "Cement Structures",
	SandWalls: "Sand Structures",
	GiantWalls: "Giant Wall",
	GiantWalls_C: "Giant Wall",

	// Decorations
	Flags: "Flag 1",
	Flags_C: "Flag 1",
	Baskets: "Basket Tall",
	Baskets_C: "Basket Tall",
	Carpets: "Carpet Light",
	Carpets_C: "Carpet Light",
	LampsHanging: "Lamp Double Hanging",
	LampsHanging_C: "Lamp Double Hanging",
	LampsOverhanging: "Lamp Overhanging",
	LampsOverhanging_C: "Lamp Overhanging",
	LampsStanding: "Lamp Standing",
	LampsStanding_C: "Lamp Standing",

	// Root categories
	EquipmentRoot: "Equipment",
	EquipmentRoot_C: "Equipment",
	CraftingRoot: "Crafting",
	CraftingRoot_C: "Crafting",
	WalkersRoot: "Walkers",
	WalkersRoot_C: "Walkers",
	ConstructionRoot: "Construction",
	ConstructionRoot_C: "Construction",
	VitaminsRoot: "Vitamins",
	VitaminsRoot_C: "Vitamins",

	// Tier categories
	Constructions_T1: "Basic Constructions",
	ChestBaseMaintenance_T1: "Maintenance Box",
	Crafting_T1: "Basic Crafting",
	Equipment_T1: "Basic Equipment",
	Vitamins_T1: "Basic Potions",
	WalkerWeapons_T1: "Basic Walker Weapons",
	Constructions_T2: "Improved Constructions",
	WalkerWeapons_T2: "Improved Walker Weapons",
	Constructions_T3: "Advanced Constructions",
	WalkerWeapons_T3: "Advanced Walker Weapons",
	Walkers_T1: "Basic Walkers",
	Walkers_T2: "Improved Walkers",
	Crafting_T2: "Improved Crafting",
	Equipment_T3: "Advanced Equipment",
	Crafting_T3: "Advanced Crafting",
	Vitamins_T3: "Advanced Potions",
	Walkers_T3: "Advanced Walkers",
	Crafting_T4: "Advanced Crafting",
	Armors_T2: "Improved Armors",
	WalkerWeapons_T4: "Flotillian Walker Weapons",
	Walkers_T4: "Flotillian Walkers",
	WalkerPartsImproved_T3: "Advanced Walker Parts",
	Stomping_T2: "Advanced Stomping Station",
	Stomping_T3: "Flotillian Stomping Station",
	StompingStation: "Stomping Station",
	StonePlank: "Stone Plank",
	ProxyLicense: "Proxy License",
	CuringStation: "Curing Station",

	// Barriers and chests
	WalkerBarriers: "Barrier Base",
	WalkerBarriers_C: "Barrier Base",
	WalkerBarrierBase: "Barrier Base",
	ChestAmmo: "Ammo Chest",
	TrapBombChest: "Bomb Chest Trap",

	// Resources
	AloeGel: "Aloe Gel",
	WoodenShaft: "Wood Shaft",
	FiberCloth: "Fiber Weave",
	FiberCloth_C: "Fiber Weave",
	MonkeySecretion: "Rupu Gel",
	MonkeySecretion_C: "Rupu Gel",
	Poppy: "Lava Poppy",
	EmptyGlassVial: "Glass",
	CraftingBench: "Crafting Bench",
	BasicCloth: "Nomad Cloth",
	CeramicShard: "Ceramic Shard",
	BoneSplinter: "Bone Splinter",
	RedwoodWood: "Redwood Wood",
	ReinforcedGear: "Reinforced Gear",
	TripleStitch: "Triple Stitch Fabric",
	WoodenGear: "Wooden Gear",
	WormSilk: "Worm Silk",
	WormScale: "Worm Scale",

	// Tools
	ImprovisedBottle: "Improvised Bottle",
	SimplePickaxe: "Simple Pickaxe",
	SimpleRepairHammer: "Simple Repair Hammer",
	BoneSickle: "Bone Sickle",
	BoneBottle: "Bone Bottle",
	CrudeHatchet: "Crude Hatchet",
	CeramicBottle: "Ceramic Bottle",
	BoneBreaker: "Bonebreaker",
	InsectBomb: "Insect Bomb",
	"Camelop  Walker": "Camelop Walker",
	RupuFurBoots: "Rupu Fur Sandals",

	// Stations
	FiberworkingStation: "Fiberworking Station",
	FiberworkingTier_03: "Artisan Fiberworking Station",
	WoodworkingStation: "Woodworking Station",

	// Misc
	VisionPowder: "Vision Powder",
	FiberBandage: "Primitive Bandage",

	// Additional tech tree items
	Equipment_T4: "Flotillian Equipment",
	Constructions_T4: "Flotillian Constructions",
	Vitamins_T4: "Flotillian Potions",
	GelatinousGoo: "Gelatinous Goo",
	LavaFuel: "Lava Fuel",
	Clay_GroundSource: "Terrain: Clay Spots",

	// Walker weapons

	// Additional walkers
	MolluskWalker: "Mollusk Walker",
	MolluskWalker_C: "Mollusk Walker",
	TuskWalker: "Tusk Walker",
	TuskWalker_C: "Tusk Walker",
	CamelWalker: "Camelop Walker",
	CamelWalker_C: "Camelop Walker",
	"Camelop Walker": "Camelop Walker",

	// Additional weapons and tools
	CeramicSword: "Ceramic Sword",
	CeramicSword_C: "Ceramic Sword",
	IronSword: "Iron Sword",
	IronSword_C: "Iron Sword",
	ChitinPickaxe: "Chitin Pickaxe",
	ChitinPickaxe_C: "Chitin Pickaxe",

	WoodworkingTier_03: "Artisan Woodworking Station",
	StompingTier_03: "Flotillian Stomping Station",
	IronGear: "Iron Gear",
	ArtisanSoilAuger: "Artisan Soil Auger",
	IronNails: "Iron Nails",
	WoodworkingStation_T3: "Artisan Woodworking Station",
	StompingStation_T2: "Advanced Stomping Station",
	FiberworkingStation_T3: "Artisan Fiberworking Station",
};

// Build reverse mapping for internal lookups
unifiedTechTreeNames.canonicalToInternal = {};

// Create a reverse mapping for canonical names to their primary internal name
for (const [internal, canonical] of Object.entries(
	unifiedTechTreeNames.nameMap,
)) {
	// Only add the first occurrence of each canonical name to avoid duplicates
	if (!unifiedTechTreeNames.canonicalToInternal[canonical]) {
		unifiedTechTreeNames.canonicalToInternal[canonical] = internal;
	}
}

// Add lowercase variants for case-insensitive lookups
for (const key of Object.keys(unifiedTechTreeNames.nameMap)) {
	const lowercaseKey = key.toLowerCase();
	if (!unifiedTechTreeNames.nameMap[lowercaseKey]) {
		unifiedTechTreeNames.nameMap[lowercaseKey] =
			unifiedTechTreeNames.nameMap[key];
	}
}

/**
 * Normalizes a tech tree item name to its canonical form
 * @param {string} name - The name to normalize
 * @returns {string} - The normalized name
 */
unifiedTechTreeNames.normalize = function (name) {
	if (!name) return "";

	// If the name exists in our mapping, return the canonical version
	if (this.nameMap[name]) {
		return this.nameMap[name];
	}

	// If the name is already a canonical name, return it
	if (Object.values(this.nameMap).includes(name)) {
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
unifiedTechTreeNames.getInternalName = function (canonicalName) {
	return this.canonicalToInternal[canonicalName] || null;
};

// For backward compatibility with existing code
module.exports = unifiedTechTreeNames;
