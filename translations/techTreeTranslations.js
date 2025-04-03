/**
 * Tech Tree Translations
 *
 * This module provides mappings for tech tree item names to ensure consistent parent-child relationships
 * in the tech tree visualization. It resolves naming inconsistencies between different game files.
 */

const techTreeTranslations = {};

// Map tech tree item names to their canonical versions
// This ensures that parent references match the actual item names
techTreeTranslations.BasicCrafting = "Basic Crafting";
techTreeTranslations.BasicTools = "Basic Tools";
techTreeTranslations.BasicWeapons = "Basic Weapons";
techTreeTranslations.BasicWalkerEquipment = "Steering Levers";
techTreeTranslations.BasicWalkerUpgrades = "Basic Walker Upgrades";
techTreeTranslations.BasicStructures = "Basic Structures";
techTreeTranslations.AdvancedCrafting = "Advanced Crafting";
techTreeTranslations.AdvancedTools = "Advanced Tools";
techTreeTranslations.AdvancedWeapons = "Advanced Weapons";
techTreeTranslations.AdvancedWalkerEquipment = "Advanced Walker Equipment";
techTreeTranslations.AdvancedWalkerUpgrades = "Advanced Walker Upgrades";
techTreeTranslations.AdvancedStructures = "Advanced Structures";
techTreeTranslations.SimpleBackpacks = "Light Backpack";
techTreeTranslations.ImprovedBackpacks = "Medium Backpack";
techTreeTranslations.AdvancedBackpacks = "Heavy Backpack";
techTreeTranslations.WaterFiltration = "Purification Station";
techTreeTranslations.SimpleWaterPurification = "Purified Water";
techTreeTranslations.SulfurWaterPurification = "Liquid Fuel";
techTreeTranslations.ClayExtraction = "Clay";
techTreeTranslations.BoneGlueProduction = "Bone Glue";
techTreeTranslations.Resin = "Earth Wax";

// Add mappings for walker tech tree items
techTreeTranslations.SpiderWalker = "Spider Walker";
techTreeTranslations.FireflyWalker = "Firefly Walker";
techTreeTranslations.TobogganWalker = "Toboggan Walker";
techTreeTranslations.StilettWalker = "Stiletto Walker";
techTreeTranslations.FalcoWalker = "Falco Walker";
techTreeTranslations.SchmettWalker = "Schmetterling Walker";
techTreeTranslations.BirdWalker = "Raptor Sky Walker";
techTreeTranslations.HornetWalker = "Hornet Walker";
techTreeTranslations.TitanWalker = "Titan Walker";

// Add mappings for weapon tech tree items
techTreeTranslations.BoneProjectiles = "Bone Bolt";
techTreeTranslations.CeramicProjectiles = "Ceramic-Tipped Bolt";
techTreeTranslations.MetalProjectiles = "Iron-Tipped Bolt";
techTreeTranslations.ExplosiveBolt = "Explosive Bolt";
techTreeTranslations.ExplosiveDart = "Explosive Dart";
techTreeTranslations.FloatingMine = "Floating Mine";
techTreeTranslations.Flare = "Flare - White";

// Add mappings for structure tech tree items
techTreeTranslations.WoodenWallsLight = "Light Wood Structures";
techTreeTranslations.WoodenWallsMedium = "Medium Wood Structures";
techTreeTranslations.WoodenWallsHeavy = "Heavy Wood Structures";
techTreeTranslations.StoneStructures = "Stone Structures";
techTreeTranslations.ClayStructures = "Clay Structures";
techTreeTranslations.CementFoundation = "Cement Structures";

// Add mappings for decoration tech tree items
techTreeTranslations.Flags = "Flag 1";
techTreeTranslations.Baskets = "Basket Tall";
techTreeTranslations.Carpets = "Carpet Light";
techTreeTranslations.LampsHanging = "Lamp Double Hanging";
techTreeTranslations.LampsOverhanging = "Lamp Overhanging";
techTreeTranslations.LampsStanding = "Lamp Standing";
techTreeTranslations.GiantWalls = "Giant Wall";

module.exports = techTreeTranslations;
