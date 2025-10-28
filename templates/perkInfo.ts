export type PerkInfo = {
	name?: string | undefined;
	description?: string | undefined;
	cost?: number | undefined;
};

export const perkInfoTemplate: PerkInfo = {
	name: undefined,
	description: undefined,
	cost: undefined,
};

Object.freeze(perkInfoTemplate);
