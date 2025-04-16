/**
 * Loot Enricher
 * 
 * This script combines creature data with datatable information to provide
 * detailed loot information for each creature, showing exactly what items
 * can be obtained from each creature with their respective drop chances and quantities.
 */

const fs = require('node:fs');
const path = require('node:path');

// Base paths
const EXPORTS_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(EXPORTS_DIR, 'output');
const CREATURES_DIR = path.join(OUTPUT_DIR, 'creatures');
const ENRICHED_CREATURES_DIR = path.join(OUTPUT_DIR, 'enriched_creatures');

// Input files
const DATATABLE_CONTENTS_FILE = path.join(OUTPUT_DIR, 'datatable_contents.json');

// Ensure output directory exists
if (!fs.existsSync(ENRICHED_CREATURES_DIR)) {
  fs.mkdirSync(ENRICHED_CREATURES_DIR, { recursive: true });
}

/**
 * Load datatable contents
 * @returns {Object} - Map of datatable names to their contents
 */
function loadDatatableContents() {
  try {
    const datatableContents = JSON.parse(fs.readFileSync(DATATABLE_CONTENTS_FILE, 'utf8'));
    const datatableMap = new Map();

    // Create a map for faster lookups
    for (const datatable of datatableContents) {
      for (const table of datatable.tables) {
        const key = `${table.tableName}_T${table.tier}`;
        datatableMap.set(key, table.items);
      }
    }

    return datatableMap;
  } catch (error) {
    console.error(`Error loading datatable contents: ${error.message}`);
    return new Map();
  }
}

/**
 * Extract table name and tier from a datatable reference
 * @param {string} tableName - The datatable reference (e.g., "DataTable'BaseResources_T3'")
 * @param {string} tablePath - The path to the datatable (e.g., "Mist/Content/Mist/Data/LootTables/LootTables/Tier3/BaseResources_T3.0")
 * @returns {Object} - Object containing the table name and tier
 */
function extractTableInfo(tableName, tablePath) {
  // Extract the table name from the reference
  const tableNameMatch = tableName.match(/DataTable'([^']+)'/);
  const extractedTableName = tableNameMatch ? tableNameMatch[1] : tableName;

  // Extract the tier from the path
  const tierMatch = tablePath.match(/Tier(\d+)/);
  const tier = tierMatch ? tierMatch[1] : '1'; // Default to tier 1 if not found

  return {
    tableName: extractedTableName,
    tier: tier
  };
}

/**
 * Calculate effective drop chance for an item
 * @param {Object} item - The item from the datatable
 * @param {Object} tableInfo - Information about the loot table
 * @returns {Object} - Object containing the effective drop chance and quantity range
 */
function calculateEffectiveDropChance(item, tableInfo) {
  // Base chance from the item
  const baseChance = item.chance / 100; // Convert percentage to decimal

  // Table run chance
  const tableRunChance = tableInfo.runChance;

  // Iteration information
  const minIterations = tableInfo.iterations.min;
  const maxIterations = tableInfo.iterations.max;
  const perIterationChance = tableInfo.iterations.perIterationChance;

  // Quantity multiplier
  const minQuantityMultiplier = tableInfo.quantityMultiplier.min;
  const maxQuantityMultiplier = tableInfo.quantityMultiplier.max;

  // Calculate effective chance based on table run chance and iterations
  let effectiveChance = tableRunChance * baseChance;

  // If there are multiple iterations, the chance of getting at least one item increases
  if (maxIterations > 1) {
    // Probability of not getting the item in any iteration
    const notGettingItem = (1 - (baseChance * perIterationChance)) ** maxIterations;
    // Probability of getting the item in at least one iteration
    effectiveChance = tableRunChance * (1 - notGettingItem);
  }

  // Calculate effective quantity range
  const minQuantity = Math.ceil(item.minQuantity * minQuantityMultiplier);
  const maxQuantity = Math.ceil(item.maxQuantity * maxQuantityMultiplier);

  return {
    effectiveChance: effectiveChance,
    minQuantity: minQuantity,
    maxQuantity: maxQuantity
  };
}

/**
 * Enrich a creature's loot tables with datatable information
 * @param {Object} creature - The creature data
 * @param {Map} datatableMap - Map of datatable names to their contents
 * @returns {Object} - Enriched creature data
 */
function enrichCreatureLoot(creature, datatableMap) {
  // Create a deep copy of the creature to avoid modifying the original
  const enrichedCreature = JSON.parse(JSON.stringify(creature));

  // If the creature has no loot tables, return it unchanged
  if (!enrichedCreature.loot || !enrichedCreature.loot.tables || !enrichedCreature.loot.tables.length) {
    return enrichedCreature;
  }

  // Process each loot table
  for (const table of enrichedCreature.loot.tables) {
    // Extract table name and tier
    const tableInfo = extractTableInfo(table.tableName, table.tablePath);
    const lookupKey = `${tableInfo.tableName}_T${tableInfo.tier}`;

    // Look up the items in the datatable
    const items = datatableMap.get(lookupKey) || [];

    // Add the items to the table with calculated drop chances
    table.items = items.map(item => {
      const dropInfo = calculateEffectiveDropChance(item, table);

      return {
        name: item.name,
        path: item.path,
        baseChance: item.chance,
        effectiveChance: (dropInfo.effectiveChance * 100).toFixed(4), // Convert to percentage with 4 decimal places
        quantity: {
          min: dropInfo.minQuantity,
          max: dropInfo.maxQuantity
        }
      };
    });
  }

  // Add a summary of all possible items to the creature's loot
  const allItems = new Map(); // Use a map to avoid duplicates

  for (const table of enrichedCreature.loot.tables) {
    for (const item of table.items) {
      // If the item is already in the map, update it if the new chance is higher
      if (allItems.has(item.name)) {
        const existingItem = allItems.get(item.name);
        // Calculate combined probability (chance of getting from either table)
        // P(A or B) = P(A) + P(B) - P(A and B) = P(A) + P(B) - P(A) * P(B) assuming independence
        const combinedChance = Number.parseFloat(existingItem.effectiveChance) +
          Number.parseFloat(item.effectiveChance) -
          (Number.parseFloat(existingItem.effectiveChance) * Number.parseFloat(item.effectiveChance) / 100);

        existingItem.effectiveChance = combinedChance.toFixed(4);

        // Update quantity range if the new range is wider
        existingItem.quantity.min = Math.min(existingItem.quantity.min, item.quantity.min);
        existingItem.quantity.max = Math.max(existingItem.quantity.max, item.quantity.max);
      } else {
        // Add the item to the map
        allItems.set(item.name, { ...item });
      }
    }
  }

  // Convert the map to an array and sort by effective chance (descending)
  enrichedCreature.loot.items = Array.from(allItems.values())
    .sort((a, b) => Number.parseFloat(b.effectiveChance) - Number.parseFloat(a.effectiveChance));

  return enrichedCreature;
}

/**
 * Main function to enrich all creature data with datatable information
 */
async function enrichAllCreatures() {
  try {
    console.log('Loading datatable contents...');
    const datatableMap = loadDatatableContents();
    console.log(`Loaded ${datatableMap.size} datatables`);

    // Get all creature files
    const creatureFiles = fs.readdirSync(CREATURES_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(CREATURES_DIR, file));

    console.log(`Found ${creatureFiles.length} creature files`);

    // Process each creature file
    let enrichedCount = 0;
    for (const filePath of creatureFiles) {
      try {
        const fileName = path.basename(filePath);
        console.log(`Processing ${fileName}...`);

        // Load the creature data
        const creatureData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Enrich the creature data
        const enrichedCreature = enrichCreatureLoot(creatureData, datatableMap);

        // Save the enriched creature data
        const outputPath = path.join(ENRICHED_CREATURES_DIR, fileName);
        fs.writeFileSync(outputPath, JSON.stringify(enrichedCreature, null, 2));

        enrichedCount++;
      } catch (error) {
        console.error(`Error processing ${filePath}: ${error.message}`);
      }
    }

    console.log(`Enriched ${enrichedCount} creature files`);
    console.log(`Enriched creature data saved to ${ENRICHED_CREATURES_DIR}`);

    // Generate a summary report
    generateSummaryReport();
  } catch (error) {
    console.error(`Error enriching creatures: ${error.message}`);
  }
}

/**
 * Generate a summary report of all enriched creatures
 */
function generateSummaryReport() {
  try {
    const enrichedFiles = fs.readdirSync(ENRICHED_CREATURES_DIR)
      .filter(file => file.endsWith('.json'));

    const summary = {
      totalCreatures: enrichedFiles.length,
      creaturesByType: {},
      itemDrops: {}
    };

    // Process each enriched creature file
    for (const fileName of enrichedFiles) {
      const filePath = path.join(ENRICHED_CREATURES_DIR, fileName);
      const creatureData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Count creatures by type
      const creatureType = creatureData.basicInfo.type.split('_')[0]; // Extract the base type
      summary.creaturesByType[creatureType] = (summary.creaturesByType[creatureType] || 0) + 1;

      // Collect item drop information
      if (creatureData.loot?.items) {
        for (const item of creatureData.loot.items) {
          if (!summary.itemDrops[item.name]) {
            summary.itemDrops[item.name] = {
              droppedBy: [],
              highestChance: 0,
              lowestChance: 100
            };
          }

          // Add this creature to the list of creatures that drop this item
          summary.itemDrops[item.name].droppedBy.push({
            creature: creatureData.basicInfo.name,
            chance: Number.parseFloat(item.effectiveChance),
            quantity: item.quantity
          });

          // Update highest and lowest chance
          summary.itemDrops[item.name].highestChance = Math.max(
            summary.itemDrops[item.name].highestChance,
            Number.parseFloat(item.effectiveChance)
          );

          summary.itemDrops[item.name].lowestChance = Math.min(
            summary.itemDrops[item.name].lowestChance,
            Number.parseFloat(item.effectiveChance)
          );
        }
      }
    }

    // Sort each item's droppedBy list by chance (descending)
    for (const itemName in summary.itemDrops) {
      summary.itemDrops[itemName].droppedBy.sort((a, b) => b.chance - a.chance);
    }

    // Save the summary report
    const summaryPath = path.join(OUTPUT_DIR, 'enriched_loot_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log(`Summary report saved to ${summaryPath}`);
  } catch (error) {
    console.error(`Error generating summary report: ${error.message}`);
  }
}

// Run the enrichment process
enrichAllCreatures().then(() => {
  console.log('Creature loot enrichment complete');
});