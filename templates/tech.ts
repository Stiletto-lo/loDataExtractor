/**
 * Template for tech tree entries
 */

export type Tech = {
	name?: string;
	parent?: string;
	category?: string;
	type?: string;
	onlyDevs?: boolean;
	level?: number;
	pointsCost?: number;
	unlocks?: string[];
};
