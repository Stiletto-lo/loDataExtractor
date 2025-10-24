/**
 * Template for tech tree entries
 */

import type { Tech } from "../types";

const tech: Partial<Tech> = {
	name: undefined,
	parent: undefined,
	category: undefined,
	type: undefined,
	onlyDevs: undefined,
	level: undefined, // Required level to unlock this tech
	pointsCost: undefined, // Points cost required to unlock this tech
	unlocks: undefined, // Array of items that this tech unlocks
} as const;

export default Object.freeze(tech);