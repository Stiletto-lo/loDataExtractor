export type DropData = {
	name?: string | undefined;
	chance?: number | undefined;
	minQuantity?: number | undefined;
	maxQuantity?: number | undefined;
};

export const dropDataTemplate: DropData = {
	name: undefined,
	chance: undefined,
	minQuantity: undefined,
	maxQuantity: undefined,
};

Object.freeze(dropDataTemplate);
