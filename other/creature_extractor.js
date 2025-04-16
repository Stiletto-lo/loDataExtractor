/**
 * Game Data Extractor
 * 
 * This script extracts information about creatures and loot tables from game data files
 * and outputs it in a structured JSON format.
 * 
 * The script can extract:
 * - Creature basic information (name, type, file location)
 * - Stats (health, experience)
 * - Loot tables and drop chances
 * - Equipment
 * - All loot tables in the game, regardless of creature references
 */

const fs = require('node:fs');
const path = require('node:path');

// Configuration
const CONFIG = {
  baseDir: path.resolve(__dirname, '..'),
  outputDir: path.resolve(__dirname, '../output'),
  creaturesDir: path.resolve(__dirname, '../output/creatures'),
  lootTablesDir: path.resolve(__dirname, '../output/loot_tables'),
  creatureTypes: ['Rupu', 'Nurr', 'Koa', 'Okkam', 'Phemke', 'Killin', 'Papak'],
  tierFolders: ['Tier1', 'Tier2', 'Tier3', 'Tier4'],
  localizationFile: 'Mist/Content/Localization/Game/en/Game.json',
  lootTablePaths: [
    'Mist/Content/Mist/Data/LootTables/LootTables',
    'Mist/Content/Mist/Data/LootTables/LootTemplates'
  ]
};

// Ensure output directories exist
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Ensure creatures directory exists
if (!fs.existsSync(CONFIG.creaturesDir)) {
  fs.mkdirSync(CONFIG.creaturesDir, { recursive: true });
}

// Ensure loot tables directory exists
if (!fs.existsSync(CONFIG.lootTablesDir)) {
  fs.mkdirSync(CONFIG.lootTablesDir, { recursive: true });
}

/**
 * Main function to extract creature and loot table data
 */
async function extractCreatureData() {
  console.log('Starting data extraction...');

  // Load localization data
  const localizationData = loadLocalizationData();

  const allCreatures = [];

  // Process each creature type
  for (const creatureType of CONFIG.creatureTypes) {
    console.log(`Processing ${creatureType} creatures...`);

    // For Rupu creatures, we know the exact folder structure
    if (creatureType === 'Rupu') {
      for (const tier of CONFIG.tierFolders) {
        const tierPath = path.join(CONFIG.baseDir, 'Mist/Content/Mist/Characters/Creatures/Monkey/Rupu', tier);

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

  // Save each creature to its own file
  for (const creature of allCreatures) {
    const creatureName = creature.basicInfo.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_');
    const creatureFile = path.join(CONFIG.creaturesDir, `${creatureName}.json`);
    fs.writeFileSync(creatureFile, JSON.stringify(creature, null, 2));
  }

  console.log(`Creature extraction complete! Individual creature files saved to ${CONFIG.creaturesDir}`);
  console.log(`Total creatures extracted: ${allCreatures.length}`);

  // Extract all loot tables
  console.log('Starting extraction of all loot tables...');
  await extractAllLootTables();

  // Generate a summary report
  generateSummaryReport(allCreatures);
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
      CONFIG.baseDir,
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
  console.log(`Processing loot table: ${path.basename(filePath)}`);

  // Prevent circular references
  if (processedTables.has(filePath)) {
    console.log(`Skipping already processed table: ${filePath}`);
    return null;
  }
  processedTables.add(filePath);

  // Load and parse the loot table file
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lootTableData = JSON.parse(fileContent);

  // Check if this is a DataTable with direct Rows (newer format)
  const dataTableObject = lootTableData.find(obj =>
    obj.Type === 'DataTable' && obj.Rows
  );

  if (dataTableObject?.Rows) {
    // Process direct rows format
    const rows = dataTableObject.Rows || {};
    const itemEntries = [];

    for (const rowName in rows) {
      const row = rows[rowName];
      if (row) {
        // Extract item details
        let itemPath = 'Unknown';
        let itemName = 'Unknown';
        let displayName = rowName; // Use row name as fallback

        if (row.Item?.AssetPathName) {
          itemPath = row.Item.AssetPathName;
          // Extract name from path
          const pathParts = itemPath.split('/');
          const lastPart = pathParts[pathParts.length - 1];
          displayName = lastPart.split('.')[0];
          itemName = displayName;
        }

        itemEntries.push({
          rowName: rowName,
          itemPath: itemPath,
          itemName: itemName,
          displayName: displayName,
          weight: row.Weight || 0,
          quantity: {
            min: row.MinQuantity || 1,
            max: row.MaxQuantity || 1
          },
          chance: row.Chance || 1.0,
          fraction: row.Fraction || 1.0,
          itemDetails: {
            description: 'Item from loot table',
            category: getCategoryFromPath(itemPath),
            tier: getTierFromPath(itemPath) || getTierFromName(displayName)
          }
        });
      }
    }

    // Save this loot table to its own file
    const tableId = path.basename(filePath, '.json');
    const lootTableFile = path.join(CONFIG.lootTablesDir, `${tableId}.json`);

    const lootTableInfo = {
      filePath: filePath.replace(CONFIG.baseDir, '').replace(/\\/g, '/'),
      tables: [],
      allItems: itemEntries
    };

    fs.writeFileSync(lootTableFile, JSON.stringify(lootTableInfo, null, 2));

    return {
      tables: [],
      items: itemEntries
    };
  }

  // Find the default object which contains the loot tables
  const defaultObject = lootTableData.find(obj =>
    obj.Name?.startsWith('Default__') && obj?.Properties?.Loot
  );

  if (!defaultObject?.Properties?.Loot) {
    return null;
  }

  // Extract the tables
  const tables = defaultObject.Properties.Loot.Tables || [];
  const tableEntries = [];
  const itemEntries = [];

  // Process each table reference
  for (const table of tables) {
    const tableEntry = {
      tablePath: table.Table ? table.Table.ObjectPath : 'Unknown',
      tableName: table.Table ? table.Table.ObjectName : 'Unknown',
      runChance: table.RunChance || 0,
      iterations: {
        min: table.MinIterations || 0,
        max: table.MaxIterations || 0,
        perIterationChance: table.PerIterationRunChance || 0
      },
      quantityMultiplier: {
        min: table.MinQuantityMultiplier || 0,
        max: table.MaxQuantityMultiplier || 0
      },
      items: []
    };

    // If this table references another table, try to extract its items
    if (table.Table?.ObjectPath) {
      const nestedTablePath = path.join(
        CONFIG.baseDir,
        `${table.Table.ObjectPath.split('.')[0]}.json`
      );

      if (fs.existsSync(nestedTablePath)) {
        try {
          const nestedTableData = extractItemsFromTable(nestedTablePath, processedTables);
          if (nestedTableData?.items) {
            tableEntry.items = nestedTableData.items;
            itemEntries.push(...nestedTableData.items);
          }
        } catch (error) {
          console.error(`Error processing nested table ${nestedTablePath}:`, error.message);
        }
      }
    }

    tableEntries.push(tableEntry);
  }

  // Save this loot table to its own file
  const tableId = path.basename(filePath, '.json');
  const lootTableFile = path.join(CONFIG.lootTablesDir, `${tableId}.json`);

  const lootTableInfo = {
    filePath: filePath.replace(CONFIG.baseDir, '').replace(/\\/g, '/'),
    tables: tableEntries,
    allItems: itemEntries
  };

  fs.writeFileSync(lootTableFile, JSON.stringify(lootTableInfo, null, 2));

  return {
    tables: tableEntries,
    items: itemEntries
  };
}

/**
 * Extract items from a loot table
 * @param {string} filePath - Path to the loot table JSON file
 * @param {Set} processedTables - Set of already processed table paths
 * @returns {Object} - Object containing items from the table
 */
function extractItemsFromTable(filePath, processedTables = new Set()) {
  console.log(`Extracting items from table: ${path.basename(filePath)}`);

  // Prevent circular references
  if (processedTables.has(filePath)) {
    console.log(`Skipping already processed table: ${filePath}`);
    return { items: [] };
  }
  processedTables.add(filePath);

  try {
    // Load and parse the loot table file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const tableData = JSON.parse(fileContent);

    // Find the loot table data object
    const dataTableObject = tableData.find(obj =>
      obj.Name === 'DataTable' && (obj?.Properties?.RowMap || obj?.Rows)
    );

    if (dataTableObject?.Rows) {
      // Process direct rows format (newer format)
      const rows = dataTableObject.Rows || {};
      const items = [];

      for (const rowName in rows) {
        const row = rows[rowName];
        if (row) {
          // Extract item details
          let itemPath = 'Unknown';
          let itemName = 'Unknown';
          let displayName = rowName; // Use row name as fallback

          if (row.Item?.AssetPathName) {
            itemPath = row.Item.AssetPathName;
            // Extract name from path
            const pathParts = itemPath.split('/');
            const lastPart = pathParts[pathParts.length - 1];
            displayName = lastPart.split('.')[0];
            itemName = displayName;
          }

          items.push({
            rowName: rowName,
            itemPath: itemPath,
            itemName: itemName,
            displayName: displayName,
            weight: row.Weight || 0,
            quantity: {
              min: row.MinQuantity || 1,
              max: row.MaxQuantity || 1
            },
            chance: row.Chance || 1.0,
            fraction: row.Fraction || 1.0,
            itemDetails: {
              description: 'Item from loot table',
              category: getCategoryFromPath(itemPath),
              tier: getTierFromPath(itemPath) || getTierFromName(displayName)
            }
          });
        }
      }

      return { items };
    }

    if (!dataTableObject?.Properties?.RowMap) {
      // Try to find a default object with loot entries
      const defaultObject = tableData.find(obj =>
        obj.Name?.startsWith('Default__') && (obj?.Properties?.Loot || obj?.Properties?.Entries)
      );

      if (defaultObject?.Properties?.Entries) {
        // Process direct entries
        const entries = defaultObject.Properties.Entries || [];
        return {
          items: entries.map(entry => {
            // Try to extract a more readable name from the item path or name
            let displayName = 'Unknown';
            const itemPath = entry.Item ? entry.Item.ObjectPath : 'Unknown';
            const itemName = entry.Item ? entry.Item.ObjectName : 'Unknown';

            if (entry.Item?.ObjectName) {
              // Extract name from ObjectName (e.g., "DataTable'ItemName'" -> "ItemName")
              const match = entry.Item.ObjectName.match(/'([^']+)'/);
              displayName = match ? match[1] : entry.Item.ObjectName;
            } else if (entry.Item?.ObjectPath) {
              // Extract name from path
              const pathParts = entry.Item.ObjectPath.split('/');
              displayName = pathParts[pathParts.length - 1].split('.')[0];
            }

            return {
              itemPath: itemPath,
              itemName: itemName,
              displayName: displayName,
              weight: entry.Weight || 0,
              quantity: {
                min: entry.MinQuantity || 1,
                max: entry.MaxQuantity || 1
              },
              chance: entry.Chance || 1.0,
              itemDetails: {
                description: 'Item from loot table',
                category: getCategoryFromPath(itemPath),
                tier: getTierFromPath(itemPath) || getTierFromName(displayName)
              }
            };
          })
        };
      }

      if (defaultObject?.Properties?.Loot) {
        // This is a nested loot table, recursively process it
        const nestedTables = defaultObject.Properties.Loot.Tables || [];
        const allItems = [];

        for (const table of nestedTables) {
          if (table.Table?.ObjectPath) {
            const nestedTablePath = path.join(
              CONFIG.baseDir,
              `${table.Table.ObjectPath.split('.')[0]}.json`
            );

            if (fs.existsSync(nestedTablePath)) {
              try {
                const nestedItems = extractItemsFromTable(nestedTablePath, processedTables);
                if (nestedItems?.items) {
                  // Add table reference to each item
                  const itemsWithTableRef = nestedItems.items.map(item => ({
                    ...item,
                    sourceTable: table.Table.ObjectPath,
                    sourceTableName: table.Table.ObjectName,
                    runChance: table.RunChance || 1.0,
                    quantityMultiplier: {
                      min: table.MinQuantityMultiplier || 1.0,
                      max: table.MaxQuantityMultiplier || 1.0
                    }
                  }));
                  allItems.push(...itemsWithTableRef);
                }
              } catch (error) {
                console.error(`Error processing nested table ${nestedTablePath}:`, error.message);
              }
            }
          }
        }

        return { items: allItems };
      }

      return { items: [] };
    }

    // Process row map entries (data table format)
    const rowMap = dataTableObject.Properties.RowMap;
    const items = [];

    for (const rowName in rowMap) {
      const row = rowMap[rowName];
      if (row.Value?.Properties) {
        const itemProps = row.Value.Properties;

        // Try to extract a more readable name from the item path or name
        let displayName = rowName; // Use row name as fallback
        const itemPath = itemProps.Item ? itemProps.Item.ObjectPath : 'Unknown';
        const itemName = itemProps.Item ? itemProps.Item.ObjectName : 'Unknown';

        if (itemProps.Item?.ObjectName) {
          // Extract name from ObjectName (e.g., "DataTable'ItemName'" -> "ItemName")
          const match = itemProps.Item.ObjectName.match(/'([^']+)'/);
          displayName = match ? match[1] : itemProps.Item.ObjectName;
        } else if (itemProps.Item?.ObjectPath) {
          // Extract name from path
          const pathParts = itemProps.Item.ObjectPath.split('/');
          displayName = pathParts[pathParts.length - 1].split('.')[0];
        }

        items.push({
          rowName: rowName,
          itemPath: itemPath,
          itemName: itemName,
          displayName: displayName,
          weight: itemProps.Weight || 0,
          quantity: {
            min: itemProps.MinQuantity || 1,
            max: itemProps.MaxQuantity || 1
          },
          chance: itemProps.Chance || 1.0,
          itemDetails: {
            description: 'Item from loot table',
            category: getCategoryFromPath(itemPath),
            tier: getTierFromPath(itemPath) || getTierFromName(displayName)
          }
        });
      }
    }

    return { items };
  } catch (error) {
    console.error(`Error extracting items from ${filePath}:`, error.message);
    return { items: [] };
  }
}

/**
 * Helper function to determine item category from its path
 * @param {string} itemPath - Path to the item
 * @returns {string} - Category of the item
 */
function getCategoryFromPath(itemPath) {
  if (!itemPath || itemPath === 'Unknown') return 'Unknown';

  const pathLower = itemPath.toLowerCase();

  if (pathLower.includes('/weapons/')) return 'Weapon';
  if (pathLower.includes('/armors/')) return 'Armor';
  if (pathLower.includes('/resources/')) return 'Resource';
  if (pathLower.includes('/ammo/')) return 'Ammunition';
  if (pathLower.includes('/tools/')) return 'Tool';
  if (pathLower.includes('/consumables/')) return 'Consumable';
  if (pathLower.includes('/crafting/')) return 'Crafting Material';
  if (pathLower.includes('/special/')) return 'Special Item';

  return 'Miscellaneous';
}

/**
 * Helper function to determine item tier from its path
 * @param {string} itemPath - Path to the item
 * @returns {string} - Tier of the item or null if not found
 */
function getTierFromPath(itemPath) {
  if (!itemPath || itemPath === 'Unknown') return null;

  // Check for tier indicators in the path
  if (itemPath.includes('_T1') || itemPath.includes('/T1/') || itemPath.includes('/Tier1/')) return 'Tier 1';
  if (itemPath.includes('_T2') || itemPath.includes('/T2/') || itemPath.includes('/Tier2/')) return 'Tier 2';
  if (itemPath.includes('_T3') || itemPath.includes('/T3/') || itemPath.includes('/Tier3/')) return 'Tier 3';
  if (itemPath.includes('_T4') || itemPath.includes('/T4/') || itemPath.includes('/Tier4/')) return 'Tier 4';

  return null;
}

/**
 * Helper function to determine item tier from its name
 * @param {string} itemName - Name of the item
 * @returns {string} - Tier of the item or null if not found
 */
function getTierFromName(itemName) {
  if (!itemName || itemName === 'Unknown') return null;

  const nameLower = itemName.toLowerCase();

  if (nameLower.includes('_t1') || nameLower.includes('tier1') || nameLower.includes('tier 1')) return 'Tier 1';
  if (nameLower.includes('_t2') || nameLower.includes('tier2') || nameLower.includes('tier 2')) return 'Tier 2';
  if (nameLower.includes('_t3') || nameLower.includes('tier3') || nameLower.includes('tier 3')) return 'Tier 3';
  if (nameLower.includes('_t4') || nameLower.includes('tier4') || nameLower.includes('tier 4')) return 'Tier 4';

  return null;
}

/**
 * Load localization data
 * @returns {Object} - Loaded localization data
 */
function loadLocalizationData() {
  const localizationPath = path.join(CONFIG.baseDir, CONFIG.localizationFile);

  if (!fs.existsSync(localizationPath)) {
    console.warn(`Localization file not found: ${localizationPath}`);
    return {};
  }

  try {
    const fileContent = fs.readFileSync(localizationPath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error loading localization data:', error.message);
    return {};
  }
}

/**
 * Generate a summary report of extracted creatures
 * @param {Array} creatures - Array of extracted creature data
 */
function generateSummaryReport(creatures) {
  const reportFile = path.join(CONFIG.outputDir, 'creature_summary.json');
  const lootSummaryFile = path.join(CONFIG.outputDir, 'loot_summary.json');

  // Group creatures by type, but only keep one entry per type
  const creaturesByType = {};
  for (const creature of creatures) {
    const type = creature.basicInfo.type;
    if (!creaturesByType[type]) {
      creaturesByType[type] = {
        name: creature.basicInfo.name,
        health: creature.stats.health,
        experience: creature.stats.experience
      };
    }
  }

  // Create summary report
  const summary = Object.keys(creaturesByType).map(type => ({
    ...creaturesByType[type]
  }));

  fs.writeFileSync(reportFile, JSON.stringify(summary, null, 2));
  console.log(`Summary report saved to ${reportFile}`);

  // Generate loot summary
  generateLootSummary(lootSummaryFile);
}

/**
 * Generate a summary of all loot tables
 * @param {string} outputFile - Path to save the summary
 */
function generateLootSummary(outputFile) {
  console.log('Generating loot tables summary...');

  if (!fs.existsSync(CONFIG.lootTablesDir)) {
    console.warn(`Loot tables directory not found: ${CONFIG.lootTablesDir}`);
    return;
  }

  const lootFiles = fs.readdirSync(CONFIG.lootTablesDir)
    .filter(file => file.endsWith('.json'));

  const allItems = new Map();
  const tableReferences = new Map();
  const allTables = new Map();
  const itemsByTable = new Map();

  // Process each loot table file
  for (const file of lootFiles) {
    try {
      const filePath = path.join(CONFIG.lootTablesDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lootData = JSON.parse(fileContent);

      // Track which tables reference which items
      const tableId = path.basename(file, '.json');

      // Process items from this table
      if (lootData.allItems && Array.isArray(lootData.allItems)) {
        // Store items by table for later use
        if (!itemsByTable.has(tableId)) {
          itemsByTable.set(tableId, []);
        }

        for (const item of lootData.allItems) {
          const itemId = item.itemName || item.itemPath;

          // Add to table-specific items collection
          itemsByTable.get(tableId).push({
            ...item,
            tableId: tableId
          });

          // Add to global items collection
          if (!allItems.has(itemId)) {
            allItems.set(itemId, {
              name: item.itemName || 'Unknown',
              displayName: item.displayName || 'Unknown',
              path: item.itemPath || 'Unknown',
              tables: [tableId],
              minQuantity: item.quantity?.min || 1,
              maxQuantity: item.quantity?.max || 1,
              chance: item.chance || 0,
              weight: item.weight || 0,
              sourceTable: item.sourceTable || '',
              sourceTableName: item.sourceTableName || ''
            });
          } else {
            const existingItem = allItems.get(itemId);
            if (!existingItem.tables.includes(tableId)) {
              existingItem.tables.push(tableId);
            }
            // Update min/max quantities if this instance has more extreme values
            if (item.quantity?.min < existingItem.minQuantity) {
              existingItem.minQuantity = item.quantity.min;
            }
            if (item.quantity?.max > existingItem.maxQuantity) {
              existingItem.maxQuantity = item.quantity.max;
            }
          }
        }
      }

      // Add this table to the collection of all tables
      allTables.set(tableId, {
        id: tableId,
        path: lootData.filePath || 'Unknown',
        tables: lootData.tables || [],
        items: []
      });

      // Track table references
      if (lootData.tables && Array.isArray(lootData.tables)) {
        for (const table of lootData.tables) {
          const refTableId = table.tableName || table.tablePath;
          if (!tableReferences.has(refTableId)) {
            tableReferences.set(refTableId, [tableId]);
          } else {
            tableReferences.get(refTableId).push(tableId);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing loot summary for ${file}:`, error.message);
    }
  }

  // Create the summary structure
  const summary = {
    totalLootTables: lootFiles.length,
    items: Array.from(allItems.values()),
    tables: Array.from(allTables.values()),
    tableReferences: Array.from(tableReferences.entries()).map(([table, references]) => ({
      table,
      referencedBy: references
    }))
  };

  // Now populate the items for each table and nested table
  for (const table of summary.tables) {
    // Find all items that belong to this table
    const tableItems = itemsByTable.get(table.id) || [];

    // Add items to the main table with detailed information
    table.items = tableItems.map(item => ({
      name: item.displayName || item.itemName || 'Unknown',
      path: item.itemPath || 'Unknown',
      chance: item.chance || 0,
      weight: item.weight || 0,
      quantity: {
        min: item.quantity?.min || 1,
        max: item.quantity?.max || 1
      },
      details: item.itemDetails || {
        description: 'Item from loot table',
        category: getCategoryFromPath(item.itemPath || 'Unknown'),
        tier: getTierFromPath(item.itemPath || 'Unknown') || getTierFromName(item.displayName || 'Unknown')
      }
    }));

    // Process each nested table
    for (const nestedTable of table.tables) {
      // Initialize items array
      nestedTable.items = [];

      // Find items that belong to this nested table
      const nestedTablePath = nestedTable.tablePath;
      const nestedTableName = nestedTable.tableName;

      // Look for items from all tables that match this nested table
      for (const [tableId, items] of itemsByTable.entries()) {
        for (const item of items) {
          // Check if this item belongs to the nested table
          if (item.sourceTable === nestedTablePath ||
            item.sourceTableName === nestedTableName) {

            // Calculate effective chance and quantity based on table multipliers
            const effectiveChance = item.chance * (nestedTable.runChance || 1);
            const minQuantity = Math.round((item.quantity?.min || 1) * (nestedTable.quantityMultiplier?.min || 1) * 100) / 100;
            const maxQuantity = Math.round((item.quantity?.max || 1) * (nestedTable.quantityMultiplier?.max || 1) * 100) / 100;

            // Add to nested table items with detailed information
            nestedTable.items.push({
              name: item.displayName || item.itemName || 'Unknown',
              path: item.itemPath || 'Unknown',
              chance: effectiveChance,
              weight: item.weight || 0,
              quantity: {
                min: minQuantity,
                max: maxQuantity
              },
              details: item.itemDetails || {
                description: 'Item from loot table',
                category: getCategoryFromPath(item.itemPath || 'Unknown'),
                tier: getTierFromPath(item.itemPath || 'Unknown') || getTierFromName(item.displayName || 'Unknown')
              }
            });
          }
        }
      }
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));
  console.log(`Loot summary saved to ${outputFile}`);
}

/**
 * Validate the data in the creature_data_analysis.md file
 */
function validateAnalysisDocument() {
  console.log('Validating creature_data_analysis.md document...');

  // Example validation: Check if the Rupu Bounty Hunter data is accurate
  const bountyHunterPath = path.join(
    CONFIG.baseDir,
    'Mist/Content/Mist/Characters/Creatures/Monkey/Rupu/Tier2/T2_RupuBountyHunter.json'
  );

  if (!fs.existsSync(bountyHunterPath)) {
    console.log('Could not find Rupu Bounty Hunter file for validation');
    return;
  }

  try {
    const fileContent = fs.readFileSync(bountyHunterPath, 'utf8');
    const data = JSON.parse(fileContent);

    // Find health component
    const healthComponent = data.find(obj =>
      obj.Name === 'HealthComponent' && obj?.Properties?.MaxHealth
    );

    // Find mob variation component
    const mobVariationComponent = data.find(obj =>
      obj.Name === 'MobVariationComponent' && obj.Properties
    );

    if (healthComponent && mobVariationComponent) {
      const health = healthComponent.Properties.MaxHealth;
      const experience = mobVariationComponent.Properties.ExperienceAward;

      console.log('Validation results:');
      console.log(`- Document states health: 55, actual value: ${health}`);
      console.log(`- Document states experience: 600, actual value: ${experience}`);

      if (health === 55 && experience === 600) {
        console.log('✓ The document data matches the actual game data');
      } else {
        console.log('✗ There are discrepancies between the document and the game data');
      }
    }
  } catch (error) {
    console.error('Error during validation:', error.message);
  }
}

/**
 * Extract all loot tables from the game files
 */
async function extractAllLootTables() {
  console.log('Extracting all loot tables from game files...');
  const processedTables = new Set();
  const processedPaths = new Set();

  // Process all loot table paths in the configuration
  for (const basePath of CONFIG.lootTablePaths) {
    const fullBasePath = path.join(CONFIG.baseDir, basePath);

    if (!fs.existsSync(fullBasePath)) {
      console.warn(`Loot table path not found: ${fullBasePath}`);
      continue;
    }

    // Recursively process all directories under the base path
    await processLootTableDirectory(fullBasePath, processedTables, processedPaths);
  }

  console.log(`Loot table extraction complete! Tables saved to ${CONFIG.lootTablesDir}`);
  console.log(`Total loot tables processed: ${processedTables.size}`);
}

/**
 * Process a directory for loot tables
 * @param {string} dirPath - Directory to process
 * @param {Set} processedTables - Set of already processed tables
 * @param {Set} processedPaths - Set of already processed file paths
 */
async function processLootTableDirectory(dirPath, processedTables, processedPaths) {
  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        // Recursively process subdirectories
        await processLootTableDirectory(itemPath, processedTables, processedPaths);
      } else if (stats.isFile() && item.endsWith('.json') && !processedPaths.has(itemPath)) {
        processedPaths.add(itemPath);

        try {
          // Check if this file contains a loot table
          const fileContent = fs.readFileSync(itemPath, 'utf8');
          const data = JSON.parse(fileContent);

          // Look for loot table indicators
          const hasLootTable = data.some(obj =>
            (obj.Name?.startsWith('Default__') && obj?.Properties?.Loot) ||
            (obj.Name === 'DataTable' && obj?.Properties?.RowMap)
          );

          if (hasLootTable) {
            console.log(`Processing loot table file: ${item}`);
            extractLootTable(itemPath, processedTables);
          }
        } catch (error) {
          console.error(`Error checking loot table in ${item}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Run the extraction process
extractCreatureData().then(() => {
  // Validate the analysis document
  validateAnalysisDocument();
}).catch(error => {
  console.error('Error during extraction:', error);
});