/**
 * Name Translator Module for Creatures
 *
 * This module handles the translation of creature names using the additional translations file.
 */

const additionalTranslations = require('../../translations/aditionalTranslations');

/**
 * Translates a creature name if a translation exists in the additional translations file
 * @param {string} name - The original creature name to translate
 * @returns {string} - The translated name if available, otherwise the original name
 */
function translateCreatureName(name) {
  if (!name) return name;

  // Check if the name exists in the additional translations
  if (additionalTranslations[name]) {
    console.log(`Translating ${name} to ${additionalTranslations[name]} (direct match)`);
    return additionalTranslations[name];
  }

  // Handle special cases like DesertClam -> Desert Clam
  // Look for camelCase patterns and add spaces
  const spacedName = name.replace(/([a-z])([A-Z])/g, '$1 $2');
  if (spacedName !== name) {
    console.log(`Converted ${name} to spaced name: ${spacedName}`);
    // Check if the spaced name exists in translations
    if (additionalTranslations[spacedName]) {
      console.log(`Translating ${spacedName} to ${additionalTranslations[spacedName]} (after spacing)`);
      return additionalTranslations[spacedName];
    }
    console.log(`Using spaced name for ${name}: ${spacedName}`);
    return spacedName;
  }

  return name;
}

module.exports = {
  translateCreatureName
};