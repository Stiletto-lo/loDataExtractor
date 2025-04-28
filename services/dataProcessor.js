

const fileParser = require("../controllers/fileParsers");

const orderByCategoryAndName = (a, b) => {
  if (a.category < b.category) {
    return -1;
  }

  if (a.category > b.category) {
    return 1;
  }

  if (a.name < b.name) {
    return -1;
  }

  if (a.name > b.name) {
    return 1;
  }

  return 0;
};

const orderByName = (a, b) => {
  if (a.name < b.name) {
    return -1;
  }

  if (a.name > b.name) {
    return 1;
  }
  return 0;
};

const processItems = () => {
  console.info("Parse Upgrades to Items");
  fileParser.parseUpgradesToItems();

  let allItems = fileParser.getAllItems();
  const translator = fileParser.getTranslator();

  console.info("Translating the items");
  allItems = translator.addDescriptions(allItems);
  allItems = translator.translateItems(allItems);

  console.info("Cleaning up the items");
  for (const item of allItems) {
    for (const key of Object.keys(item)) {
      if (item[key] === undefined) {
        delete item[key];
      }
    }

    if (item?.drops !== undefined && item.drops.length <= 0) {
      item.drops = undefined;
    }
    if (item?.toolInfo !== undefined && item.toolInfo.length <= 0) {
      item.toolInfo = undefined;
    }

    if (item?.learn && item.learn.length === 0) {
      item.learn = undefined;
    }
  }

  console.info("Items: Normalizing names and removing duplicates");

  // Normalize item names to handle cases like "SinusDestroyer" vs "Sinus Destroyer" vs "Sinus-Destroyer"
  const normalizeItemName = (name) => {
    if (!name) return '';

    return name
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Insert space between lowercase and uppercase letters
      .replace(/-/g, ' ')                   // Replace hyphens with spaces
      .replace(/_/g, ' ')                   // Replace underscores with spaces
      .replace(/\s+/g, ' ')                 // Replace multiple spaces with a single space
      .trim();                              // Trim leading/trailing spaces
  };

  // First pass: normalize names
  allItems = allItems.map(item => {
    if (item.name) {
      const normalizedName = normalizeItemName(item.name);
      if (normalizedName !== item.name) {
        item.name = normalizedName;
      }
    }
    return item;
  });

  const typeMap = new Map();

  for (const item of allItems) {
    if (item.type) {
      if (typeMap.has(item.type)) {
        const existingItem = typeMap.get(item.type);

        const existingItemProps = Object.entries(existingItem).filter(([_, v]) => v !== undefined && v !== null).length;
        const currentItemProps = Object.entries(item).filter(([_, v]) => v !== undefined && v !== null).length;

        if (currentItemProps > existingItemProps) {
          typeMap.set(item.type, item);
        }
      } else {
        typeMap.set(item.type, item);
      }
    }
  }

  const uniqueByTypeItems = Array.from(typeMap.values());

  allItems = uniqueByTypeItems
    .filter((item) => item.name && Object.keys(item).length > 2)
    .reduce((acc, current) => {
      const x = acc.find((item) => item.name === current.name);
      if (!x) {
        return acc.concat([current]);
      }

      return acc;
    }, []);


  // Second pass: merge duplicates and filter

  const typeGroups = new Map();
  for (const item of allItems) {
    if (item.type) {
      const typeLowerCase = item.type.toLowerCase();
      if (!typeGroups.has(typeLowerCase)) {
        typeGroups.set(typeLowerCase, []);
      }
      typeGroups.get(typeLowerCase).push(item);
    }
  }

  const mergedItems = [];
  for (const [type, items] of typeGroups.entries()) {
    if (items.length > 1) {
      const mergedItem = items.reduce((merged, current) => {
        for (const [key, value] of Object.entries(current)) {
          if (value !== undefined && value !== null) {
            merged[key] = value;
          }
        }
        return merged;
      }, {});
      mergedItems.push(mergedItem);
    } else if (items.length === 1) {
      mergedItems.push(items[0]);
    }
  }

  for (const item of allItems) {
    if (!item.type) {
      mergedItems.push(item);
    }
  }

  allItems = mergedItems.map(item => {
    if (item.translation && !item.name.includes("(1 of 2)")) {
      item.name = item.translation;
    }
    return item;
  });

  // Sort items by name
  allItems.sort(orderByName);

  return allItems;
};

const processTechData = () => {
  console.info("Extracting tech data from fileParser");
  let techData = fileParser.getTechData();

  console.info("Tech: Normalizing names and removing duplicates");

  // Reuse the same normalization function from processItems
  const normalizeItemName = (name) => {
    if (!name) return '';

    return name
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Insert space between lowercase and uppercase letters
      .replace(/-/g, ' ')                   // Replace hyphens with spaces
      .replace(/_/g, ' ')                   // Replace underscores with spaces
      .replace(/\s+/g, ' ')                 // Replace multiple spaces with a single space
      .trim();                              // Trim leading/trailing spaces
  };

  // First pass: normalize tech names, parent names, and unlocks
  techData = techData.map(tech => {
    // Normalize tech name
    if (tech.name) {
      const normalizedName = normalizeItemName(tech.name);
      if (normalizedName !== tech.name) {
        tech.name = normalizedName;
      }
    }

    // Normalize parent name
    if (tech.parent) {
      const normalizedParent = normalizeItemName(tech.parent);
      if (normalizedParent !== tech.parent) {
        tech.parent = normalizedParent;
      }
    }

    // Normalize unlocks array
    if (tech.unlocks && Array.isArray(tech.unlocks)) {
      tech.unlocks = tech.unlocks.map(unlock => {
        const normalizedUnlock = normalizeItemName(unlock);
        return normalizedUnlock;
      });
    }

    return tech;
  });

  // Second pass: merge duplicates and filter
  techData = techData
    .map((tech) => {
      const countTech = techData.filter((tech2) => tech.name === tech2.name);
      if (countTech.length > 1) {
        return { ...countTech[0], ...countTech[1] };
      }
      return tech;
    })
    .filter((tech) => tech.name && Object.keys(tech).length > 2)
    .reduce((acc, current) => {
      const x = acc.find((tech) => tech.name === current.name);
      if (!x) {
        return acc.concat([current]);
      }
      return acc;
    }, [])
    .map((tech) => ({
      name: tech.name,
      parent: tech.parent,
      category: tech.category,
      onlyDevs: tech.onlyDevs,
      unlocks: tech.unlocks,
      level: tech.level,
      pointsCost: tech.pointsCost,
    }));


  // Sort technology data by name
  techData.sort(orderByName);

  return techData;
};

/**
 * Creates a minimal version of the items
 * @param {Array} allItems - Array of complete items
 * @returns {Array} - Array of items in minimal version
 */
const createMinItems = (allItems) => {
  const minItems = allItems.map((item) => {
    const essentialFields = [
      "category",
      "name",
      "crafting",
    ];
    const minItem = {};

    for (const key of essentialFields) {
      if (item[key]) {
        minItem[key] = item[key];
      }
    }

    return minItem;
  });

  minItems.sort(orderByCategoryAndName);

  return minItems;
};

/**
 * Processes creature data
 * @returns {Array} - Array of processed creatures
 */
const processCreatures = () => {
  console.info("Processing creatures with enhanced data");
  const creatureProcessor = require("../utils/creatureProcessor");
  let creatures = fileParser.getCreatures();

  // Process creatures with enhanced data
  creatures = creatureProcessor.processCreatures(
    creatures,
  );

  // Sort creatures by name
  creatures.sort(orderByName);

  return creatures;
};

/**
 * Processes strongbox items to add drop information
 * @param {Array} items - The items to process (optional)
 * @returns {Array} - Array of items with strongbox drop information
 */
const processStrongboxes = (items) => {
  console.info("Processing strongbox items with drop information");
  const strongboxProcessor = require("../utils/strongboxProcessor");

  // Process strongbox items and add drop information
  // If items are provided, use them; otherwise, get all items from fileParser
  const itemsToProcess = items || fileParser.getAllItems();
  const itemsWithDrops = strongboxProcessor.processStrongboxDrops(itemsToProcess);

  return itemsWithDrops;
};


/**
 * Creates a minimal version of the creatures
 * @param {Array} creatures - Array of complete creatures
 * @returns {Array} - Array of creatures in minimal version
 */
const createMinCreatures = (creatures) => {
  const minCreatures = creatures.map((creature) => {
    const minCreature = {};
    if (creature.name) { minCreature.name = creature.name; }
    if (creature.category) { minCreature.category = creature.category; }
    if (creature.tier) { minCreature.tier = creature.tier; }

    return minCreature;
  });

  return minCreatures;
};

/**
 * Processes and prepares translations for export
 */
const processTranslations = () => {
  // Get translator instance from fileParser
  const translator = fileParser.getTranslator();
  const allItems = fileParser.getAllItems();

  // Add all item names and other translatable fields to the translationsInUse store
  console.log("Adding all item translations to the translationsInUse store...");
  let translationCount = 0;
  for (const item of allItems) {
    if (item.name) {
      translator.addTranslationInUse(item.name, item.name);
      translationCount++;
    }
    if (item.name && item.translation) {
      translator.addTranslationInUse(item.name, item.translation);
      translationCount++;
    }

    if (item.type && item.name) {
      translator.addTranslationInUse(item.type, item.name);
      translationCount++;
    }

    if (item.description) {
      translator.addTranslationInUse(item.description, item.description);
      translationCount++;
    }
  }
  console.log(
    `Added ${translationCount} item translations to the translationsInUse store`,
  );

  // Get translation data
  const translateData = translator.getTranslateFiles();
  console.log(
    `Found ${Object.keys(translateData).length} languages with translations`,
  );

  return translateData;
};

/**
 * Validates and prepares translation data for export
 * @param {Object} fileData - Translation data to validate
 * @returns {Object} - Validated translation data
 */
const validateTranslationData = (fileData) => {
  // The translator module now handles validation internally, but we'll do a final check
  // to ensure the JSON will be valid before writing to the file
  const validatedData = {};
  let skippedEntries = 0;

  // Process each key-value pair to ensure valid JSON
  for (const [key, value] of Object.entries(fileData)) {
    // Skip entries with invalid keys or values
    if (
      !key ||
      typeof key !== "string" ||
      !value ||
      typeof value !== "string"
    ) {
      skippedEntries++;
      continue;
    }

    try {
      // Test if the key and value can be correctly serialized to JSON
      JSON.parse(JSON.stringify({ [key]: value }));
      validatedData[key] = value;
    } catch (error) {
      // If JSON serialization fails, skip this entry
      console.warn(
        `Skipping invalid translation entry for key: ${key.substring(0, 30)}...`,
      );
      skippedEntries++;
    }
  }

  if (skippedEntries > 0) {
    console.warn(
      `Skipped ${skippedEntries} invalid entries for language`,
    );
  }

  return validatedData;
};

module.exports = {
  orderByCategoryAndName,
  orderByName,
  processItems,
  processTechData,
  createMinItems,
  processCreatures,
  createMinCreatures,
  processStrongboxes,
  processTranslations,
  validateTranslationData,
};