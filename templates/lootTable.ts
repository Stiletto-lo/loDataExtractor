/**
 * Template for a LootTable that is referenced by a DataTable
 * This represents the structure of a LootTable with its properties
 */
import type { DropData } from "./dropData";

export type LootTable = {
	name?: string;
	objectName?: string;
	objectPath?: string;
	runChance?: number;
	minIterations?: number;
	maxIterations?: number;
	perIterationRunChance?: number;
	minQuantityMultiplier?: number;
	maxQuantityMultiplier?: number;
	drops?: DropData[];
};
