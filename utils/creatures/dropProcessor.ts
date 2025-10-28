/**
 * Drop Processor Module
 *
 * This module handles the processing of creature drops by connecting
 * creature lootTemplates with the corresponding lootTables and items.
 */

/**
 * Extrae el tier de un nombre de plantilla de botín
 * @param {string} templateName - Nombre de la plantilla
 * @returns {string|null} - El tier extraído o null si no se encuentra
 */
function extractTierFromTemplateName(templateName) {
  if (!templateName) { return null; }

  // Patrones comunes: EasyRupu_T2, MediumRupu_T3, etc.
  const tierMatch = templateName.match(/_T([1-4])(?:_|$)/i);
  if (tierMatch) {
    return `T${tierMatch[1]}`;
  }
  return null;
}

/**
 * Extrae el tier de un nombre de tabla de botín
 * @param {string} tableName - Nombre de la tabla
 * @returns {string|null} - El tier extraído o null si no se encuentra
 */
function extractTierFromTableName(tableName) {
  if (!tableName) { return null; }

  // Patrones comunes: ammo_t1, baseresources_t2, etc.
  const tierMatch = tableName.match(/_t([1-4])(?:_|$)/i);
  if (tierMatch) {
    return `T${tierMatch[1]}`;
  }
  return null;
}

/**
 * Normalizes template names for consistent lookup
 * @param {Array} templates - Array of template objects
 * @returns {Object} - Map of normalized names to template objects
 */
function normalizeTemplates(templates) {
  const normalizedMap = {};

  for (const template of templates) {
    if (template.name) {
      // Normalize by removing _C suffix and converting to lowercase
      const normalizedName = template.name.replace(/_C$/i, '').toLowerCase();
      normalizedMap[normalizedName] = template;
    }
  }

  return normalizedMap;
}

/**
 * Converts loot tables to a map with lowercase keys for case-insensitive lookup
 * @param {Object} lootTables - Object containing loot tables
 * @returns {Object} - Map with normalized keys
 */
function normalizeLootTables(lootTables) {
  const normalizedMap = {};

  for (const tableName in lootTables) {
    normalizedMap[tableName.toLowerCase()] = lootTables[tableName];
  }

  return normalizedMap;
}

/**
 * Finds the appropriate template for a creature
 * @param {string} templateName - The normalized template name to look for
 * @param {Object} normalizedTemplates - Map of normalized template names
 * @param {string} creatureName - Name of the creature (for logging)
 * @returns {Object|null} - The found template or null
 */
function findTemplate(templateName, normalizedTemplates, creatureName) {
  // First try direct match
  const template = normalizedTemplates[templateName];
  if (template) { return template; }

  // Try alternative matching strategies if direct match fails
  const alternativeNames = [
    `${templateName}_c`,              // Try with _c suffix
    templateName.replace('_t', 't'),  // Try different tier format
    templateName.replace('t', '_t')    // Try different tier format
  ];

  for (const altName of alternativeNames) {
    if (normalizedTemplates[altName]) {
      console.debug(`Found template using alternative name ${altName} for ${creatureName}`);
      return normalizedTemplates[altName];
    }
  }

  console.debug(`No template found for ${creatureName} with normalized template name: ${templateName}`);
  return null;
}

/**
 * Processes drops from a loot table and adds them to a creature
 * @param {Object} creature - The creature object to add drops to
 * @param {Object} lootTable - The loot table containing drops
 * @param {string} tableName - The name of the loot table (for source tracking)
 */
function addDropsFromTable(creature, lootTable, tableName) {
  // Verificar que la tabla de botín existe y tiene drops
  if (!lootTable || !lootTable.drops || !Array.isArray(lootTable.drops)) {
    console.debug(`Tabla de botín ${tableName} no encontrada o no tiene drops válidos para ${creature.name}`);
    return;
  }

  // Ensure drops array exists
  if (!creature.drops) {
    creature.drops = [];
  }

  for (const drop of lootTable.drops) {
    // Skip if this drop already exists
    const existingDrop = creature.drops.find(d => d.name === drop.name);
    if (existingDrop) { continue; }

    // Add the drop to the creature
    creature.drops.push({
      name: drop.name,
      chance: drop.chance,
      minQuantity: drop.minQuantity,
      maxQuantity: drop.maxQuantity,
      source: tableName
    });
  }
}

/**
 * Adds drop information to creatures based on their lootTemplate property
 * @param {Array} creatures - The array of creature objects to process
 * @param {Array} lootTemplates - The array of loot templates
 * @param {Object} lootTables - The object containing loot tables
 * @returns {Array} - Enhanced creature data with drop information
 */
function addDropInformation(creatures, lootTemplates, lootTables) {
  // Validate inputs
  if (!Array.isArray(creatures) || creatures.length === 0) {
    console.warn("No creatures to add drop information to");
    return creatures;
  }

  if (!lootTemplates || !lootTables) {
    console.warn("Missing loot templates or loot tables data");
    return creatures;
  }

  console.info(`Adding drop information to ${creatures.length} creatures`);

  // Prepare normalized lookup maps
  const normalizedTemplates = normalizeTemplates(lootTemplates);
  const lootTablesMap = normalizeLootTables(lootTables);

  // Process each creature
  return creatures.map(creature => {
    // Skip if creature has no lootTemplate
    if (!creature.lootTemplate) { return creature; }

    // Normalize the creature's lootTemplate
    const normalizedTemplateName = creature.lootTemplate.replace(/_C$/i, '').toLowerCase();

    // Find the matching template
    const templateToUse = findTemplate(normalizedTemplateName, normalizedTemplates, creature.name);
    if (!templateToUse) { return creature; }

    if (!creature.drops) {
      creature.drops = [];
    }

    // Process each table in the template
    for (const tableRef of templateToUse.tables) {
      const tableName = tableRef.name ? tableRef.name.toLowerCase() : null;
      if (!tableName) continue;

      const creatureTier = creature.tier || extractTierFromTemplateName(creature.lootTemplate);
      const tableTier = extractTierFromTableName(tableName);

      if (tableTier && creatureTier && tableTier !== creatureTier) {
        continue;
      }

      const lootTable = lootTablesMap[tableName];
      addDropsFromTable(creature, lootTable, tableName);
    }

    return creature;
  });
}

module.exports = {
  addDropInformation,
  // Exportar funciones auxiliares para facilitar pruebas unitarias
  normalizeTemplates,
  normalizeLootTables,
  findTemplate,
  addDropsFromTable,
  extractTierFromTemplateName,
  extractTierFromTableName
};