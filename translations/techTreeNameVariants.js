/**
 * Tech Tree Name Variants
 * 
 * This module provides additional mappings for tech tree item name variants
 * to ensure consistent parent-child relationships in the tech tree visualization.
 * It complements the existing techTreeTranslations.js by handling more edge cases.
 * 
 * This file also handles cross-language naming inconsistencies to ensure proper
 * tech tree relationships regardless of the selected language.
 */

const techTreeNameVariants = {};

// Map variant tech tree item names to their canonical versions
// This ensures that parent references match the actual item names regardless of format
techTreeNameVariants["BasicCrafting_C"] = "Basic Crafting";
techTreeNameVariants["BasicTools_C"] = "Basic Tools";
techTreeNameVariants["BasicWeapons_C"] = "Basic Weapons";
techTreeNameVariants["BasicWalkerEquipment_C"] = "Steering Levers";
techTreeNameVariants["BasicWalkerUpgrades_C"] = "Basic Walker Upgrades";
techTreeNameVariants["BasicStructures_C"] = "Basic Structures";
techTreeNameVariants["AdvancedCrafting_C"] = "Advanced Crafting";
techTreeNameVariants["AdvancedTools_C"] = "Advanced Tools";
techTreeNameVariants["AdvancedWeapons_C"] = "Advanced Weapons";
techTreeNameVariants["AdvancedWalkerEquipment_C"] = "Advanced Walker Equipment";
techTreeNameVariants["AdvancedWalkerUpgrades_C"] = "Advanced Walker Upgrades";
techTreeNameVariants["AdvancedStructures_C"] = "Advanced Structures";

// Backpack variants
techTreeNameVariants["SimpleBackpacks_C"] = "Light Backpack";
techTreeNameVariants["ImprovedBackpacks_C"] = "Medium Backpack";
techTreeNameVariants["AdvancedBackpacks_C"] = "Heavy Backpack";

// Water and resource variants
techTreeNameVariants["WaterFiltration_C"] = "Purification Station";
techTreeNameVariants["SimpleWaterPurification_C"] = "Purified Water";
techTreeNameVariants["SulfurWaterPurification_C"] = "Liquid Fuel";
techTreeNameVariants["ClayExtraction_C"] = "Clay";
techTreeNameVariants["BoneGlueProduction_C"] = "Bone Glue";
techTreeNameVariants["Resin_C"] = "Earth Wax";

// Walker variants
techTreeNameVariants["SpiderWalker_C"] = "Spider Walker";
techTreeNameVariants["FireflyWalker_C"] = "Firefly Walker";
techTreeNameVariants["TobogganWalker_C"] = "Toboggan Walker";
techTreeNameVariants["StilettWalker_C"] = "Stiletto Walker";
techTreeNameVariants["FalcoWalker_C"] = "Falco Walker";
techTreeNameVariants["SchmettWalker_C"] = "Schmetterling Walker";
techTreeNameVariants["BirdWalker_C"] = "Raptor Sky Walker";
techTreeNameVariants["HornetWalker_C"] = "Hornet Walker";
techTreeNameVariants["TitanWalker_C"] = "Titan Walker";

// Projectile and weapon variants
techTreeNameVariants["BoneProjectiles_C"] = "Bone Bolt";
techTreeNameVariants["CeramicProjectiles_C"] = "Ceramic-Tipped Bolt";
techTreeNameVariants["MetalProjectiles_C"] = "Iron-Tipped Bolt";
techTreeNameVariants["ExplosiveBolt_C"] = "Explosive Bolt";
techTreeNameVariants["ExplosiveDart_C"] = "Explosive Dart";
techTreeNameVariants["FloatingMine_C"] = "Floating Mine";
techTreeNameVariants["Flare_C"] = "Flare - White";

// Structure variants
techTreeNameVariants["WoodenWallsLight_C"] = "Light Wood Structures";
techTreeNameVariants["WoodenWallsMedium_C"] = "Medium Wood Structures";
techTreeNameVariants["WoodenWallsHeavy_C"] = "Heavy Wood Structures";
techTreeNameVariants["StoneStructures_C"] = "Stone Structures";
techTreeNameVariants["ClayStructures_C"] = "Clay Structures";
techTreeNameVariants["CementFoundation_C"] = "Cement Structures";

// Decoration variants
techTreeNameVariants["Flags_C"] = "Flag 1";
techTreeNameVariants["Baskets_C"] = "Basket Tall";
techTreeNameVariants["Carpets_C"] = "Carpet Light";
techTreeNameVariants["LampsHanging_C"] = "Lamp Double Hanging";
techTreeNameVariants["LampsOverhanging_C"] = "Lamp Overhanging";
techTreeNameVariants["LampsStanding_C"] = "Lamp Standing";
techTreeNameVariants["GiantWalls_C"] = "Giant Wall";

// Additional variants for common inconsistencies
techTreeNameVariants["EquipmentRoot_C"] = "Equipment";
techTreeNameVariants["CraftingRoot_C"] = "Crafting";
techTreeNameVariants["WalkersRoot_C"] = "Walkers";
techTreeNameVariants["ConstructionRoot_C"] = "Construction";
techTreeNameVariants["VitaminsRoot_C"] = "Vitamins";
techTreeNameVariants["WalkerBarriers_C"] = "Barrier Base";
techTreeNameVariants["SpiderWalkerNomad_C"] = "Nomad Spider Walker";
techTreeNameVariants["SpiderWalkerBallista_C"] = "Spider Walker With Ballista";

// Cross-language item name variants
// These mappings handle inconsistencies between different language translations

// Weapons and tools
techTreeNameVariants["简易修复锤"] = "Simple Repair Hammer";
techTreeNameVariants["간단한 수리용 망치"] = "Simple Repair Hammer";
techTreeNameVariants["Prosty młotek naprawczy"] = "Simple Repair Hammer";

techTreeNameVariants["伐木工斧头"] = "Woodcutter's Hatchet";
techTreeNameVariants["나무꾼의 손도끼"] = "Woodcutter's Hatchet";
techTreeNameVariants["Siekiera drwala"] = "Woodcutter's Hatchet";

techTreeNameVariants["弩炮"] = "Ballista";
techTreeNameVariants["발리스타"] = "Ballista";
techTreeNameVariants["Balista"] = "Ballista";
techTreeNameVariants["バリスタ"] = "Ballista";

techTreeNameVariants["弹弓"] = "Slingshot";
techTreeNameVariants["새총"] = "Slingshot";
techTreeNameVariants["Proca"] = "Slingshot";
techTreeNameVariants["スリングショット"] = "Slingshot";

techTreeNameVariants["散弹枪"] = "Scattershot Gun";
techTreeNameVariants["산탄총"] = "Scattershot Gun";
techTreeNameVariants["Rozpylacz"] = "Scattershot Gun";
techTreeNameVariants["スキャターショット・ガン"] = "Scattershot Gun";

techTreeNameVariants["连发枪"] = "Repeater";
techTreeNameVariants["연발총"] = "Repeater";
techTreeNameVariants["Wielostrzał"] = "Repeater";
techTreeNameVariants["リピーター"] = "Repeater";

techTreeNameVariants["简易镐"] = "Simple Pickaxe";
techTreeNameVariants["단순한 곡괭이"] = "Simple Pickaxe";
techTreeNameVariants["Prosty kilof"] = "Simple Pickaxe";

techTreeNameVariants["简易手镰"] = "Simple Sickle";
techTreeNameVariants["단순한 낫"] = "Simple Sickle";
techTreeNameVariants["Prosty sierp"] = "Simple Sickle";

// Containers and equipment
techTreeNameVariants["轻型背包"] = "Light Backpack";
techTreeNameVariants["가벼운 가방"] = "Light Backpack";
techTreeNameVariants["Lekki plecak"] = "Light Backpack";

techTreeNameVariants["中型背包"] = "Medium Backpack";
techTreeNameVariants["중형 가방"] = "Medium Backpack";
techTreeNameVariants["Średni plecak"] = "Medium Backpack";

techTreeNameVariants["小型水囊"] = "Small Water Bag";
techTreeNameVariants["소형 물주머니"] = "Small Water Bag";
techTreeNameVariants["Mały bukłak"] = "Small Water Bag";

techTreeNameVariants["中型液体容器"] = "Medium Liquid Container";
techTreeNameVariants["중형 액체 컨테이너"] = "Medium Liquid Container";
techTreeNameVariants["Średni zasobnik na płyny"] = "Medium Liquid Container";

techTreeNameVariants["矩力背包"] = "Torque Backpack";
techTreeNameVariants["토크 가방"] = "Torque Backpack";
techTreeNameVariants["Plecak przechowujący moment obr."] = "Torque Backpack";

techTreeNameVariants["矩力电池"] = "Torque Battery";
techTreeNameVariants["토크 배터리"] = "Torque Battery";
techTreeNameVariants["Bateria momentu obrotowego"] = "Torque Battery";

// Melee weapons - Clubs and Maces
techTreeNameVariants["WoodenClub"] = "Beat Stick";
techTreeNameVariants["OneHandedStoneClub"] = "Jaggertooth Club";
techTreeNameVariants["TwoHandedStoneMace"] = "Jaggertooth Maul";
techTreeNameVariants["TwoHandedBoneMace"] = "Rawbone Maul";
techTreeNameVariants["TwoHandedBonespikedClub"] = "Rawbone Maul (Spiked)";
techTreeNameVariants["TwoHandedZirconiumMace"] = "Long Ceramic Hoofmace";
techTreeNameVariants["TwoHandedIronMaul2"] = "Wyndan Warhammer";
techTreeNameVariants["TwoHandedRareMetalMace2"] = "Nibirian Warhammer";
techTreeNameVariants["BoneClub"] = "Nurrfang Toothclub";
techTreeNameVariants["BoneMace"] = "Rawbone Club";
techTreeNameVariants["OneHandedZirconiumMace"] = "Short Ceramic Hoofmace";
techTreeNameVariants["LavaQuarterstaffBlunt"] = "Firestone Hammerstaff";
techTreeNameVariants["OneHandedLavaMace"] = "Firestone Bludgeon";
techTreeNameVariants["TwoHandedLavaMace"] = "Firestone Bozdogan";
techTreeNameVariants["OneHandedIronMace2"] = "Wyndan Hammer";
techTreeNameVariants["OneHandedTitaniumMace2"] = "Nibirian Hammer";

// Melee weapons - Staves and Axes
techTreeNameVariants["ShortQuarterstaff"] = "Blunt Quarterstaff";
techTreeNameVariants["TravellersStaff"] = "Traveller's Quarterstaff";
techTreeNameVariants["TwoHandedBoneAxe"] = "Rawbone Battle Axe";
techTreeNameVariants["TwoHandedLavaAxe"] = "Firestone Battle Axe";
techTreeNameVariants["TwoHandedIronAxe2"] = "Wyndan Battle Axe";
techTreeNameVariants["TwoHandedRareMetalAxe2"] = "Nibirian Battle Axe";

// Throwable weapons
techTreeNameVariants["Javelin"] = "Light Javelin";
techTreeNameVariants["HeavyJavelin"] = "Heavy Javelin";
techTreeNameVariants["BombJavelin"] = "Bomb Javelin";
techTreeNameVariants["ThrowableSmokeBomb"] = "Throwable Smoke Bomb (Gas)";
techTreeNameVariants["ThrowableAloeBomb"] = "Throwable Aloe Bomb";
techTreeNameVariants["ThrowableInsectBomb"] = "Throwable Insect Bomb";
techTreeNameVariants["ThrowingLavaBomb"] = "Fire Bomb";

// Resources
techTreeNameVariants["AloeGel"] = "Aloe Gel";
techTreeNameVariants["WoodenShaft"] = "Wooden Shaft";
techTreeNameVariants["BoneGlue"] = "Bone Glue";
techTreeNameVariants["液体燃料"] = "Liquid Fuel";
techTreeNameVariants["액체 연료"] = "Liquid Fuel";
techTreeNameVariants["Płynne paliwo"] = "Liquid Fuel";
techTreeNameVariants["FiberCloth"] = "Fiber Weave";
techTreeNameVariants["FiberCloth_C"] = "Fiber Weave";
techTreeNameVariants["MonkeySecretion"] = "Rupu Gel";
techTreeNameVariants["MonkeySecretion_C"] = "Rupu Gel";
techTreeNameVariants["Poppy"] = "Lava Poppy";
techTreeNameVariants["EmptyGlassVial"] = "Glass";

techTreeNameVariants["CraftingBench"] = "Crafting Bench";

techTreeNameVariants["黏土"] = "Clay";
techTreeNameVariants["점토"] = "Clay";
techTreeNameVariants["Glina"] = "Clay";

techTreeNameVariants["纤维"] = "Fiber";
techTreeNameVariants["섬유"] = "Fiber";
techTreeNameVariants["Włókno"] = "Fiber";

techTreeNameVariants["石头"] = "Stone";
techTreeNameVariants["돌"] = "Stone";
techTreeNameVariants["Kamień"] = "Stone";

techTreeNameVariants["木"] = "Wood";
techTreeNameVariants["나무"] = "Wood";
techTreeNameVariants["Drewno"] = "Wood";

techTreeNameVariants["硫磺"] = "Sulfur";
techTreeNameVariants["유황 덩어리"] = "Sulfur";
techTreeNameVariants["Bryła siarki"] = "Sulfur";

techTreeNameVariants["焦油"] = "Tar";
techTreeNameVariants["타르"] = "Tar";
techTreeNameVariants["Smoła"] = "Tar";

techTreeNameVariants["黑曜石"] = "Obsidian";
techTreeNameVariants["흑요석"] = "Obsidian";
techTreeNameVariants["Obsydian"] = "Obsidian";

techTreeNameVariants["兽皮"] = "Hide";
techTreeNameVariants["가죽"] = "Hide";
techTreeNameVariants["Skóra"] = "Hide";

// Stations
techTreeNameVariants["纤维加工站"] = "Fiberworking Station";
techTreeNameVariants["방직소"] = "Fiberworking Station";
techTreeNameVariants["Stacja tkacka"] = "Fiberworking Station";

techTreeNameVariants["木头加工站"] = "Woodworking Station";
techTreeNameVariants["목공소"] = "Woodworking Station";
techTreeNameVariants["Stanowisko ciesielskie"] = "Woodworking Station";

techTreeNameVariants["净化台"] = "Purification Station";
techTreeNameVariants["정수시설"] = "Purification Station";
techTreeNameVariants["Stacja uzdatniająca"] = "Purification Station";

techTreeNameVariants["采石场"] = "Quarry";
techTreeNameVariants["채석장"] = "Quarry";
techTreeNameVariants["Kamieniołom"] = "Quarry";

techTreeNameVariants["熔炉"] = "Furnace";
techTreeNameVariants["용광로"] = "Furnace";
techTreeNameVariants["Piec"] = "Furnace";

techTreeNameVariants["踏碎站"] = "Stomping Station";
techTreeNameVariants["방앗간"] = "Stomping Station";
techTreeNameVariants["Zgniatarka"] = "Stomping Station";

// Walker parts
techTreeNameVariants["方向盘"] = "Steering Levers";
techTreeNameVariants["핸들"] = "Steering Levers";
techTreeNameVariants["Koło sterowe"] = "Steering Levers";

techTreeNameVariants["壁垒建筑"] = "Barrier Base";
techTreeNameVariants["장벽 베이스"] = "Barrier Base";
techTreeNameVariants["Baza barierowa"] = "Barrier Base";

techTreeNameVariants["防御塔"] = "Defensive Tower";
techTreeNameVariants["방어탑"] = "Defensive Tower";
techTreeNameVariants["Wieża obronna"] = "Defensive Tower";


// Handle lowercase variants
Object.keys(techTreeNameVariants).forEach(key => {
  const lowercaseKey = key.toLowerCase();
  if (!techTreeNameVariants[lowercaseKey]) {
    techTreeNameVariants[lowercaseKey] = techTreeNameVariants[key];
  }
});

module.exports = techTreeNameVariants;