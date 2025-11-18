/**
 * Template for a LootTemplate that contains simplified information
 * This represents the structure of a LootTemplate with only essential properties
 */

export type SimplifiedLootTable = {
	name?: string;
	runChance?: number;
	minIterations?: number;
	maxIterations?: number;
	perIterationRunChance?: number;
	minQuantityMultiplier?: number;
	maxQuantityMultiplier?: number;
};

export type LootTemplate = {
	name?: string;
	type?: string;
	class?: string;
	super?: string;
	tables?: SimplifiedLootTable[];
};
