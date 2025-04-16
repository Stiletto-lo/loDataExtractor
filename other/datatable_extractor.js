/**
 * DataTable Extractor
 * 
 * This script extracts the specific items contained in each DataTable referenced in the loot tables.
 * It reads the loot table JSON files, identifies the DataTables they reference, and then
 * looks up the actual items contained in those DataTables.
 */

const fs = require('node:fs');
const path = require('node:path');

// Base paths
const EXPORTS_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(EXPORTS_DIR, 'output');
const LOOT_TABLES_DIR = path.join(OUTPUT_DIR, 'loot_tables');
const MIST_DATA_DIR = path.join(EXPORTS_DIR, 'Mist', 'Content', 'Mist', 'Data');
const LOOT_TABLES_DATA_DIR = path.join(MIST_DATA_DIR, 'LootTables', 'LootTables');

// Output file
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'datatable_contents.json');

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
 * Process a loot table file and extract its DataTable references
 */
function processLootTable(filePath) {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const fileName = path.basename(filePath, '.json');

    // Extract tables from the loot table
    const tables = [];

    if (content.tables && Array.isArray(content.tables)) {
      for (const table of content.tables) {
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
      lootTable: fileName,
      tables: tables
    };
  } catch (error) {
    console.error(`Error processing loot table ${filePath}: ${error.message}`);
    return { tables: [] };
  }
}

/**
 * Main function to extract DataTable contents
 */
async function extractDataTableContents() {
  try {
    // Get all loot table files
    const lootTableFiles = fs.readdirSync(LOOT_TABLES_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(LOOT_TABLES_DIR, file));

    console.log(`Found ${lootTableFiles.length} loot table files`);

    // Process each loot table file
    const lootTables = [];
    const processedDataTables = new Map();

    for (const filePath of lootTableFiles) {
      const lootTable = processLootTable(filePath);

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

    // Write the results to the output file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(lootTables, null, 2));
    console.log(`DataTable contents written to ${OUTPUT_FILE}`);

    return lootTables;
  } catch (error) {
    console.error(`Error extracting DataTable contents: ${error.message}`);
    return [];
  }
}

// Run the extraction
extractDataTableContents().then(() => {
  console.log('DataTable extraction complete');
});