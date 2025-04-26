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

  // Defer handling of combined patterns to formatCombinedPatterns
  if (name.includes('_AC') || name.includes('(AC)')) {
    return name; // Let formatCombinedPatterns handle this case
  }

  // Match pattern like Name_T1, Name_T2, etc.
  const tierMatch = name.match(/^(.+)_T([1-4])(_Q)?$/);
  if (!tierMatch) { return name; }

  const baseName = tierMatch[1];
  const tier = tierMatch[2];
  const isQuality = tierMatch[3] === '_Q';

  // Format as "Name (TX)" or "Name (TX) Quality"
  return isQuality
    ? `${baseName} (T${tier}) Quality`
    : `${baseName} (T${tier})`;
}

/**
 * Automatically formats a name with AC pattern (Name_AC) to readable format (Name (AC))
 * @param {string} name - The original name with AC pattern
 * @returns {string} - The formatted name
 */
function formatACName(name) {
  if (!name) return name;

  // Match pattern like Name_AC
  const acMatch = name.match(/^(.+)_AC$/);
  if (!acMatch) return name;

  const baseName = acMatch[1];

  // Format as "Name (AC)"
  return `${baseName} (AC)`;
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
 * Formats a name that contains both tier and AC patterns
 * @param {string} name - The original name with combined patterns
 * @returns {string} - The properly formatted name
 */
function formatCombinedPatterns(name) {
  if (!name) return name;

  // Case 1: Name_TX_AC -> Name (TX) (AC)
  const pattern1 = /^(.+)_T([1-4])_AC$/;
  const match1 = name.match(pattern1);
  if (match1) {
    return `${match1[1]} (T${match1[2]}) (AC)`;
  }

  // Case 2: Name_TX (AC) -> Name (TX) (AC)
  const pattern2 = /^(.+)_T([1-4])\s*\(AC\)$/;
  const match2 = name.match(pattern2);
  if (match2) {
    return `${match2[1]} (T${match2[2]}) (AC)`;
  }

  // Case 3: Name (TX)_AC -> Name (TX) (AC)
  const pattern3 = /^(.+)\s*\(T([1-4])\)\s*_AC$/;
  const match3 = name.match(pattern3);
  if (match3) {
    return `${match3[1]} (T${match3[2]}) (AC)`;
  }

  return name;
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

  // Step 3.5: Check for combined patterns (tier + AC)
  // Check for patterns like Name_TX_AC, Name_TX (AC), Name (TX)_AC
  const combinedFormatted = formatCombinedPatterns(name);
  if (combinedFormatted !== name) {
    console.log(`Formatted combined pattern name ${name} to ${combinedFormatted}`);
    return combinedFormatted;
  }

  // Step 3.6: Check if name follows AC pattern (Name_AC)
  const acPattern = /^(.+)_AC$/;
  const acMatch = name.match(acPattern);
  if (acMatch) {
    // Check if there's an explicit translation for the base name
    const baseName = acMatch[1];
    if (additionalTranslations[baseName]) {
      const translatedBase = additionalTranslations[baseName];
      const formattedName = `${translatedBase} (AC)`;
      console.log(`Translating AC name ${name} to ${formattedName} (base name translation)`);
      return formattedName;
    }

    // If no explicit translation for base name, use automatic formatting
    const acFormatted = formatACName(name);
    console.log(`Automatically formatted AC name ${name} to ${acFormatted}`);
    return acFormatted;
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
  formatTierName,
  formatACName,
  formatCombinedPatterns
};