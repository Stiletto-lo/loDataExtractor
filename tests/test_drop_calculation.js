
const creatureProcessor = require("../utils/creatures/dropProcessor");
const strongboxProcessor = require("../utils/strongboxes/dropProcessor");

console.log("--- Testing Creature Drop Calculation ---");
const mockLootTable = {
    drops: [{ name: "TestItem", chance: 0.5, minQuantity: 1, maxQuantity: 2 }]
};

const mockTableRef = {
    name: "TestTable",
    runChance: 0.5,
    minIterations: 2,
    maxIterations: 2,
    perIterationRunChance: 1.0,
    minQuantityMultiplier: 2,
    maxQuantityMultiplier: 2
};

const creature = { name: "TestCreature", drops: [] };
creatureProcessor.addDropsFromTable(creature, mockLootTable, "TestTable", mockTableRef);

const cDrop = creature.drops[0];
console.log("Creature Drop Result:", cDrop);

const expectedCChance = 0.5 * (0.5 * 2 * 1.0); // dropChance * (runChance * avgIterations * perIterationRunChance) = 0.5 * 0.5 * 2 = 0.5
const expectedCMin = 1 * 2; // minQuantity * minQuantityMultiplier = 2
const expectedCMax = 2 * 2; // maxQuantity * maxQuantityMultiplier = 4

if (cDrop.chance === expectedCChance && cDrop.minQuantity === expectedCMin && cDrop.maxQuantity === expectedCMax) {
    console.log("✅ Creature calculation correct!");
} else {
    console.error("❌ Creature calculation FAILED!");
    console.error(`Expected: chance=${expectedCChance}, min=${expectedCMin}, max=${expectedCMax}`);
}

console.log("\n--- Testing Strongbox Drop Calculation (Casing Check) ---");
const strongbox = { name: "TestStrongbox", drops: [] };
strongboxProcessor.addDropsFromTable(strongbox, mockLootTable, "TestTable", mockTableRef);

const sDrop = strongbox.drops[0];
console.log("Strongbox Drop Result:", sDrop);

if (sDrop.chance === expectedCChance && sDrop.minQuantity === expectedCMin && sDrop.maxQuantity === expectedCMax) {
    console.log("✅ Strongbox calculation correct!");
} else {
    console.error("❌ Strongbox calculation FAILED!");
    console.error(`Expected: chance=${expectedCChance}, min=${expectedCMin}, max=${expectedCMax}`);
}
