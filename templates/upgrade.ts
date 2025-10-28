export type Upgrade = {
	name?: string | undefined;
	profile?: any | undefined;
	super?: string | undefined;
	crafting?: any | undefined;
	upgradeInfo?: any | undefined;
};

export const upgradeTemplate: Upgrade = {
	name: undefined,
	profile: undefined,
	super: undefined,
	crafting: undefined,
	upgradeInfo: undefined,
};

Object.freeze(upgradeTemplate);
