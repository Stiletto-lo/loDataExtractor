/**
 * Tech Tree Name Variants
 *
 * This module provides additional mappings for tech tree item name variants
 * to ensure consistent parent-child relationships in the tech tree visualization.
 * It complements the existing techTreeNameVariants.js by handling more edge cases.
 *
 * This file also handles cross-language naming inconsistencies to ensure proper
 * tech tree relationships regardless of the selected language.
 */

const techTreeNameVariants = {};

// Map variant tech tree item names to their canonical versions
// This ensures that parent references match the actual item names regardless of format
techTreeNameVariants.BasicCrafting_C = "Basic Crafting";
techTreeNameVariants.BasicTools_C = "Basic Tools";
techTreeNameVariants.BasicWeapons_C = "Basic Weapons";
techTreeNameVariants.BasicWalkerEquipment_C = "Steering Levers";
techTreeNameVariants.BasicWalkerUpgrades_C = "Basic Walker Upgrades";
techTreeNameVariants.BasicStructures_C = "Basic Structures";
techTreeNameVariants.AdvancedCrafting_C = "Advanced Crafting";
techTreeNameVariants.AdvancedTools_C = "Advanced Tools";
techTreeNameVariants.AdvancedWeapons_C = "Advanced Weapons";
techTreeNameVariants.AdvancedWalkerEquipment_C = "Advanced Walker Equipment";
techTreeNameVariants.AdvancedWalkerUpgrades_C = "Advanced Walker Upgrades";
techTreeNameVariants.AdvancedStructures_C = "Advanced Structures";

// Backpack variants
techTreeNameVariants.SimpleBackpacks_C = "Light Backpack";
techTreeNameVariants.ImprovedBackpacks_C = "Medium Backpack";
techTreeNameVariants.AdvancedBackpacks_C = "Heavy Backpack";

// Water and resource variants
techTreeNameVariants.WaterFiltration_C = "Purification Station";
techTreeNameVariants.SimpleWaterPurification_C = "Purified Water";
techTreeNameVariants.SulfurWaterPurification_C = "Liquid Fuel";
techTreeNameVariants.ClayExtraction_C = "Clay";
techTreeNameVariants.BoneGlueProduction_C = "Bone Glue";
techTreeNameVariants.Resin_C = "Earth Wax";

// Walker variants
techTreeNameVariants.SpiderWalker_C = "Spider Walker";
techTreeNameVariants.FireflyWalker_C = "Firefly Walker";
techTreeNameVariants.TobogganWalker_C = "Toboggan Walker";
techTreeNameVariants.StilettWalker_C = "Stiletto Walker";
techTreeNameVariants.FalcoWalker_C = "Falco Walker";
techTreeNameVariants.SchmettWalker_C = "Schmetterling Walker";
techTreeNameVariants.BirdWalker_C = "Raptor Sky Walker";
techTreeNameVariants.HornetWalker_C = "Hornet Walker";
techTreeNameVariants.TitanWalker_C = "Titan Walker";

// Projectile and weapon variants
techTreeNameVariants.BoneProjectiles_C = "Bone Bolt";
techTreeNameVariants.CeramicProjectiles_C = "Ceramic-Tipped Bolt";
techTreeNameVariants.MetalProjectiles_C = "Iron-Tipped Bolt";
techTreeNameVariants.ExplosiveBolt_C = "Explosive Bolt";
techTreeNameVariants.ExplosiveDart_C = "Explosive Dart";
techTreeNameVariants.FloatingMine_C = "Floating Mine";
techTreeNameVariants.Flare_C = "Flare - White";

// Structure variants
techTreeNameVariants.WoodenWallsLight_C = "Light Wood Structures";
techTreeNameVariants.WoodenWallsMedium_C = "Medium Wood Structures";
techTreeNameVariants.WoodenWallsHeavy_C = "Heavy Wood Structures";
techTreeNameVariants.StoneStructures_C = "Stone Structures";
techTreeNameVariants.ClayStructures_C = "Clay Structures";
techTreeNameVariants.CementFoundation_C = "Cement Structures";

// Decoration variants
techTreeNameVariants.Flags_C = "Flag 1";
techTreeNameVariants.Baskets_C = "Basket Tall";
techTreeNameVariants.Carpets_C = "Carpet Light";
techTreeNameVariants.LampsHanging_C = "Lamp Double Hanging";
techTreeNameVariants.LampsOverhanging_C = "Lamp Overhanging";
techTreeNameVariants.LampsStanding_C = "Lamp Standing";
techTreeNameVariants.GiantWalls_C = "Giant Wall";

// Additional variants for common inconsistencies
techTreeNameVariants.EquipmentRoot_C = "Equipment";
techTreeNameVariants.CraftingRoot_C = "Crafting";
techTreeNameVariants.WalkersRoot_C = "Walkers";
techTreeNameVariants.ConstructionRoot_C = "Construction";
techTreeNameVariants.VitaminsRoot_C = "Vitamins";
techTreeNameVariants.WalkerBarriers_C = "Barrier Base";
techTreeNameVariants.SpiderWalkerNomad_C = "Nomad Spider Walker";
techTreeNameVariants.SpiderWalkerBallista_C = "Spider Walker With Ballista";

// Cross-language item name variants
// These mappings handle inconsistencies between different language translations

// Weapons and tools
techTreeNameVariants.Balista = "Ballista";

// Melee weapons - Clubs and Maces
techTreeNameVariants.WoodenClub = "Beat Stick";
techTreeNameVariants.OneHandedStoneClub = "Jaggertooth Club";
techTreeNameVariants.TwoHandedStoneMace = "Jaggertooth Maul";
techTreeNameVariants.TwoHandedBoneMace = "Rawbone Maul";
techTreeNameVariants.TwoHandedBonespikedClub = "Rawbone Maul (Spiked)";
techTreeNameVariants.TwoHandedZirconiumMace = "Long Ceramic Hoofmace";
techTreeNameVariants.TwoHandedIronMaul2 = "Wyndan Warhammer";
techTreeNameVariants.TwoHandedRareMetalMace2 = "Nibirian Warhammer";
techTreeNameVariants.BoneClub = "Nurrfang Toothclub";
techTreeNameVariants.BoneMace = "Rawbone Club";
techTreeNameVariants.OneHandedZirconiumMace = "Short Ceramic Hoofmace";
techTreeNameVariants.LavaQuarterstaffBlunt = "Firestone Hammerstaff";
techTreeNameVariants.OneHandedLavaMace = "Firestone Bludgeon";
techTreeNameVariants.TwoHandedLavaMace = "Firestone Bozdogan";
techTreeNameVariants.OneHandedIronMace2 = "Wyndan Hammer";
techTreeNameVariants.OneHandedTitaniumMace2 = "Nibirian Hammer";

// Melee weapons - Staves and Axes
techTreeNameVariants.ShortQuarterstaff = "Blunt Quarterstaff";
techTreeNameVariants.TravellersStaff = "Traveller's Quarterstaff";
techTreeNameVariants.TwoHandedBoneAxe = "Rawbone Battle Axe";
techTreeNameVariants.TwoHandedLavaAxe = "Firestone Battle Axe";
techTreeNameVariants.TwoHandedIronAxe2 = "Wyndan Battle Axe";
techTreeNameVariants.TwoHandedRareMetalAxe2 = "Nibirian Battle Axe";

// Throwable weapons
techTreeNameVariants.Javelin = "Light Javelin";
techTreeNameVariants.HeavyJavelin = "Heavy Javelin";
techTreeNameVariants.BombJavelin = "Bomb Javelin";
techTreeNameVariants.ThrowableSmokeBomb = "Throwable Smoke Bomb (Gas)";
techTreeNameVariants.ThrowableAloeBomb = "Throwable Aloe Bomb";
techTreeNameVariants.ThrowableInsectBomb = "Throwable Insect Bomb";
techTreeNameVariants.ThrowingLavaBomb = "Fire Bomb";

// Resources
techTreeNameVariants.AloeGel = "Aloe Gel";
techTreeNameVariants.WoodenShaft = "Wood Shaft";
techTreeNameVariants.BoneGlue = "Bone Glue";
techTreeNameVariants.FiberCloth = "Fiber Weave";
techTreeNameVariants.FiberCloth_C = "Fiber Weave";
techTreeNameVariants.MonkeySecretion = "Rupu Gel";
techTreeNameVariants.MonkeySecretion_C = "Rupu Gel";
techTreeNameVariants.Poppy = "Lava Poppy";
techTreeNameVariants.EmptyGlassVial = "Glass";
techTreeNameVariants.DesertMule = "Desert Mule";

techTreeNameVariants.CraftingBench = "Crafting Bench";

// Stations
techTreeNameVariants.PurificationStation = "Purification Station";
techTreeNameVariants.FiberworkingStation = "Fiberworking Station";

techTreeNameVariants.BasicCrafting = "Basic Crafting";
techTreeNameVariants.BasicTools = "Basic Tools";
techTreeNameVariants.BasicWeapons = "Basic Weapons";
techTreeNameVariants.BasicWalkerEquipment = "Steering Levers";
techTreeNameVariants.BasicWalkerUpgrades = "Basic Walker Upgrades";
techTreeNameVariants.BasicStructures = "Basic Structures";
techTreeNameVariants.AdvancedCrafting = "Advanced Crafting";
techTreeNameVariants.AdvancedTools = "Advanced Tools";
techTreeNameVariants.AdvancedWeapons = "Advanced Weapons";
techTreeNameVariants.AdvancedWalkerEquipment = "Advanced Walker Equipment";
techTreeNameVariants.AdvancedWalkerUpgrades = "Advanced Walker Upgrades";
techTreeNameVariants.AdvancedStructures = "Advanced Structures";
techTreeNameVariants.SimpleBackpacks = "Light Backpack";
techTreeNameVariants.ImprovedBackpacks = "Medium Backpack";
techTreeNameVariants.AdvancedBackpacks = "Heavy Backpack";
techTreeNameVariants.WaterFiltration = "Purification Station";
techTreeNameVariants.SimpleWaterPurification = "Purified Water";
techTreeNameVariants.SulfurWaterPurification = "Liquid Fuel";
techTreeNameVariants.ClayExtraction = "Clay";
techTreeNameVariants.BoneGlueProduction = "Bone Glue";
techTreeNameVariants.Resin = "Earth Wax";

// Add mappings for walker tech tree items
techTreeNameVariants.SpiderWalker = "Spider Walker";
techTreeNameVariants.FireflyWalker = "Firefly Walker";
techTreeNameVariants.TobogganWalker = "Toboggan Walker";
techTreeNameVariants.StilettWalker = "Stiletto Walker";
techTreeNameVariants.FalcoWalker = "Falco Walker";
techTreeNameVariants.SchmettWalker = "Schmetterling Walker";
techTreeNameVariants.BirdWalker = "Raptor Sky Walker";
techTreeNameVariants.HornetWalker = "Hornet Walker";
techTreeNameVariants.TitanWalker = "Titan Walker";

// Add mappings for weapon tech tree items
techTreeNameVariants.BoneProjectiles = "Bone Bolt";
techTreeNameVariants.CeramicProjectiles = "Ceramic-Tipped Bolt";
techTreeNameVariants.MetalProjectiles = "Iron-Tipped Bolt";
techTreeNameVariants.ExplosiveBolt = "Explosive Bolt";
techTreeNameVariants.ExplosiveDart = "Explosive Dart";
techTreeNameVariants.FloatingMine = "Floating Mine";
techTreeNameVariants.Flare = "Flare - White";

// Add mappings for structure tech tree items
techTreeNameVariants.WoodenWallsLight = "Light Wood Structures";
techTreeNameVariants.WoodenWallsMedium = "Medium Wood Structures";
techTreeNameVariants.WoodenWallsHeavy = "Heavy Wood Structures";
techTreeNameVariants.StoneStructures = "Stone Structures";
techTreeNameVariants.ClayStructures = "Clay Structures";
techTreeNameVariants.CementFoundation = "Cement Structures";

// Add mappings for decoration tech tree items
techTreeNameVariants.Flags = "Flag 1";
techTreeNameVariants.Baskets = "Basket Tall";
techTreeNameVariants.Carpets = "Carpet Light";
techTreeNameVariants.LampsHanging = "Lamp Double Hanging";
techTreeNameVariants.LampsOverhanging = "Lamp Overhanging";
techTreeNameVariants.LampsStanding = "Lamp Standing";
techTreeNameVariants.GiantWalls = "Giant Wall";

// Handle lowercase variants
for (const key of Object.keys(techTreeNameVariants)) {
	const lowercaseKey = key.toLowerCase();
	if (!techTreeNameVariants[lowercaseKey]) {
		techTreeNameVariants[lowercaseKey] = techTreeNameVariants[key];
	}
}

module.exports = techTreeNameVariants;
