/**
 * Tech Tree Item Unifier
 *
 * This utility script analyzes the exported items.json file to identify and fix
 * inconsistencies between tech tree entries and schematic items.
 * 
 * It ensures that schematic items correctly list what they teach in their 'learn' arrays
 * and that tech tree entries properly reference their parent items.
 */

const fs = require('node:fs');
const path = require('node:path');

/**
 * Unifies tech tree and item data
 * @param {string} itemsFilePath - Path to the items.json file
 * @param {string} outputFilePath - Path to save the updated items.json file
 */
function unifyTechTreeAndItems(itemsFilePath, oldFilePath = null) {
  console.log('Loading items from:', itemsFilePath);

  let outputFilePath = oldFilePath;

  // Default to overwriting the input file if no output file is specified
  if (!outputFilePath) {
    outputFilePath = itemsFilePath;
  }

  try {
    // Load the items.json file
    const itemsData = JSON.parse(fs.readFileSync(itemsFilePath, 'utf8'));

    // Create maps for faster lookups
    const itemsByName = new Map();
    const schematicsByType = new Map();
    const schematicsByName = new Map();

    for (const item of itemsData) {
      if (item.name) {
        itemsByName.set(item.name, item);
      }

      // Index schematics by type and name for easier lookup
      if (item.category === 'Schematics') {
        if (item.type) {
          schematicsByType.set(item.type, item);
        }
        if (item.name) {
          schematicsByName.set(item.name, item);
        }
      }
    }

    // Second pass: fix schematic learn arrays
    let fixedCount = 0;


    for (const item of itemsData) {
      if (item.category === 'Schematics') {
        // Ensure the learn array exists
        if (!item.learn) {
          item.learn = [];
        }

        // Check if this is a known schematic type that should have learn entries
        const schematicType = item.type;
        if (schematicType) {
          // Look for items that should be learned from this schematic
          const learnableItems = findLearnableItems(schematicType, itemsData);

          for (const learnableItem of learnableItems) {
            if (!item.learn.includes(learnableItem)) {
              item.learn.push(learnableItem);
              fixedCount++;
            }
          }
        }
      }
    }

    console.log(`Fixed ${fixedCount} learn entries in schematics`);

    // Write the updated items back to the file
    fs.writeFileSync(outputFilePath, JSON.stringify(itemsData, null, 2));
    console.log(`Updated items saved to: ${outputFilePath}`);

    return { success: true, fixedCount };
  } catch (error) {
    console.error('Error unifying tech tree and items:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Finds items that should be learnable from a specific schematic type
 * @param {string} schematicType - The type of the schematic
 * @param {Array} allItems - All items from items.json
 * @returns {Array} - Array of item names that should be learnable from this schematic
 */
function findLearnableItems(schematicType, allItems) {
  const learnableItems = [];

  // Map of known schematic types to item categories or specific items
  const schematicTypeToItemMap = {
    'Ammo_T3Schematic_C': ['Ammunition'],
    'Armors_T3Schematic_C': ['Armor'],
    'Constructions_T3Schematic_C': ['Construction'],
    'Stations_T3Schematic_C': ['Crafting'],
    'Vitamins_T3Schematic_C': ['Vitamins', 'Potions'],
    'Tools_T3Schematic_C': ['Tools'],
    'WalkerPartsAdvancedSchematic_C': ['Walker Parts']
  };

  // Special case handling for specific schematics
  const specialCaseMap = {
    'Ammo_T3Schematic_C': [
      // Add specific ammunition items if needed
    ],
    'Armors_T3Schematic_C': [
      'Brittle Bone Boots',
      'Carapace Boots',
      'Redwood Boots',
      'Brittle Bone Handwraps',
      'Carapace Gauntlets',
      'Redwood Boots',
      'Brittle Bone Armor',
      'Carapace Armor',
      'Redwood Armor'
    ],
    'Constructions_T3Schematic_C': [
      'Giant Wall Gate',
      'Giant Wall Packer'
    ],
    'Stations_T3Schematic_C': [
      'Advanced Windmill'
    ],
    'Vitamins_T3Schematic_C': [
      'Bonebreaker'
    ],
    'Tools_T3Schematic_C': [
      'Chitin PickAxe'
    ],
    'WalkerPartsAdvancedSchematic_C': [
      // Walker parts are already handled in the items.json
    ]
  };

  // Add items from special case map if available
  if (specialCaseMap[schematicType]) {
    learnableItems.push(...specialCaseMap[schematicType]);
  }

  // If we have category mappings for this schematic type, find all items in those categories
  if (schematicTypeToItemMap[schematicType]) {
    const categories = schematicTypeToItemMap[schematicType];

    for (const item of allItems) {
      if (item.category && categories.includes(item.category)) {
        // Check if this item is appropriate for this schematic tier
        if (isItemAppropriateForSchematicTier(item, schematicType)) {
          learnableItems.push(item.name);
        }
      }
    }
  }

  return [...new Set(learnableItems)]; // Remove duplicates
}

/**
 * Determines if an item is appropriate for a given schematic tier
 * @param {Object} item - The item to check
 * @param {string} schematicType - The schematic type
 * @returns {boolean} - Whether the item is appropriate for the schematic tier
 */
function isItemAppropriateForSchematicTier(item, schematicType) {
  // Extract tier from schematic type (T1, T2, T3, T4)
  const tierMatch = schematicType.match(/T(\d)/);
  if (!tierMatch) return true; // If no tier in schematic type, assume all items are valid

  const schematicTier = Number.parseInt(tierMatch[1]);

  // Logic to determine if an item belongs to a specific tier
  // This is a simplified example - you would need to expand this based on your game's logic
  if (item.type) {
    const itemTierMatch = item.type.match(/T(\d)/);
    if (itemTierMatch) {
      const itemTier = Number.parseInt(itemTierMatch[1]);
      return itemTier === schematicTier;
    }
  }

  // If we can't determine the item's tier, assume it's valid
  return true;
}

// Export the function for use in other scripts
module.exports = {
  unifyTechTreeAndItems
};

// If this script is run directly, process the default items.json file
if (require.main === module) {
  const defaultItemsPath = path.join(__dirname, '..', 'exported', 'items.json');
  unifyTechTreeAndItems(defaultItemsPath);
}