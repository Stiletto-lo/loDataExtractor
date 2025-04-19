/**
 * Loot Parser Class
 * 
 * This class is responsible for parsing loot-related data from game files.
 * It extends the BaseParser class and implements specific loot parsing logic.
 */

const BaseParser = require('./BaseParser');
const fs = require('node:fs');
const path = require('node:path');

class LootParser extends BaseParser {
  /**
   * Constructor for the LootParser class
   * @param {Object} options - Configuration options for the parser
   * @param {Object} translator - Translator instance for handling translations
   * @param {Object} dataParser - Data parser for handling common data parsing tasks
   * @param {ItemParser} itemParser - Item parser for resolving item references
   */
  constructor(options, translator, dataParser, itemParser) {
    super(options);
    this.translator = translator;
    this.dataParser = dataParser;
    this.itemParser = itemParser;
    this.lootTables = {};
    this.creatures = [];
    this.templates = {
      lootTable: require('../../templates/lootTable'),
      dropData: require('../../templates/dropData'),
      creature: require('../../templates/creature'),
      dataTable: require('../../templates/datatable')
    };
  }

  /**
   * Parse loot table data from a file
   * @param {string} filePath - Path to the file to parse
   * @returns {Object|null} - Parsed loot table data or null if parsing failed
   */
  parse(filePath) {
    return this.parseLootTable(filePath);
  }

  /**
   * Parse loot table data from a file
   * @param {string} filePath - Path to the file to parse
   * @returns {Object|null} - Parsed loot table data or null if parsing failed
   */
  parseLootTable(filePath) {
    const jsonData = this.readJsonFile(filePath);
    if (!jsonData) return false;

    const firstEntry = jsonData[0];
    if (
      !firstEntry?.Name ||
      !firstEntry?.Rows ||
      firstEntry?.Type !== "DataTable"
    ) {
      return false;
    }

    const dataTable = { ...this.templates.dataTable };
    dataTable.name = this.dataParser.parseName(this.translator, firstEntry.Name);
    dataTable.objectName = firstEntry.Name;
    dataTable.objectPath = firstEntry.ObjectPath || "";
    const lootItems = firstEntry.Rows;
    const tableItems = [];

    // Create a loot table for this data table
    const lootTable = { ...this.templates.lootTable };
    lootTable.name = dataTable.name;
    lootTable.objectName = firstEntry.Name;
    lootTable.objectPath = firstEntry.ObjectPath || "";
    lootTable.runChance = 1.0; // Default values
    lootTable.minIterations = 1;
    lootTable.maxIterations = 1;
    lootTable.perIterationRunChance = 1.0;
    lootTable.minQuantityMultiplier = 1.0;
    lootTable.maxQuantityMultiplier = 1.0;

    // Store loot table information
    this.lootTables[firstEntry.Name] = {
      name: dataTable.name,
      drops: []
    };

    for (const key of Object.keys(lootItems)) {
      const currentItem = lootItems[key];
      const validation = this.validateLootTableEntry(currentItem, key);

      if (!validation.isValid) {
        console.warn(validation.error);
        continue;
      }

      const resolvedName = this.resolveItemName(validation.baseName, currentItem);
      // Check if this item already exists in the tables array
      const hasDrop = tableItems.some((d) => d.name === resolvedName);

      if (!hasDrop && resolvedName !== dataTable.name) {
        const drop = this.createDropItem(resolvedName, currentItem);
        tableItems.push(drop);

        // Add to the loot table drops array
        lootTable.drops.push(drop);

        // Add to the loot tables collection for creature processing
        this.lootTables[firstEntry.Name].drops.push({
          name: resolvedName,
          chance: currentItem.Chance,
          minQuantity: currentItem.MinQuantity,
          maxQuantity: currentItem.MaxQuantity
        });
      }
    }

    return lootTable;
  }

  /**
   * Parse loot sites from a file
   * @param {string} filePath - Path to the file to parse
   * @returns {Object|null} - Parsed loot site data or null if parsing failed
   */
  parseLootSites(filePath) {
    const jsonData = this.readJsonFile(filePath);
    if (!jsonData) return null;

    // Implementation depends on how loot sites are stored in the data
    // This is a placeholder implementation
    if (jsonData[1]?.Properties?.LootTableClass?.AssetPathName) {
      const lootTablePath = jsonData[1].Properties.LootTableClass.AssetPathName;
      const creatureName = this.getLootSiteNameFromObject(jsonData[1]);

      if (creatureName) {
        const creature = { ...this.templates.creature };
        creature.name = creatureName;
        creature.lootTable = this.dataParser.parseType(lootTablePath);

        this.creatures.push(creature);
        return creature;
      }
    }

    return null;
  }

  /**
   * Get loot site name from object
   * @param {Object} obj - The object to extract name from
   * @returns {string|null} - Extracted name or null
   */
  getLootSiteNameFromObject(obj) {
    if (!obj) return null;

    // Implementation depends on how names are stored in the data
    // This is a placeholder implementation
    if (obj.Properties?.DisplayName) {
      return this.dataParser.parseName(this.translator, obj.Properties.DisplayName);
    }

    return null;
  }

  /**
   * Creates a drop item with optional properties based on configuration
   * @param {string} name - The name of the drop item
   * @param {Object} lootItemData - The loot item data containing properties
   * @returns {Object} - A configured drop item
   */
  createDropItem(name, lootItemData) {
    if (!name || !lootItemData) {
      console.warn("Missing required parameters for createDropItem");
      return { ...this.templates.dropData, name: name || "Unknown" };
    }

    const drop = { ...this.templates.dropData };
    drop.name = name;

    if (lootItemData.Chance) { drop.chance = lootItemData.Chance; }
    if (lootItemData.MinQuantity) { drop.minQuantity = lootItemData.MinQuantity; }
    if (lootItemData.MaxQuantity) { drop.maxQuantity = lootItemData.MaxQuantity; }

    return drop;
  }

  /**
   * Determines the item name based on available data
   * @param {string} baseName - The base name from translation
   * @param {Object} lootItem - The loot item data
   * @returns {string} - The resolved item name
   */
  resolveItemName(baseName, lootItem) {
    if (!baseName || !lootItem) {
      return "Unknown Item";
    }

    if (!lootItem?.Item?.AssetPathName) {
      return baseName;
    }

    const completeItem = this.itemParser.getItemByType(
      this.dataParser.parseType(lootItem.Item.AssetPathName)
    );

    if (completeItem?.name) {
      return completeItem.name;
    }

    if (lootItem.Item.AssetPathName.includes("Schematics")) {
      return `${baseName} Schematic`;
    }

    return baseName;
  }

  /**
   * Validates loot table entry data
   * @param {Object} currentItem - The current loot item to validate
   * @param {string} key - The key of the current item
   * @returns {Object} - Object containing validation result and error message
   */
  validateLootTableEntry(currentItem, key) {
    if (!currentItem.Item) {
      return { isValid: false, error: `Missing Item property for ${key}` };
    }

    const baseName = this.dataParser.parseName(this.translator, key);
    if (!baseName) {
      return { isValid: false, error: `Could not parse name for ${key}` };
    }

    return { isValid: true, baseName };
  }

  /**
   * Get all loot tables
   * @returns {Object} - All loot tables
   */
  getAllLootTables() {
    return this.lootTables;
  }

  /**
   * Get all creatures
   * @returns {Array} - All creatures
   */
  getCreatures() {
    return this.creatures;
  }
}

module.exports = LootParser;