/**
 * Item Parser Class
 * 
 * This class is responsible for parsing item-related data from game files.
 * It extends the BaseParser class and implements specific item parsing logic.
 */

const BaseParser = require('./BaseParser');
const fs = require('node:fs');
const path = require('node:path');

class ItemParser extends BaseParser {
  /**
   * Constructor for the ItemParser class
   * @param {Object} options - Configuration options for the parser
   * @param {Object} translator - Translator instance for handling translations
   * @param {Object} dataParser - Data parser for handling common data parsing tasks
   */
  constructor(options, translator, dataParser) {
    super(options);
    this.translator = translator;
    this.dataParser = dataParser;
    this.items = [];
    this.templates = {
      item: require('../../templates/item'),
      projectileDamage: require('../../templates/projectileDamage')
    };
  }

  /**
   * Parse item data from a file
   * @param {string} filePath - Path to the file to parse
   * @returns {Object|null} - Parsed item data or null if parsing failed
   */
  parse(filePath) {
    return this.parseItemData(filePath);
  }

  /**
   * Parse item data from a file
   * @param {string} filePath - Path to the file to parse
   * @returns {Object|null} - Parsed item data or null if parsing failed
   */
  parseItemData(filePath) {
    const jsonData = this.readJsonFile(filePath);
    if (!jsonData) return null;

    const item = this.getItemFromItemData(jsonData);
    if (item) {
      this.items.push(item);
      return item;
    }
    return null;
  }

  /**
   * Extract item data from JSON data
   * @param {Object} jsonData - The JSON data to extract item from
   * @returns {Object|null} - Extracted item or null if extraction failed
   */
  getItemFromItemData(jsonData) {
    if (!jsonData?.[1]?.Properties) {
      return null;
    }

    const itemData = jsonData[1];
    const item = { ...this.templates.item };

    // Extract basic item properties
    item.name = this.dataParser.parseName(this.translator, itemData.Properties.DisplayName);
    item.type = this.dataParser.parseType(itemData.Type);
    item.category = this.extractCategory(itemData);
    item.stackSize = itemData.Properties.MaxStackSize || 1;
    item.weight = itemData.Properties.Weight || 0;

    // Extract additional properties if they exist
    if (itemData.Properties.Durability) {
      item.durability = itemData.Properties.Durability;
    }

    if (itemData.Properties.bDevItem) {
      item.onlyDevs = true;
    }

    // Clean up the item object
    return this.cleanEmptyProperties(item);
  }

  /**
   * Extract category from item data
   * @param {Object} itemData - The item data to extract category from
   * @returns {string|null} - Extracted category or null
   */
  extractCategory(itemData) {
    // Implementation depends on how categories are stored in the data
    // This is a placeholder implementation
    if (itemData.Properties.ItemType) {
      return itemData.Properties.ItemType;
    }
    return null;
  }

  /**
   * Get all parsed items
   * @returns {Array} - Array of all parsed items
   */
  getAllItems() {
    return this.items;
  }

  /**
   * Get a specific item by name
   * @param {string} name - The name of the item to get
   * @returns {Object|null} - The item or null if not found
   */
  getItem(name) {
    return this.items.find(item => item.name === name) || null;
  }

  /**
   * Get a specific item by type
   * @param {string} type - The type of the item to get
   * @returns {Object|null} - The item or null if not found
   */
  getItemByType(type) {
    return this.items.find(item => item.type === type) || null;
  }
}

module.exports = ItemParser;