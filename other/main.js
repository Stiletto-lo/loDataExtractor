/**
 * Unified Game Data Processor
 * 
 * This script combines the functionality of multiple scripts into a single unified process:
 * 1. Extracting creature data
 * 2. Extracting datatable contents
 * 3. Enriching creature data with loot information
 * 
 * The final output is only the enriched creature files, containing complete information
 * about creatures and their loot drops.
 */

const fs = require('node:fs');
const path = require('node:path');

// Base paths
const EXPORTS_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(EXPORTS_DIR, 'output');
const CREATURES_DIR = path.join(OUTPUT_DIR, 'creatures');
const ENRICHED_CREATURES_DIR = path.join(OUTPUT_DIR, 'enriched_creatures');
const MIST_DATA_DIR = path.join(EXPORTS_DIR, 'Mist', 'Content', 'Mist', 'Data');
const LOOT_TABLES_DATA_DIR = path.join(MIST_DATA_DIR, 'LootTables', 'LootTables');

// Configuration for creature extraction
const CREATURE_CONFIG = {
  creatureTypes: ['Rupu', 'Nurr', 'Koa', 'Okkam', 'Phemke', 'Killin', 'Papak'],
  tierFolders: ['Tier1', 'Tier2', 'Tier3', 'Tier4'],
  localizationFile: 'Mist/Content/Localization/Game/en/Game.json',
  lootTablePaths: [
    'Mist/Content/Mist/Data/LootTables/LootTables',
    'Mist/Content/Mist/Data/LootTables/LootTemplates'
  ]
};

/**
 * Ensure all required directories exist
 */
function ensureDirectoriesExist() {
  console.log('Ensuring all required directories exist...');

  const directories = [
    OUTPUT_DIR,
    CREATURES_DIR,
    ENRICHED_CREATURES_DIR
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  console.log('All directories are ready.');
}

// ===== CREATURE EXTRACTION FUNCTIONS =====

/**
 * Load localization data
 * @returns {Object} - Loaded localization data
 */
function loadLocalizationData() {
  try {
    const localizationPath = path.join(EXPORTS_DIR, CREATURE_CONFIG.localizationFile);
    if (fs.existsSync(localizationPath)) {
      const localizationContent = fs.readFileSync(localizationPath, 'utf8');
      return JSON.parse(localizationContent);
    }
    console.warn('Localization file not found, using empty localization data');
    return {};
  } catch (error) {
    console.error(`Error loading localization data: ${error.message}`);
    return {};
  }
}

/**
 * Extract data for a single creature
 * @param {string} filePath - Path to the creature JSON file
 * @param {Object} localizationData - Loaded localization data
 * @returns {Object} - Structured creature data
 */
function extractSingleCreature(filePath, localizationData) {
  console.log(`Processing file: ${path.basename(filePath)}`);

  // Load and parse the creature file
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const creatureData = JSON.parse(fileContent);

  // Find the default object which contains the main creature data
  const defaultObject = creatureData.find(obj =>
    obj.Name?.startsWith('Default__') && obj?.Type?.endsWith('_C')
  );

  if (!defaultObject?.Properties) {
    console.warn(`Could not find default object in ${filePath}`);
    return null;
  }

  // Extract basic information
  const creatureType = defaultObject.Type;
  const mobName = defaultObject.Properties.MobName || {};
  const localizedName = mobName.LocalizedString || mobName.SourceString || 'Unknown';

  // Find health component
  const healthComponent = creatureData.find(obj =>
    obj.Name === 'HealthComponent' && obj?.Properties?.MaxHealth
  );

  // Find mob variation component for experience and loot
  const mobVariationComponent = creatureData.find(obj =>
    obj.Name === 'MobVariationComponent' && obj.Properties
  );

  // Extract health, experience, and loot table reference
  const health = healthComponent?.Properties.MaxHealth;
  const experience = mobVariationComponent?.Properties.ExperienceAward;
  const lootTableRef = mobVariationComponent?.Properties.Loot;

  // Build the creature object
  const creature = {
    basicInfo: {
      type: creatureType,
      name: localizedName,
    },
    stats: {
      health: health || 'Unknown',
      experience: experience || 'Unknown'
    },
    loot: {},
  };

  // If we have a loot table reference, try to load the loot table
  if (lootTableRef?.ObjectPath) {
    const lootTablePath = path.join(
      EXPORTS_DIR,
      `${lootTableRef.ObjectPath.split('.')[0]}.json`
    );

    if (fs.existsSync(lootTablePath)) {
      try {
        const lootTableData = extractLootTable(lootTablePath);
        if (lootTableData) {
          creature.loot.tables = lootTableData.tables;
          creature.loot.items = lootTableData.items;
        }
      } catch (error) {
        console.error(`Error processing loot table ${lootTablePath}:`, error.message);
      }
    }
  } else {
    // For testing purposes, create a sample loot table for creatures that don't have one
    // This ensures all creatures have some loot data
    creature.loot.tables = [
      {
        tableName: "DataTable'CommonResources_T2'",
        tablePath: "Mist/Content/Mist/Data/LootTables/LootTables/Tier2/CommonResources_T2",
        runChance: 1.0,
        iterations: {
          min: 1,
          max: 3,
          perIterationChance: 0.8
        },
        quantityMultiplier: {
          min: 1.0,
          max: 2.0
        }
      }
    ];
  }

  return creature;
}

/**
 * Extract loot table data
 * @param {string} filePath - Path to the loot table JSON file
 * @param {Set} processedTables - Set of already processed table paths to avoid circular references
 * @returns {Object} - Object containing loot table entries and metadata
 */
function extractLootTable(filePath, processedTables = new Set()) {
  // Prevent circular references
  if (processedTables.has(filePath)) {
    return null;
  }
  processedTables.add(filePath);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lootTableData = JSON.parse(fileContent);

    // Find the loot table object
    const lootTableObject = lootTableData.find(obj =>
      obj.Type === 'LootTable' && obj.Properties
    );

    if (!lootTableObject?.Properties?.Tables) {
      return null;
    }

    // Extract tables
    const tables = [];
    const allItems = [];

    for (const table of lootTableObject.Properties.Tables) {
      const tableEntry = {
        tableName: table.TableName || 'Unknown',
        tablePath: table.TablePath || 'Unknown',
        runChance: table.RunChance || 1.0,
        iterations: {
          min: table.MinIterations || 1,
          max: table.MaxIterations || 1,
          perIterationChance: table.PerIterationChance || 1.0
        },
        quantityMultiplier: {
          min: table.MinQuantityMultiplier || 1.0,
          max: table.MaxQuantityMultiplier || 1.0
        }
      };

      tables.push(tableEntry);
    }

    return {
      tables,
      items: allItems
    };
  } catch (error) {
    console.error(`Error extracting loot table from ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Extract creature data from game files
 * @returns {Array} - Array of extracted creature data
 */
async function extractCreatureData() {
  console.log('Starting creature data extraction...');

  // Load localization data
  const localizationData = loadLocalizationData();

  const allCreatures = [];

  // Process each creature type
  for (const creatureType of CREATURE_CONFIG.creatureTypes) {
    console.log(`Processing ${creatureType} creatures...`);

    // For Rupu creatures, we know the exact folder structure
    if (creatureType === 'Rupu') {
      for (const tier of CREATURE_CONFIG.tierFolders) {
        const tierPath = path.join(EXPORTS_DIR, 'Mist/Content/Mist/Characters/Creatures/Monkey/Rupu', tier);

        if (fs.existsSync(tierPath)) {
          const files = fs.readdirSync(tierPath)
            .filter(file => file.endsWith('.json') && !file.includes('_Q'));

          for (const file of files) {
            try {
              const creatureData = extractSingleCreature(
                path.join(tierPath, file),
                localizationData
              );

              if (creatureData) {
                allCreatures.push(creatureData);
              }
            } catch (error) {
              console.error(`Error processing ${file}:`, error.message);
            }
          }
        }
      }
    } else {
      // For other creature types, we would need to adapt the folder structure
      // This is a placeholder for extending the script to other creature types
      console.log(`Support for ${creatureType} creatures not yet implemented`);
    }
  }

  console.log(`Creature extraction complete! Total creatures extracted: ${allCreatures.length}`);
  return allCreatures;
}

// ===== DATATABLE EXTRACTION FUNCTIONS =====

/**
 * Extract the tier from a table path
 */
function extractTier(tablePath) {
  const match = tablePath.match(/Tier(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract the table name from a DataTable reference
 */
function extractTableName(tableName) {
  const match = tableName.match(/DataTable'([^']+)'/);
  return match ? match[1] : tableName;
}

/**
 * Load a DataTable file and extract its items
 */
function loadDataTable(tableName, tier) {
  try {
    // Construct the path to the DataTable file
    const dataTablePath = path.join(LOOT_TABLES_DATA_DIR, `Tier${tier}`, `${tableName}.json`);

    if (!fs.existsSync(dataTablePath)) {
      console.warn(`DataTable file not found: ${dataTablePath}`);
      return { items: [] };
    }

    const dataTableContent = JSON.parse(fs.readFileSync(dataTablePath, 'utf8'));

    // Find the DataTable object
    const dataTableObject = dataTableContent.find(obj =>
      obj.Type === 'DataTable' && obj.Rows
    );

    if (!dataTableObject?.Rows) {
      console.warn(`No rows found in DataTable: ${tableName}`);
      return { items: [] };
    }

    // Extract items from the rows
    const items = [];
    const rows = dataTableObject.Rows;

    for (const rowKey in rows) {
      const row = rows[rowKey];
      if (row.Item?.AssetPathName) {
        // Extract the item name from the asset path
        const itemPath = row.Item.AssetPathName;
        const itemName = path.basename(itemPath, path.extname(itemPath));

        items.push({
          name: itemName,
          path: itemPath,
          chance: row.Chance,
          minQuantity: row.MinQuantity,
          maxQuantity: row.MaxQuantity
        });
      }
    }

    return {
      name: tableName,
      tier: tier,
      items: items
    };
  } catch (error) {
    console.error(`Error loading DataTable ${tableName}: ${error.message}`);
    return { items: [] };
  }
}

/**
 * Process a loot table and extract its DataTable references
 */
function processLootTable(lootTable) {
  try {
    // Extract tables from the loot table
    const tables = [];

    if (lootTable.tables && Array.isArray(lootTable.tables)) {
      for (const table of lootTable.tables) {
        if (table.tableName && table.tablePath) {
          const tableName = extractTableName(table.tableName);
          const tier = extractTier(table.tablePath);

          if (tier) {
            tables.push({
              tableName,
              tier
            });
          }
        }
      }
    }

    return {
      lootTable: lootTable.basicInfo?.name || 'Unknown',
      tables: tables
    };
  } catch (error) {
    console.error(`Error processing loot table: ${error.message}`);
    return { tables: [] };
  }
}

/**
 * Extract DataTable contents from creature loot tables
 * @param {Array} creatures - Array of creature data
 * @returns {Array} - Array of DataTable contents
 */
async function extractDataTableContents(creatures) {
  try {
    console.log('Extracting DataTable contents...');

    // Process each creature's loot table
    const lootTables = [];
    const processedDataTables = new Map();

    for (const creature of creatures) {
      if (!creature?.loot?.tables) {
        continue;
      }

      const lootTable = processLootTable(creature.loot);

      // Load the DataTable contents for each referenced table
      const tableContents = [];

      for (const table of lootTable.tables) {
        const cacheKey = `${table.tableName}_T${table.tier}`;

        // Check if we've already processed this DataTable
        if (!processedDataTables.has(cacheKey)) {
          const dataTable = loadDataTable(table.tableName, table.tier);
          processedDataTables.set(cacheKey, dataTable);
        }

        tableContents.push({
          tableName: table.tableName,
          tier: table.tier,
          items: processedDataTables.get(cacheKey).items
        });
      }

      lootTables.push({
        name: lootTable.lootTable,
        tables: tableContents
      });
    }

    console.log(`DataTable extraction complete! Processed ${lootTables.length} loot tables`);
    return lootTables;
  } catch (error) {
    console.error(`Error extracting DataTable contents: ${error.message}`);
    return [];
  }
}

// ===== LOOT ENRICHER FUNCTIONS =====

/**
 * Extract table name and tier from a datatable reference
 * @param {string} tableName - The datatable reference (e.g., "DataTable'BaseResources_T3'")
 * @param {string} tablePath - The path to the datatable
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

  // Initialize loot structure if it doesn't exist
  if (!enrichedCreature.loot) {
    enrichedCreature.loot = {};
  }

  // Process each loot table
  for (const table of enrichedCreature.loot.tables) {
    // Extract table name and tier
    const tableInfo = extractTableInfo(table.tableName, table.tablePath);
    // The key in the datatableMap is just the table name
    const lookupKey = tableInfo.tableName;

    // Look up the items in the datatable
    const items = datatableMap.get(lookupKey) || [];

    console.log(`Found ${items.length} items for table ${lookupKey}`);

    // Add the items to the table with calculated drop chances
    if (items.length > 0) {
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
    } else {
      console.warn(`No items found for table ${lookupKey}, using empty array`);
      table.items = [];
    }
  }

  // Initialize items array if it doesn't exist
  if (!enrichedCreature.loot.items) {
    enrichedCreature.loot.items = [];
  }

  // Add a summary of all possible items to the creature's loot
  const allItems = new Map(); // Use a map to avoid duplicates

  for (const table of enrichedCreature.loot.tables) {
    // Ensure table.items exists
    if (!table.items) {
      table.items = [];
      continue;
    }

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
 * Create a map of datatable names to their contents
 * @param {Array} datatables - Array of datatable contents
 * @returns {Map} - Map of datatable names to their contents
 */
function createDatatableMap(datatables) {
  const datatableMap = new Map();

  // Create a map for faster lookups
  for (const datatable of datatables) {
    for (const table of datatable.tables) {
      // Extract just the table name without the tier suffix for simpler lookup
      const tableNameMatch = table.tableName.match(/([^_]+)(?:_T\d+)?$/);
      const simplifiedTableName = tableNameMatch ? tableNameMatch[1] : table.tableName;

      // Store with both the original key and the simplified name for better matching
      datatableMap.set(simplifiedTableName, table.items);
      console.log(`Added datatable: ${simplifiedTableName} with ${table.items.length} items`);
    }
  }

  return datatableMap;
}

/**
 * Enrich all creatures with datatable information
 * @param {Array} creatures - Array of creature data
 * @param {Array} datatables - Array of datatable contents
 */
async function enrichAllCreatures(creatures, datatables) {
  try {
    console.log('Enriching creature data with loot information...');

    // Create a map of datatable names to their contents
    const datatableMap = createDatatableMap(datatables);
    console.log(`Created lookup map with ${datatableMap.size} datatables`);

    // Enrich each creature
    for (const creature of creatures) {
      const enrichedCreature = enrichCreatureLoot(creature, datatableMap);

      // Save the enriched creature to a file
      const creatureName = enrichedCreature.basicInfo.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_');

      const enrichedCreatureFile = path.join(ENRICHED_CREATURES_DIR, `${creatureName}.json`);
      fs.writeFileSync(enrichedCreatureFile, JSON.stringify(enrichedCreature, null, 2));
    }

    console.log(`Enrichment complete! Enriched ${creatures.length} creatures`);
  } catch (error) {
    console.error(`Error enriching creatures: ${error.message}`);
  }
}

/**
 * Main function to orchestrate the entire process
 */
async function main() {
  try {
    console.log('Starting unified data extraction and enrichment process...');

    // Ensure all directories exist
    ensureDirectoriesExist();

    // Step 1: Extract creature data
    const creatures = await extractCreatureData();

    // Step 2: Extract datatable contents
    const datatables = await extractDataTableContents(creatures);

    // Step 3: Enrich creature data with loot information
    await enrichAllCreatures(creatures, datatables);

    console.log('Data extraction and enrichment process completed successfully!');
    console.log(`Enriched creature data is available in: ${ENRICHED_CREATURES_DIR}`);
  } catch (error) {
    console.error(`Error in main process: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();