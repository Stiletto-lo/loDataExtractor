/**
 * Name Translator Module for Creatures
 *
 * This module handles the translation of creature names using the additional translations file.
 * It applies both explicit translations and automatic formatting based on recognized patterns.
 */

const additionalTranslations = require('../../translations/aditionalTranslations');

/**
 * Automatically formats a name with tier pattern (Name_TX) to readable format (Name (TX))
 * @param {string} name - The original name with tier pattern
 * @returns {string} - The formatted name
 */
function formatTierName(name) {
  if (!name) return name;

  // Match pattern like Name_T1, Name_T2, etc.
  const tierMatch = name.match(/^(.+)_T([1-4])(_Q)?$/);
  if (!tierMatch) return name;

  const baseName = tierMatch[1];
  const tier = tierMatch[2];
  const isQuality = tierMatch[3] === '_Q';

  // Format as "Name (TX)" or "Name (TX) Quality"
  return isQuality
    ? `${baseName} (T${tier}) Quality`
    : `${baseName} (T${tier})`;
}

/**
 * Formats a camelCase name to a spaced name (e.g., DesertClam -> Desert Clam)
 * @param {string} name - The camelCase name to format
 * @returns {string} - The formatted name with spaces
 */
function formatCamelCaseName(name) {
  if (!name) return name;

  // Add spaces between lowercase and uppercase letters
  return name.replace(/([a-z])([A-Z])/g, '$1 $2');
}

/**
 * Translates a creature name if a translation exists in the additional translations file
 * @param {string} name - The original creature name to translate
 * @returns {string} - The translated name if available, otherwise the original name
 */
function translateCreatureName(name) {
  if (!name) return name;

  // Step 1: Check for direct match in translations
  if (additionalTranslations[name]) {
    console.log(`Translating ${name} to ${additionalTranslations[name]} (direct match)`);
    return additionalTranslations[name];
  }

  // Step 2: Check for numeric suffix patterns (e.g., IronOre2 -> Iron Ore)
  const numericSuffixPattern = /^(.+)(\d+)$/;
  const numericMatch = name.match(numericSuffixPattern);
  if (numericMatch) {
    const baseNameWithoutNumber = numericMatch[1];
    // Check if the base name exists in translations
    if (additionalTranslations[baseNameWithoutNumber]) {
      console.log(`Translating ${name} using base name ${baseNameWithoutNumber}`);
      return additionalTranslations[baseNameWithoutNumber];
    }
  }

  // Step 3: Check if name follows tier pattern (Name_TX or Name_TX_Q)
  const tierPattern = /^(.+)_T([1-4])(_Q)?$/;
  const tierMatch = name.match(tierPattern);
  if (tierMatch) {
    // Check if there's an explicit translation for the base name
    const baseName = tierMatch[1];
    if (additionalTranslations[baseName]) {
      const tier = tierMatch[2];
      const isQuality = tierMatch[3] === '_Q';
      const translatedBase = additionalTranslations[baseName];
      const formattedName = isQuality
        ? `${translatedBase} (T${tier}) Quality`
        : `${translatedBase} (T${tier})`;
      console.log(`Translating tiered name ${name} to ${formattedName} (base name translation)`);
      return formattedName;
    }

    // If no explicit translation for base name, use automatic formatting
    const tierFormatted = formatTierName(name);
    console.log(`Automatically formatted tier name ${name} to ${tierFormatted}`);
    return tierFormatted;
  }

  // Step 4: Handle camelCase names (e.g., DesertClam -> Desert Clam)
  if (/[a-z][A-Z]/.test(name)) {
    // Format the camelCase name
    const spacedName = formatCamelCaseName(name);

    // Check if the spaced name exists in translations
    if (additionalTranslations[spacedName]) {
      return additionalTranslations[spacedName];
    }

    return spacedName;
  }

  // Step 5: Check for alternative formats (e.g., with/without underscores)
  const alternativeNames = [
    name.replace('_', ''),  // Try without underscore
    name.replace(/([a-zA-Z])([0-9])/, '$1_$2')  // Try adding underscore before numbers
  ];

  for (const altName of alternativeNames) {
    if (additionalTranslations[altName]) {
      console.log(`Found translation using alternative format ${altName} for ${name}`);
      return additionalTranslations[altName];
    }
  }

  return name;
}

module.exports = {
  translateCreatureName,
  formatTierName
};