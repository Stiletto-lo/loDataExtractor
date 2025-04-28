/**
 * Template Creature Generator
 *
 * This module creates creatures for lootTemplates that are not linked to any existing creature.
 * These lootTemplates usually correspond to map structures or other non-creature elements.
 */

const creatureTemplate = require("../../templates/creature");
const fileParser = require("../../controllers/fileParsers");

/**
 * Extracts tier information from the template name
 * @param {string} templateName - Template name
 * @returns {string|null} - The extracted tier or null if not found
 */
function extractTierFromTemplateName(templateName) {
  if (!templateName) { return null; }

  // Common patterns: EasyRupu_T2, MediumRupu_T3, etc.
  const tierMatch = templateName.match(/_T([1-4])(?:_|$)/i);
  if (tierMatch) {
    return `T${tierMatch[1]}`;
  }
  return null;
}

/**
 * Extracts an approximate category based on the template name
 * @param {string} templateName - Template name
 * @returns {string} - Extracted category or "Structure" by default
 */
function extractCategoryFromTemplateName(templateName) {
  if (!templateName) { return "Structure"; }

  // Known categories based on common names
  if (templateName.includes("Rupu")) return "Rupu";
  if (templateName.includes("Hotspot")) return "Resource";
  if (templateName.includes("Chest") || templateName.includes("Box")) return "Container";
  if (templateName.includes("Camp")) return "Camp";
  if (templateName.includes("Asteroid")) return "Resource";
  if (templateName.includes("Water")) return "Resource";

  return "Structure";
}

/**
 * Creates creatures for lootTemplates that are not linked to any existing creature
 * @returns {Array} - Array of newly created creatures
 */
function createCreaturesForOrphanedTemplates() {
  const lootTemplates = fileParser.getAllLootTemplates();
  const creatures = fileParser.getCreatures();
  const newCreatures = [];

  // Create a set of templates already assigned to creatures
  const assignedTemplates = new Set();
  for (const creature of creatures) {
    if (creature.lootTemplate) {
      assignedTemplates.add(creature.lootTemplate.toLowerCase());
    }
  }

  console.info(`Found ${lootTemplates.length} loot templates and ${creatures.length} existing creatures`);
  console.info(`${assignedTemplates.size} templates are already assigned to creatures`);

  // Identify orphaned templates and create creatures for them
  for (const template of lootTemplates) {
    if (!template.name) continue;

    const templateName = template.name.toLowerCase();

    // If this template is already assigned to a creature, skip it
    if (assignedTemplates.has(templateName)) continue;

    // Create a new creature based on the template
    const newCreature = { ...creatureTemplate };
    newCreature.name = template.name.replace(/_C$/i, '');
    newCreature.type = template.type;
    newCreature.lootTemplate = template.name;
    newCreature.tier = extractTierFromTemplateName(template.name);
    newCreature.category = extractCategoryFromTemplateName(template.name);
    newCreature.notAssigned = true;

    newCreatures.push(newCreature);
  }

  console.info(`Created ${newCreatures.length} new creatures for orphaned templates`);
  return newCreatures;
}

module.exports = {
  createCreaturesForOrphanedTemplates
};