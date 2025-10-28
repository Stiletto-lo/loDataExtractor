export type Drop = {
	location?: string | undefined;
	chance?: number | undefined;
	minQuantity?: number | undefined;
	maxQuantity?: number | undefined;
};

export const dropTemplate: Drop = {
	location: undefined,
	chance: undefined,
	minQuantity: undefined,
	maxQuantity: undefined,
};

Object.freeze(dropTemplate);
